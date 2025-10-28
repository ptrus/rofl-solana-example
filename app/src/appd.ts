import { request } from "node:http";
import { existsSync } from "node:fs";

const APPD_SOCKET = "/run/rofl-appd.sock";
type KeyKind = "secp256k1" | "ed25519" | "raw-256" | "raw-386";

export async function generateKey(
  keyId: string,
  kind: KeyKind = "secp256k1"
): Promise<string> {
  if (!existsSync(APPD_SOCKET)) {
    throw new Error("appd socket missing: /run/rofl-appd.sock");
  }
  const body = JSON.stringify({ key_id: keyId, kind });
  return new Promise((resolve, reject) => {
    const req = request(
      {
        method: "POST",
        socketPath: APPD_SOCKET,
        path: "/rofl/v1/keys/generate",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body).toString()
        }
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const { key } = JSON.parse(data);
            if (!key) throw new Error(`Bad response: ${data}`);
            resolve(key.startsWith("0x") ? key : `0x${key}`);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function getAppId(): Promise<string> {
  if (!existsSync(APPD_SOCKET)) {
    throw new Error("appd socket missing: /run/rofl-appd.sock");
  }
  return new Promise((resolve, reject) => {
    const req = request(
      { method: "GET", socketPath: APPD_SOCKET, path: "/rofl/v1/app/id" },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const id = data.trim();
          if (!/^rofl1[0-9a-z]+$/.test(id)) {
            return reject(new Error(`Bad app id: ${data}`));
          }
          resolve(id);
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

export async function setMetadata(metadata: Record<string, string>): Promise<void> {
  if (!existsSync(APPD_SOCKET)) {
    throw new Error("appd socket missing: /run/rofl-appd.sock");
  }
  const body = JSON.stringify(metadata);
  return new Promise((resolve, reject) => {
    const req = request(
      {
        method: "POST",
        socketPath: APPD_SOCKET,
        path: "/rofl/v1/metadata",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body).toString()
        }
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Failed to set metadata: ${res.statusCode} ${data}`));
          }
          resolve();
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

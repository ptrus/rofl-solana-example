import { Keypair, Connection, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey } from '@solana/web3.js';
import { generateKey, setMetadata } from './src/appd.js';

// Generate Ed25519 key inside ROFL enclave.
const secretKeyHex = await generateKey("solana-wallet", "ed25519");
const secretKey = Buffer.from(secretKeyHex.slice(2), 'hex');

// Create wallet from enclave-generated key.
const wallet = Keypair.fromSeed(secretKey);

// Connect to Solana testnet.
const connection = new Connection('https://api.testnet.solana.com', 'confirmed');

console.log('Solana Address:', wallet.publicKey.toBase58());

// Publish wallet address and network to instance metadata.
await setMetadata({
  address: wallet.publicKey.toBase58(),
  network: 'testnet'
});

console.log('Monitoring for incoming transactions...\n');

let previousBalance = 0;
let lastCheckedSignature: string | undefined = undefined;

async function pollBalance() {
  while (true) {
    try {
      const balance = await connection.getBalance(wallet.publicKey);

      if (balance > previousBalance) {
        const received = (balance - previousBalance) / LAMPORTS_PER_SOL;
        console.log(`\n✓ Received ${received} SOL`);

        // Get all transactions since last check.
        const signatures = await connection.getSignaturesForAddress(
          wallet.publicKey,
          lastCheckedSignature ? { until: lastCheckedSignature } : undefined
        );

        if (signatures.length > 0) {
          // Update last checked signature to the most recent one.
          lastCheckedSignature = signatures[0].signature;

          // Collect all senders from the transactions.
          const senders: PublicKey[] = [];

          for (const sig of signatures) {
            const tx = await connection.getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });

            // Find transfer instructions where our wallet is the recipient.
            if (tx?.transaction.message.instructions) {
              for (const instruction of tx.transaction.message.instructions) {
                if (instruction && 'parsed' in instruction && instruction.parsed.type === 'transfer') {
                  const destination = instruction.parsed.info.destination;
                  const source = instruction.parsed.info.source;

                  // Check if we are the destination.
                  if (destination === wallet.publicKey.toBase58()) {
                    senders.push(new PublicKey(source));
                  }
                }
              }
            }
          }

          if (senders.length > 0) {
            // Pick a random sender.
            const randomSender = senders[Math.floor(Math.random() * senders.length)];
            const amountToSend = balance - 5000; // Keep 5000 lamports for tx fee.

            console.log(`Sending ${amountToSend / LAMPORTS_PER_SOL} SOL to random sender: ${randomSender.toBase58()}`);

            // Send most of the balance to random sender.
            const transaction = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: randomSender,
                lamports: amountToSend,
              })
            );

            const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
            console.log(`✓ Sent funds: ${signature}\n`);
          }
        }
      }

      previousBalance = balance;
    } catch (error) {
      console.error('Error:', error);
    }

    await new Promise(resolve => setTimeout(resolve, 60000)); // Poll every 1 minute.
  }
}

pollBalance();

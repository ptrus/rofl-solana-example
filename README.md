# ROFL Solana Example

A **minimal starter example** demonstrating Solana blockchain interaction from inside a [ROFL (Runtime Off-chain Logic)](https://github.com/oasisprotocol/rofl) enclave on the Oasis Network.

This repository serves as a guide for building ROFL apps that interact with Solana, showcasing how to create and manage encumbered wallets within a trusted execution environment.

## What It Does

The app creates an **encumbered wallet** inside the ROFL enclave:
- Private key never leaves the secure enclave
- Wallet address is published in instance metadata for transparency
- Monitors Solana testnet for incoming transactions every minute
- Randomly selects one sender and returns most of the balance (keeping 5000 lamports for fees)
- **The selection algorithm can be independently verified by anyone** - the code running in the enclave is verifiable, ensuring transparency and trust

**For production use**, this example should be extended with:

- **State persistence**: Store the last processed transaction state on-chain (e.g., using Oasis Sapphire) to survive restarts and ensure exactly-once processing.
- **Local Solana client**: Run a local Solana validator or light client inside the enclave instead of relying on remote RPC endpoints, which could provide incorrect data or censor transactions.
- **Enhanced key security**: Consider storing the encumbered wallet's private key on Oasis Sapphire smart contract, accessible only by authorized ROFL instances, or use a multi-sig wallet with keys split across multiple ROFL replicas requiring consensus before executing transactions.
- **Reproducible builds**: Make the Dockerfile reproducible so it can be verified off-chain using the `oasis rofl build --verify` command, allowing anyone to independently verify that the deployed code matches the source code. See the [ROFL build documentation](https://docs.oasis.io/build/tools/cli/rofl#build) for details.

## Live Example

A live deployment is running on testnet with app ID `rofl1qzzzlecmh0m5lc8kjz0n2y7xjp9nj64gyu2q88hp`.

You can inspect the running app using the [Oasis CLI](https://github.com/oasisprotocol/cli) or the [ROFL Registry](https://github.com/ptrus/rofl-registry) tool:

```bash
oasis rofl show rofl1qzzzlecmh0m5lc8kjz0n2y7xjp9nj64gyu2q88hp --network testnet
```

You can also verify that the code running in the enclave matches this repository by running:

```bash
oasis rofl build --verify
```

This builds the application reproducibly and verifies that the enclave identity matches what's deployed on-chain. If successful, you'll see:

```
Built enclave identities MATCH latest manifest enclave identities.
Manifest enclave identities MATCH on-chain enclave identities.
```

This allows anyone to independently verify the selection algorithm and ensure the deployed code is trustworthy.

The attested Solana wallet address generated inside the enclave is published in the instance metadata. If the app has active replicas, you'll see the metadata in the output above, including:

```
net.oasis.app.address: 4kkB49MRXzSi2Ex9YVfkwMYMqpVnWLRoq8T2RrXLJBSP
net.oasis.app.network: testnet
```

The private key never leaves the secure enclave and all transactions are signed inside the trusted execution environment. The metadata published by the enclave is [cryptographically attested](https://github.com/ptrus/rofl-registry?tab=readme-ov-file#a-note-on-attestations), ensuring its authenticity.

## Try It Out

Once you've confirmed the ROFL app is active (in the previous step, check for active replicas), you can test it by sending testnet SOL to the encumbered wallet address. The app polls for transactions every minute, so after about 60 seconds you should receive most of your SOL back (the app keeps 5000 lamports for transaction fees). If multiple people send SOL during the same polling window, one sender will be randomly selected to receive the balance.

Monitor the wallet activity on Solana Explorer:
https://explorer.solana.com/address/4kkB49MRXzSi2Ex9YVfkwMYMqpVnWLRoq8T2RrXLJBSP?cluster=testnet

## Learn More

- [ROFL Registry](https://github.com/ptrus/rofl-registry) - Validate and verify ROFL app attestations on Oasis chain
- [ROFL Documentation](https://docs.oasis.io/build/rofl/)
- [Oasis Network](https://oasisprotocol.org/)

# Favorite Color Program - Solana Learning Project

A complete Solana program that demonstrates core blockchain development concepts by allowing users to store and retrieve their favorite colors on-chain.

## What This Project Teaches

- **Solana Programs**: On-chain smart contracts written in Rust using the Anchor framework
- **Account Management**: How data is stored in blockchain accounts with proper validation
- **Program Derived Addresses (PDAs)**: Deterministic account generation for user-specific data
- **RPC Interactions**: Reading and writing blockchain data using Solana's JSON-RPC API
- **Transaction Handling**: Signing, sending, and confirming blockchain transactions
- **Full-Stack Integration**: Connecting Rust programs with TypeScript clients and React UIs

## Architecture

```
rust-services/          # Anchor program (Rust)
├── programs/favorite-color-program/
│   └── src/lib.rs     # Core program logic
└── Anchor.toml        # Program configuration

ts-services/           # Client services (TypeScript)
├── program-scripts/   # CLI utilities
│   ├── get-color.ts   # Read user colors from blockchain
│   └── set-color.ts   # Write colors to blockchain
├── apps/web/          # React web interface
├── tests/             # Program tests
└── migrations/        # Deployment scripts
```

## Core Solana Concepts Demonstrated

### Programs

Smart contracts that run on-chain. This program has two instructions:

- `initialize`: Creates a new color account for a user
- `update_color`: Modifies an existing color account

### Accounts

Data storage on Solana. Each user gets a unique account storing:

- User's public key (32 bytes)
- Favorite color string (up to 50 characters)

### Program Derived Addresses (PDAs)

Deterministic addresses generated from seeds:

```rust
seeds = [b"user-color", user.key().as_ref()]
```

This ensures each user has exactly one color account.

### RPCs

JSON-RPC endpoints for blockchain interaction:

- Reading account data: `getAccountInfo`
- Sending transactions: `sendTransaction`
- Confirming transactions: `confirmTransaction`

## Quick Start

### 1. Build the Program

```bash
cd rust-services
anchor build
```

### 2. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

### 3. Set Your Favorite Color

```bash
cd ts-services
npx ts-node program-scripts/set-color.ts ~/.config/solana/id.json "ocean blue"
```

### 4. Read Your Color

```bash
npx ts-node program-scripts/get-color.ts <YOUR_PUBLIC_KEY>
```

### 5. Run Web Interface

```bash
cd apps/web
npm run dev
```

## Program Details

**Program ID**: `AMt9tGcfKDkFEVQKAHjLc6Tcs9eSPfwziinE7nFZtAMv`
**Network**: Solana Devnet
**Framework**: Anchor (Rust)

### Account Structure

```rust
pub struct UserColor {
    pub user: Pubkey,    // 32 bytes - owner's public key
    pub color: String,   // variable - favorite color (max 50 chars)
}
```

### Space Calculation

- Discriminator: 8 bytes
- User pubkey: 32 bytes
- String length: 4 bytes
- Color data: 50 bytes (max)
- **Total**: 94 bytes

## Learning Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://book.anchor-lang.com/)
- [Helius RPC Documentation](https://helius.dev/docs)
- [Solana Cookbook](https://solanacookbook.com/)

## Key Files to Study

1. `rust-services/programs/favorite-color-program/src/lib.rs` - Core program logic
2. `ts-services/program-scripts/set-color.ts` - Transaction creation and signing
3. `ts-services/program-scripts/get-color.ts` - Account data deserialization
4. `ts-services/apps/web/src/hooks/use-color.tsx` - Web3 integration patterns
5. `ts-services/tests/favorite-color-program.ts` - Program testing examples

This project provides hands-on experience with the complete Solana development workflow from program deployment to client integration.

# VitaDAO dApp

A full-stack decentralized application for VitaDAO — a longevity research DAO pioneering IP-NFTs to fund and govern early-stage biotech research.

## Stack

| Layer | Tech |
|-------|------|
| Smart Contracts | Soroban Rust (Stellar) |
| Contract Tooling | Cargo + soroban-cli |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (dark theme) |
| Web3 | @stellar/stellar-sdk + Freighter wallet |

## Project Structure

```
vitadao-dapp/
├── contracts/              # Original Solidity contracts (archived — Stellar migration in progress)
├── stellar-contracts/      # Soroban Rust contracts
│   ├── contracts/
│   │   ├── vita-token/                # SEP-41 governance token (100M supply)
│   │   ├── ip-nft/                    # IP-NFT for research IP
│   │   ├── ip-nft-fractionalize/     # Fractionalize IP-NFTs into fungible tokens
│   │   ├── governance/               # DAO governance with VITA voting
│   │   └── research-funding/         # Community crowdfunding for research
│   └── Cargo.toml
└── frontend/               # Vite + React app
    └── src/
        ├── pages/          # Home, Governance, IP-NFTs, Funding, Portfolio
        ├── components/     # Navbar, WalletButton, ProposalCard, IPNFTCard, FundingCard
        ├── hooks/          # useStellar, useGovernor, useIPNFT, useFunding
        ├── context/        # StellarContext (Freighter wallet provider)
        ├── utils/          # formatters, contract addresses, mock data
        └── types/          # TypeScript interfaces
```

## Smart Contracts

### VITA Token (`vita-token`)
SEP-41 compliant fungible token with 100M max supply, admin minting, and burn support. Used for DAO voting weight and governance participation. 7 decimal places.

### IP-NFT (`ip-nft`)
Non-fungible token representing research intellectual property. Each token stores title, research area, researcher address, funding goal, and funding progress. Tracks funding from the research-funding contract.

### IP-NFT Fractionalize (`ip-nft-fractionalize`)
Locks an IP-NFT into a vault and issues fraction tokens, enabling community ownership of research IP. Supports buyout by reclaiming the NFT.

### Governance (`governance`)
DAO governance contract with VITA token voting. Proposals require 100 VITA to create, have a 1-ledger delay and ~50,400 ledger voting period, with 4% quorum.

### Research Funding (`research-funding`)
Crowdfunding contract for research campaigns. Supports XLM contributions, goal-based withdrawal with 2% platform fee, and contributor refunds if campaigns fail.

## Getting Started

### 1. Install dependencies

```bash
# Contracts (Soroban)
cd stellar-contracts
cargo build

# Frontend
cd ../frontend
npm install
```

### 2. Build contracts

```bash
cd stellar-contracts
cargo build --release
```

### 3. Run tests

```bash
cd stellar-contracts
cargo test
```

### 4. Deploy to Futurenet

```bash
# Install soroban-cli if needed
cargo install --locked soroban-cli

# Deploy contracts to Futurenet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/vita_token.wasm \
  --network futurenet

soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/ip_nft.wasm \
  --network futurenet

# ... repeat for other contracts
```

### 5. Run frontend

```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser with Freighter wallet installed.

### 6. Configure contracts

Update the contract IDs in `frontend/src/utils/contracts.ts` with the deployed contract addresses.

## Features

- **Governance Portal** — Browse proposals, vote For/Against/Abstain with VITA tokens
- **IP-NFT Gallery** — View, filter, and fund research IP-NFTs; mint new ones with IPFS metadata
- **Research Funding** — Contribute XLM to community campaigns; create your own
- **Portfolio Dashboard** — VITA balance, owned IP-NFTs, voting history, contributions
- **Wallet Integration** — Freighter wallet connect/disconnect with auto-reconnect (Stellar)

## License

MIT

# VitaDAO dApp

A full-stack decentralized application for VitaDAO — a longevity research DAO pioneering IP-NFTs to fund and govern early-stage biotech research.

## Stack

| Layer | Tech |
|-------|------|
| Smart Contracts | Solidity 0.8.20 + OpenZeppelin v5 |
| Contract Tooling | Hardhat + TypeScript |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (dark theme) |
| Web3 | Ethers.js v6 |
| Routing | React Router v6 |

## Project Structure

```
vitadao-dapp/
├── contracts/          # Hardhat project
│   ├── contracts/
│   │   ├── VITA.sol                  # ERC20Votes governance token (100M supply)
│   │   ├── IPNFT.sol                 # ERC721 IP-NFT for research IP
│   │   ├── IPNFTFractionalize.sol    # Fractionalize IP-NFTs into ERC20
│   │   ├── VitaDAOGovernor.sol       # OpenZeppelin Governor DAO
│   │   └── ResearchFunding.sol       # Community crowdfunding for research
│   ├── scripts/deploy.ts
│   ├── test/VitaDAO.test.ts
│   └── hardhat.config.ts
└── frontend/           # Vite + React app
    └── src/
        ├── pages/      # Home, Governance, IP-NFTs, Funding, Portfolio
        ├── components/ # Navbar, WalletButton, ProposalCard, IPNFTCard, FundingCard
        ├── hooks/      # useWallet, useGovernor, useIPNFT, useFunding
        ├── context/    # Web3Context (ethers.js provider/signer)
        ├── utils/      # formatters, contract ABIs/addresses, mock data
        └── types/      # TypeScript interfaces
```

## Smart Contracts

### VITA.sol
ERC20Votes token with 100M max supply. Used for DAO voting weight and governance participation.

### IPNFT.sol
ERC721 representing research intellectual property. Each token stores title, research area, researcher address, funding goal, and funding progress. Requires a 0.01 ETH mint fee sent to treasury.

### IPNFTFractionalize.sol
Locks an IP-NFT into a vault and issues ERC20 fraction tokens, enabling community ownership of research IP.

### VitaDAOGovernor.sol
OpenZeppelin Governor with VITA token voting. 1-block delay, ~1 week voting period, 4% quorum, 100 VITA proposal threshold.

### ResearchFunding.sol
Crowdfunding contract for research campaigns. Supports ETH contributions, goal-based withdrawal, and contributor refunds if campaigns fail.

## Getting Started

### 1. Install dependencies

```bash
# Contracts
cd contracts
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Compile contracts

```bash
cd contracts
npm run compile
```

### 3. Run tests

```bash
cd contracts
npm test
```

### 4. Deploy locally

```bash
# Terminal 1: start local node
cd contracts
npm run node

# Terminal 2: deploy
npm run deploy:local
```

### 5. Run frontend

```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser with MetaMask installed.

### 6. Deploy to Sepolia

Create a `.env` file in `contracts/`:
```
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

Then:
```bash
npm run deploy:sepolia
```

Update the contract addresses in `frontend/src/utils/contracts.ts` with the deployed addresses from `deployments.json`.

## Features

- **Governance Portal** — Browse proposals, vote For/Against/Abstain with VITA tokens
- **IP-NFT Gallery** — View, filter, and fund research IP-NFTs; mint new ones with IPFS metadata
- **Research Funding** — Contribute ETH to community campaigns; create your own
- **Portfolio Dashboard** — VITA balance, owned IP-NFTs, voting history, contributions
- **Wallet Integration** — MetaMask connect/disconnect with auto-reconnect

## License

MIT

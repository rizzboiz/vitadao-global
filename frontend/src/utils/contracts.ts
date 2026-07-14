// Contract addresses — update after deployment
export const CONTRACT_ADDRESSES: Record<number, Record<string, string>> = {
  // Hardhat local
  31337: {
    VITA: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    IPNFT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    IPNFTFractionalize: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    VitaDAOGovernor: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    ResearchFunding: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  },
  // Sepolia testnet — fill after deploying
  11155111: {
    VITA: "",
    IPNFT: "",
    IPNFTFractionalize: "",
    VitaDAOGovernor: "",
    ResearchFunding: "",
  },
};

export const VITA_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function delegate(address delegatee)",
  "function getVotes(address account) view returns (uint256)",
  "function delegates(address account) view returns (address)",
];

export const IPNFT_ABI = [
  "function mintIPNFT(address researcher, string title, string researchArea, uint256 fundingGoal, string tokenURI_) payable returns (uint256)",
  "function fundIPNFT(uint256 tokenId) payable",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function mintFee() view returns (uint256)",
  "function getIPNFTData(uint256 tokenId) view returns (tuple(string title, string researchArea, address researcher, uint256 fundingGoal, uint256 currentFunding, uint256 mintedAt, bool fractionalized))",
  "event IPNFTMinted(uint256 indexed tokenId, address indexed researcher, string title, string researchArea, uint256 fundingGoal)",
  "event FundingReceived(uint256 indexed tokenId, address indexed funder, uint256 amount)",
];

export const GOVERNOR_ABI = [
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function quorum(uint256 blockNumber) view returns (uint256)",
  "function getVotes(address account, uint256 blockNumber) view returns (uint256)",
];

export const FUNDING_ABI = [
  "function createCampaign(string title, string description, string researchArea, uint256 goal, uint256 durationDays) returns (uint256)",
  "function contribute(uint256 campaignId) payable",
  "function withdraw(uint256 campaignId)",
  "function refund(uint256 campaignId)",
  "function cancelCampaign(uint256 campaignId)",
  "function campaigns(uint256) view returns (uint256 id, address researcher, string title, string description, string researchArea, uint256 goal, uint256 raised, uint256 deadline, bool withdrawn, bool cancelled)",
  "function contributions(uint256, address) view returns (uint256)",
  "function campaignCount() view returns (uint256)",
  "function getProgress(uint256 campaignId) view returns (uint256)",
  "event CampaignCreated(uint256 indexed id, address indexed researcher, string title, uint256 goal, uint256 deadline)",
  "event Contributed(uint256 indexed id, address indexed contributor, uint256 amount)",
];

export function getContractAddress(chainId: number, name: string): string {
  return CONTRACT_ADDRESSES[chainId]?.[name] ?? "";
}

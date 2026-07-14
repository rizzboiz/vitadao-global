export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: "active" | "passed" | "defeated" | "pending" | "executed";
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  startLedger: number;
  endLedger: number;
  category: "research" | "treasury" | "parameter" | "other";
  createdAt: string;
}

export interface IPNFT {
  tokenId: number;
  title: string;
  description: string;
  researchArea: string;
  researcher: string;
  fundingGoal: string;
  currentFunding: string;
  imageUrl: string;
  tokenURI: string;
  mintedAt: string;
  fractionalized: boolean;
  tags: string[];
}

export interface FundingCampaign {
  id: number;
  title: string;
  description: string;
  researchArea: string;
  researcher: string;
  goal: string;
  raised: string;
  deadline: string;
  withdrawn: boolean;
  cancelled: boolean;
  contributors: number;
  imageUrl: string;
}

export interface UserPortfolio {
  address: string;
  vitaBalance: string;
  votingPower: string;
  ownedIPNFTs: IPNFT[];
  contributions: {
    campaignId: number;
    campaignTitle: string;
    amount: string;
  }[];
  votes: {
    proposalId: string;
    proposalTitle: string;
    support: "for" | "against" | "abstain";
    weight: string;
  }[];
}

export interface WalletState {
  address: string | null;
  network: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
}

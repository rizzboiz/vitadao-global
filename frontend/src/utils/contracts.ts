// Soroban contract IDs — update after deploying to Stellar
export const CONTRACT_ADDRESSES: Record<string, Record<string, string>> = {
  futurenet: {
    VITA: "CCJZ5G3HYL5X5QY5QY5QY5QY5QY5QY5QY5QY5QY5QY5QY5QY5QY5Q",
    IPNFT: "",
    IPNFTFractionalize: "",
    VitaDAOGovernor: "",
    ResearchFunding: "",
  },
  testnet: {
    VITA: "",
    IPNFT: "",
    IPNFTFractionalize: "",
    VitaDAOGovernor: "",
    ResearchFunding: "",
  },
  mainnet: {
    VITA: "",
    IPNFT: "",
    IPNFTFractionalize: "",
    VitaDAOGovernor: "",
    ResearchFunding: "",
  },
};

export function getContractId(network: string, name: string): string {
  return CONTRACT_ADDRESSES[network]?.[name] ?? "";
}

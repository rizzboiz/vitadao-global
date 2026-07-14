import { useState, useCallback } from "react";
import { Contract } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { GOVERNOR_ABI, getContractAddress } from "../utils/contracts";

export type VoteSupport = 0 | 1 | 2; // 0=Against, 1=For, 2=Abstain

export function useGovernor() {
  const { signer, chainId } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!signer || !chainId) return null;
    const address = getContractAddress(chainId, "VitaDAOGovernor");
    if (!address) return null;
    return new Contract(address, GOVERNOR_ABI, signer);
  }, [signer, chainId]);

  const castVote = useCallback(
    async (proposalId: string, support: VoteSupport, reason?: string) => {
      const contract = getContract();
      if (!contract) {
        setError("Wallet not connected");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setTxHash(null);

      try {
        let tx;
        if (reason) {
          tx = await contract.castVoteWithReason(proposalId, support, reason);
        } else {
          tx = await contract.castVote(proposalId, support);
        }
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        return receipt;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Vote failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  const checkHasVoted = useCallback(
    async (proposalId: string, voterAddress: string): Promise<boolean> => {
      const contract = getContract();
      if (!contract) return false;
      try {
        return await contract.hasVoted(proposalId, voterAddress);
      } catch {
        return false;
      }
    },
    [getContract]
  );

  return {
    castVote,
    checkHasVoted,
    isLoading,
    error,
    txHash,
  };
}

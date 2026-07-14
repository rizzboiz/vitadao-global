import { useState, useCallback } from "react";
import { ethers, Contract } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { FUNDING_ABI, getContractAddress } from "../utils/contracts";

export function useFunding() {
  const { signer, chainId } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!signer || !chainId) return null;
    const address = getContractAddress(chainId, "ResearchFunding");
    if (!address) return null;
    return new Contract(address, FUNDING_ABI, signer);
  }, [signer, chainId]);

  const createCampaign = useCallback(
    async (params: {
      title: string;
      description: string;
      researchArea: string;
      goalEth: string;
      durationDays: number;
    }) => {
      const contract = getContract();
      if (!contract) {
        setError("Wallet not connected");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const goalWei = ethers.parseEther(params.goalEth);
        const tx = await contract.createCampaign(
          params.title,
          params.description,
          params.researchArea,
          goalWei,
          params.durationDays
        );
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        return receipt;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Create campaign failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  const contribute = useCallback(
    async (campaignId: number, amountEth: string) => {
      const contract = getContract();
      if (!contract) {
        setError("Wallet not connected");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tx = await contract.contribute(campaignId, {
          value: ethers.parseEther(amountEth),
        });
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        return receipt;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Contribution failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  const withdraw = useCallback(
    async (campaignId: number) => {
      const contract = getContract();
      if (!contract) {
        setError("Wallet not connected");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tx = await contract.withdraw(campaignId);
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        return receipt;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Withdrawal failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  return {
    createCampaign,
    contribute,
    withdraw,
    isLoading,
    error,
    txHash,
  };
}

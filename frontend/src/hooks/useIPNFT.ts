import { useState, useCallback } from "react";
import { ethers, Contract } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { IPNFT_ABI, getContractAddress } from "../utils/contracts";

export function useIPNFT() {
  const { signer, chainId } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!signer || !chainId) return null;
    const address = getContractAddress(chainId, "IPNFT");
    if (!address) return null;
    return new Contract(address, IPNFT_ABI, signer);
  }, [signer, chainId]);

  const mintIPNFT = useCallback(
    async (params: {
      title: string;
      researchArea: string;
      fundingGoal: string; // ETH string
      tokenURI: string;
    }) => {
      const contract = getContract();
      if (!contract || !signer) {
        setError("Wallet not connected");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const address = await signer.getAddress();
        const mintFee = await contract.mintFee();
        const fundingGoalWei = ethers.parseEther(params.fundingGoal);

        const tx = await contract.mintIPNFT(
          address,
          params.title,
          params.researchArea,
          fundingGoalWei,
          params.tokenURI,
          { value: mintFee }
        );

        setTxHash(tx.hash);
        const receipt = await tx.wait();
        return receipt;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Mint failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getContract, signer]
  );

  const fundIPNFT = useCallback(
    async (tokenId: number, amountEth: string) => {
      const contract = getContract();
      if (!contract) {
        setError("Wallet not connected");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tx = await contract.fundIPNFT(tokenId, {
          value: ethers.parseEther(amountEth),
        });
        setTxHash(tx.hash);
        const receipt = await tx.wait();
        return receipt;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Funding failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getContract]
  );

  return {
    mintIPNFT,
    fundIPNFT,
    isLoading,
    error,
    txHash,
  };
}

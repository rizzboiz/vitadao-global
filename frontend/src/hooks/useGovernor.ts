import { useState, useCallback } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useStellar } from "../context/StellarContext";
import { getContractId } from "../utils/contracts";

export type VoteSupport = 0 | 1 | 2;

export function useGovernor() {
  const { address, network, server, signTransaction, networkPassphrase } = useStellar();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const getContractIdForNetwork = useCallback(() => {
    if (!network) return null;
    return getContractId(network, "VitaDAOGovernor") || null;
  }, [network]);

  const castVote = useCallback(
    async (proposalId: string, support: VoteSupport, reason?: string) => {
      if (!address || !server || !networkPassphrase) {
        setError("Wallet not connected");
        return null;
      }
      const contractId = getContractIdForNetwork();
      if (!contractId) {
        setError("Governance contract not deployed");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const account = await server.getAccount(address);
        const contract = new StellarSdk.Contract(contractId);

        let call = contract.call("cast_vote", ...(reason ? [proposalId, support.toString(), reason] : [proposalId, support.toString(), ""]));

        const tx = new StellarSdk.TransactionBuilder(account, {
          fee: "100",
          networkPassphrase,
        })
          .addOperation(call)
          .setTimeout(30)
          .build();

        const signedTx = await signTransaction(tx.toXDR());
        const txResult = await server.sendTransaction(StellarSdk.TransactionBuilder.fromXDR(signedTx, networkPassphrase));
        setTxHash(txResult.hash);
        return txResult;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Vote failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, server, networkPassphrase, signTransaction, getContractIdForNetwork]
  );

  const checkHasVoted = useCallback(
    async (proposalId: string, voterAddress: string): Promise<boolean> => {
      if (!server) return false;
      const contractId = getContractIdForNetwork();
      if (!contractId) return false;
      try {
        const contract = new StellarSdk.Contract(contractId);
        const result = await contract.call("has_voted", proposalId, voterAddress);
        return result === "true";
      } catch {
        return false;
      }
    },
    [server, getContractIdForNetwork]
  );

  return {
    castVote,
    checkHasVoted,
    isLoading,
    error,
    txHash,
  };
}

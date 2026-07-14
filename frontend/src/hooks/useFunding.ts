import { useState, useCallback } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useStellar } from "../context/StellarContext";
import { getContractId } from "../utils/contracts";

export function useFunding() {
  const { address, network, server, signTransaction, networkPassphrase } = useStellar();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const getContractIdForNetwork = useCallback(() => {
    if (!network) return null;
    return getContractId(network, "ResearchFunding") || null;
  }, [network]);

  const createCampaign = useCallback(
    async (params: {
      title: string;
      description: string;
      researchArea: string;
      goalXlm: string;
      durationDays: number;
    }) => {
      if (!address || !server || !networkPassphrase) {
        setError("Wallet not connected");
        return null;
      }
      const contractId = getContractIdForNetwork();
      if (!contractId) {
        setError("ResearchFunding contract not deployed");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const account = await server.getAccount(address);
        const contract = new StellarSdk.Contract(contractId);
        const goalStroops = new StellarSdk.ScVal.ScvI128(
          BigInt(Math.floor(parseFloat(params.goalXlm) * 10_000_000))
        );

        const call = contract.call(
          "create_campaign",
          new StellarSdk.ScVal.ScvString(params.title),
          new StellarSdk.ScVal.ScvString(params.description),
          new StellarSdk.ScVal.ScvString(params.researchArea),
          goalStroops,
          new StellarSdk.ScVal.ScvU32(params.durationDays)
        );

        const tx = new StellarSdk.TransactionBuilder(account, {
          fee: "100",
          networkPassphrase,
        })
          .addOperation(call)
          .setTimeout(30)
          .build();

        const signedTx = await signTransaction(tx.toXDR());
        const txResult = await server.sendTransaction(
          StellarSdk.TransactionBuilder.fromXDR(signedTx, networkPassphrase)
        );
        setTxHash(txResult.hash);
        return txResult;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Create campaign failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, server, networkPassphrase, signTransaction, getContractIdForNetwork]
  );

  const contribute = useCallback(
    async (campaignId: number, amountXlm: string) => {
      if (!address || !server || !networkPassphrase) {
        setError("Wallet not connected");
        return null;
      }
      const contractId = getContractIdForNetwork();
      if (!contractId) {
        setError("ResearchFunding contract not deployed");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const account = await server.getAccount(address);
        const contract = new StellarSdk.Contract(contractId);
        const amountStroops = BigInt(Math.floor(parseFloat(amountXlm) * 10_000_000));

        const call = contract.call(
          "contribute",
          new StellarSdk.ScVal.ScvU32(campaignId),
          new StellarSdk.ScVal.ScvI128(amountStroops)
        );

        const tx = new StellarSdk.TransactionBuilder(account, {
          fee: "100",
          networkPassphrase,
        })
          .addOperation(call)
          .setTimeout(30)
          .build();

        const signedTx = await signTransaction(tx.toXDR());
        const txResult = await server.sendTransaction(
          StellarSdk.TransactionBuilder.fromXDR(signedTx, networkPassphrase)
        );
        setTxHash(txResult.hash);
        return txResult;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Contribution failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, server, networkPassphrase, signTransaction, getContractIdForNetwork]
  );

  const withdraw = useCallback(
    async (campaignId: number) => {
      if (!address || !server || !networkPassphrase) {
        setError("Wallet not connected");
        return null;
      }
      const contractId = getContractIdForNetwork();
      if (!contractId) {
        setError("ResearchFunding contract not deployed");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const account = await server.getAccount(address);
        const contract = new StellarSdk.Contract(contractId);

        const call = contract.call("withdraw", new StellarSdk.ScVal.ScvU32(campaignId));

        const tx = new StellarSdk.TransactionBuilder(account, {
          fee: "100",
          networkPassphrase,
        })
          .addOperation(call)
          .setTimeout(30)
          .build();

        const signedTx = await signTransaction(tx.toXDR());
        const txResult = await server.sendTransaction(
          StellarSdk.TransactionBuilder.fromXDR(signedTx, networkPassphrase)
        );
        setTxHash(txResult.hash);
        return txResult;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Withdrawal failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, server, networkPassphrase, signTransaction, getContractIdForNetwork]
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

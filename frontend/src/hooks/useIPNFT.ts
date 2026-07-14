import { useState, useCallback } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useStellar } from "../context/StellarContext";
import { getContractId } from "../utils/contracts";

export function useIPNFT() {
  const { address, network, server, signTransaction, networkPassphrase } = useStellar();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const getContractIdForNetwork = useCallback(() => {
    if (!network) return null;
    return getContractId(network, "IPNFT") || null;
  }, [network]);

  const mintIPNFT = useCallback(
    async (params: {
      title: string;
      researchArea: string;
      fundingGoal: string;
      tokenURI: string;
    }) => {
      if (!address || !server || !networkPassphrase) {
        setError("Wallet not connected");
        return null;
      }
      const contractId = getContractIdForNetwork();
      if (!contractId) {
        setError("IPNFT contract not deployed");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const account = await server.getAccount(address);
        const contract = new StellarSdk.Contract(contractId);
        const goalStroops = BigInt(Math.floor(parseFloat(params.fundingGoal) * 10_000_000));

        const call = contract.call(
          "mint",
          new StellarSdk.ScVal.ScvAddress(address),
          new StellarSdk.ScVal.ScvString(params.title),
          new StellarSdk.ScVal.ScvString(params.researchArea),
          new StellarSdk.ScVal.ScvString(params.tokenURI),
          new StellarSdk.ScVal.ScvI128(goalStroops)
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
        const message = err instanceof Error ? err.message : "Mint failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, server, networkPassphrase, signTransaction, getContractIdForNetwork]
  );

  const fundIPNFT = useCallback(
    async (tokenId: number, amountXlm: string) => {
      if (!address || !server || !networkPassphrase) {
        setError("Wallet not connected");
        return null;
      }
      const contractId = getContractIdForNetwork();
      if (!contractId) {
        setError("IPNFT contract not deployed");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const account = await server.getAccount(address);
        const contract = new StellarSdk.Contract(contractId);
        const amountStroops = BigInt(Math.floor(parseFloat(amountXlm) * 10_000_000));

        const call = contract.call(
          "record_funding",
          new StellarSdk.ScVal.ScvU32(tokenId),
          new StellarSdk.ScVal.ScvAddress(address),
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
        const message = err instanceof Error ? err.message : "Funding failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, server, networkPassphrase, signTransaction, getContractIdForNetwork]
  );

  return {
    mintIPNFT,
    fundIPNFT,
    isLoading,
    error,
    txHash,
  };
}

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import * as StellarSdk from "@stellar/stellar-sdk";

declare global {
  interface Window {
    stellar?: {
      isConnected: () => Promise<{ isConnected: boolean }>;
      getAddress: () => Promise<{ address: string }>;
      getNetworkDetails: () => Promise<{ network: string; networkPassphrase: string }>;
      signTransaction: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<{ signedTxXdr: string }>;
    };
  }
}

interface StellarContextType {
  address: string | null;
  network: string | null;
  networkPassphrase: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  server: StellarSdk.SorobanRpc.Server | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  signTransaction: (xdr: string) => Promise<string>;
}

const FUTURENET_PASSPHRASE = StellarSdk.Networks.FUTURENET;
const MAINNET_PASSPHRASE = StellarSdk.Networks.PUBLIC;
const TESTNET_PASSPHRASE = StellarSdk.Networks.TESTNET;

const StellarContext = createContext<StellarContextType>({
  address: null,
  network: null,
  networkPassphrase: null,
  isConnected: false,
  isConnecting: false,
  balance: "0",
  server: null,
  connect: async () => {},
  disconnect: () => {},
  error: null,
  signTransaction: async () => "",
});

export function StellarProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState("0");
  const [error, setError] = useState<string | null>(null);

  const rpcUrl = import.meta.env.VITE_SOROBAN_RPC_URL || "https://rpc-futurenet.stellar.org:443";
  const server = new StellarSdk.SorobanRpc.Server(rpcUrl);

  const loadBalance = useCallback(async (pubKey: string, passphrase: string) => {
    try {
      if (passphrase === FUTURENET_PASSPHRASE || passphrase === TESTNET_PASSPHRASE) {
        const account = await server.getAccount(pubKey);
        setBalance(StellarSdk.Operation.parseOperationResult(account.balance).toString());
      }
    } catch {
      setBalance("0");
    }
  }, [server]);

  const connect = useCallback(async () => {
    if (!window.stellar) {
      setError("Freighter wallet not found. Please install Freighter to continue.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const { address: pubKey } = await window.stellar.getAddress();
      const { network: net, networkPassphrase: passphrase } = await window.stellar.getNetworkDetails();

      setAddress(pubKey);
      setNetwork(net);
      setNetworkPassphrase(passphrase);
      await loadBalance(pubKey, passphrase);
      localStorage.setItem("vitadao_stellar_connected", "true");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [loadBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setNetwork(null);
    setNetworkPassphrase(null);
    setBalance("0");
    setError(null);
    localStorage.removeItem("vitadao_stellar_connected");
  }, []);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    if (!window.stellar || !networkPassphrase) {
      throw new Error("Wallet not connected");
    }
    const { signedTxXdr } = await window.stellar.signTransaction(xdr, { networkPassphrase });
    return signedTxXdr;
  }, [networkPassphrase]);

  useEffect(() => {
    const wasConnected = localStorage.getItem("vitadao_stellar_connected");
    if (wasConnected && window.stellar) {
      connect();
    }
  }, [connect]);

  return (
    <StellarContext.Provider
      value={{
        address,
        network,
        networkPassphrase,
        isConnected: !!address,
        isConnecting,
        balance,
        server,
        connect,
        disconnect,
        error,
        signTransaction,
      }}
    >
      {children}
    </StellarContext.Provider>
  );
}

export function useStellar() {
  return useContext(StellarContext);
}

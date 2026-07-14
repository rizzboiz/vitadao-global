import { useStellar } from "../context/StellarContext";

export function useWallet() {
  const {
    address,
    network,
    isConnected,
    isConnecting,
    balance,
    connect,
    disconnect,
    error,
  } = useStellar();

  return {
    address,
    network,
    isConnected,
    isConnecting,
    balance,
    connect,
    disconnect,
    error,
  };
}

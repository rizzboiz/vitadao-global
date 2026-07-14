import { useWeb3 } from "../context/Web3Context";

export function useWallet() {
  const {
    address,
    chainId,
    isConnected,
    isConnecting,
    balance,
    connect,
    disconnect,
    error,
  } = useWeb3();

  const isCorrectNetwork = chainId === 31337 || chainId === 11155111;

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia
      });
    } catch (err: unknown) {
      // Chain not added — add it
      const error = err as { code: number };
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    }
  };

  return {
    address,
    chainId,
    isConnected,
    isConnecting,
    balance,
    connect,
    disconnect,
    error,
    isCorrectNetwork,
    switchToSepolia,
  };
}

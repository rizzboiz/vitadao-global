import { Wallet, LogOut, AlertCircle, Loader2 } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { shortenAddress } from "../utils/formatters";

export default function WalletButton() {
  const { address, isConnected, isConnecting, balance, connect, disconnect, error } =
    useWallet();

  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vita-purple/20 text-vita-purple-light text-sm font-medium cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (error) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
        title={error}
      >
        <AlertCircle className="w-4 h-4" />
        Retry
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-vita-dark-card border border-vita-dark-border">
          <div className="w-2 h-2 rounded-full bg-vita-teal animate-pulse-slow" />
          <span className="text-sm text-gray-300 font-mono">
            {shortenAddress(address)}
          </span>
          <span className="text-xs text-gray-500 border-l border-vita-dark-border pl-2">
            {parseFloat(balance).toFixed(3)} XLM
          </span>
        </div>
        <button
          onClick={disconnect}
          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Disconnect wallet"
          aria-label="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vita-purple hover:bg-vita-purple/80 text-white text-sm font-medium transition-colors"
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </button>
  );
}

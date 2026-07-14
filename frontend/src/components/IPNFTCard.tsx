import { useState } from "react";
import { Layers, User, Target, Zap, ExternalLink, Loader2 } from "lucide-react";
import type { IPNFT } from "../types";
import { shortenAddress, progressPercent } from "../utils/formatters";
import { useIPNFT } from "../hooks/useIPNFT";
import { useWeb3 } from "../context/Web3Context";

interface IPNFTCardProps {
  ipnft: IPNFT;
}

export default function IPNFTCard({ ipnft }: IPNFTCardProps) {
  const [fundAmount, setFundAmount] = useState("");
  const [showFund, setShowFund] = useState(false);
  const [funded, setFunded] = useState(false);
  const { fundIPNFT, isLoading } = useIPNFT();
  const { isConnected } = useWeb3();

  const progress = progressPercent(ipnft.currentFunding, ipnft.fundingGoal);
  const isFunded = parseFloat(ipnft.currentFunding) >= parseFloat(ipnft.fundingGoal);

  const handleFund = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) return;
    const receipt = await fundIPNFT(ipnft.tokenId, fundAmount);
    if (receipt) {
      setFunded(true);
      setShowFund(false);
    }
  };

  return (
    <div className="bg-vita-dark-card border border-vita-dark-border rounded-xl overflow-hidden hover:border-vita-purple/40 transition-all group animate-fade-in">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-800">
        <img
          src={ipnft.imageUrl}
          alt={ipnft.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/400x300/1a1a2e/7c3aed?text=IP-NFT";
          }}
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {ipnft.fractionalized && (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-vita-purple/80 text-white backdrop-blur-sm">
              <Layers className="w-3 h-3" />
              Fractionalized
            </span>
          )}
          {isFunded && (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-vita-teal/80 text-white backdrop-blur-sm">
              <Zap className="w-3 h-3" />
              Funded
            </span>
          )}
        </div>
        <span className="absolute top-3 right-3 text-xs font-mono bg-black/50 text-gray-300 px-2 py-1 rounded backdrop-blur-sm">
          #{ipnft.tokenId}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-1">
          <span className="text-xs text-vita-teal font-medium">{ipnft.researchArea}</span>
        </div>
        <h3 className="text-white font-semibold text-sm leading-snug mb-2 line-clamp-2">
          {ipnft.title}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">
          {ipnft.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {ipnft.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Researcher */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <User className="w-3 h-3" />
          <span className="font-mono">{shortenAddress(ipnft.researcher)}</span>
        </div>

        {/* Funding progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-gray-400">
              <Target className="w-3 h-3" />
              Funding
            </span>
            <span className="text-gray-300">
              {ipnft.currentFunding} / {ipnft.fundingGoal} ETH
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-vita-purple to-vita-teal rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 mt-1 block">{progress}% funded</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-vita-dark-border">
          <a
            href={`https://ipfs.io/ipfs/${ipnft.tokenURI.replace("ipfs://", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-vita-teal transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            IPFS
          </a>
          {!isFunded && isConnected && !funded && (
            <button
              onClick={() => setShowFund(!showFund)}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-vita-purple/20 text-vita-purple-light hover:bg-vita-purple/30 transition-colors"
            >
              Fund Research
            </button>
          )}
          {funded && (
            <span className="ml-auto text-xs text-vita-teal flex items-center gap-1">
              <Zap className="w-3 h-3" /> Funded!
            </span>
          )}
        </div>

        {/* Fund input */}
        {showFund && (
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              placeholder="ETH amount"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              min="0"
              step="0.01"
              className="flex-1 bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-vita-purple"
            />
            <button
              onClick={handleFund}
              disabled={isLoading || !fundAmount}
              className="px-3 py-1.5 rounded-lg bg-vita-teal text-vita-dark text-xs font-medium hover:bg-vita-teal-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

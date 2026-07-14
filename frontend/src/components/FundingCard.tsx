import { useState } from "react";
import { Users, Clock, Target, TrendingUp, Loader2, CheckCircle } from "lucide-react";
import type { FundingCampaign } from "../types";
import {
  shortenAddress,
  progressPercent,
  formatTimeRemaining,
} from "../utils/formatters";
import { useFunding } from "../hooks/useFunding";
import { useWeb3 } from "../context/Web3Context";

interface FundingCardProps {
  campaign: FundingCampaign;
}

const AREA_COLORS: Record<string, string> = {
  "Rejuvenation Biotech": "text-vita-purple-light",
  Biomarkers: "text-vita-teal",
  "Metabolic Aging": "text-yellow-400",
  "Tools & Infrastructure": "text-blue-400",
};

export default function FundingCard({ campaign }: FundingCardProps) {
  const [amount, setAmount] = useState("");
  const [contributed, setContributed] = useState(false);
  const { contribute, isLoading } = useFunding();
  const { isConnected } = useWeb3();

  const progress = progressPercent(campaign.raised, campaign.goal);
  const isGoalMet = parseFloat(campaign.raised) >= parseFloat(campaign.goal);
  const areaColor = AREA_COLORS[campaign.researchArea] ?? "text-gray-400";

  const handleContribute = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const receipt = await contribute(campaign.id, amount);
    if (receipt) {
      setContributed(true);
      setAmount("");
    }
  };

  return (
    <div className="bg-vita-dark-card border border-vita-dark-border rounded-xl overflow-hidden hover:border-vita-teal/30 transition-all animate-fade-in">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-800">
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/600x400/1a1a2e/14b8a6?text=Research";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-vita-dark-card to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex justify-between items-end">
            <span className={`text-xs font-medium ${areaColor}`}>
              {campaign.researchArea}
            </span>
            {campaign.withdrawn && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                Funded ✓
              </span>
            )}
            {campaign.cancelled && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Cancelled
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-white font-semibold text-sm leading-snug mb-2">
          {campaign.title}
        </h3>
        <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-3">
          {campaign.description}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-vita-teal mb-1">
              <TrendingUp className="w-3 h-3" />
            </div>
            <p className="text-white text-xs font-semibold">{campaign.raised} ETH</p>
            <p className="text-gray-500 text-xs">Raised</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-vita-purple-light mb-1">
              <Target className="w-3 h-3" />
            </div>
            <p className="text-white text-xs font-semibold">{campaign.goal} ETH</p>
            <p className="text-gray-500 text-xs">Goal</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
              <Users className="w-3 h-3" />
            </div>
            <p className="text-white text-xs font-semibold">{campaign.contributors}</p>
            <p className="text-gray-500 text-xs">Backers</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">{progress}% funded</span>
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTimeRemaining(campaign.deadline)}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isGoalMet
                  ? "bg-vita-teal"
                  : "bg-gradient-to-r from-vita-purple to-vita-teal"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Researcher */}
        <p className="text-xs text-gray-500 mb-4 font-mono">
          by {shortenAddress(campaign.researcher)}
        </p>

        {/* Contribute */}
        {!campaign.cancelled && !campaign.withdrawn && !isGoalMet && (
          <>
            {contributed ? (
              <div className="flex items-center justify-center gap-2 py-2 text-vita-teal text-sm">
                <CheckCircle className="w-4 h-4" />
                Thanks for contributing!
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="ETH amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={!isConnected}
                  className="flex-1 bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vita-teal disabled:opacity-40"
                />
                <button
                  onClick={handleContribute}
                  disabled={!isConnected || isLoading || !amount}
                  className="px-4 py-2 rounded-lg bg-vita-teal text-vita-dark text-sm font-medium hover:bg-vita-teal-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fund"}
                </button>
              </div>
            )}
            {!isConnected && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Connect wallet to contribute
              </p>
            )}
          </>
        )}

        {isGoalMet && !campaign.withdrawn && (
          <div className="flex items-center justify-center gap-2 py-2 text-vita-teal text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Goal reached!
          </div>
        )}
      </div>
    </div>
  );
}

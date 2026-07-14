import { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { Proposal } from "../types";
import { shortenAddress, votePercent, formatDate } from "../utils/formatters";
import { useGovernor } from "../hooks/useGovernor";
import { useStellar } from "../context/StellarContext";

interface ProposalCardProps {
  proposal: Proposal;
}

const STATUS_CONFIG = {
  active: { label: "Active", color: "bg-vita-teal/10 text-vita-teal border-vita-teal/30" },
  passed: { label: "Passed", color: "bg-green-500/10 text-green-400 border-green-500/30" },
  defeated: { label: "Defeated", color: "bg-red-500/10 text-red-400 border-red-500/30" },
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  executed: { label: "Executed", color: "bg-vita-purple/10 text-vita-purple-light border-vita-purple/30" },
};

const CATEGORY_CONFIG = {
  research: { label: "Research", color: "text-vita-teal" },
  treasury: { label: "Treasury", color: "text-yellow-400" },
  parameter: { label: "Parameter", color: "text-vita-purple-light" },
  other: { label: "Other", color: "text-gray-400" },
};

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [voted, setVoted] = useState<"for" | "against" | "abstain" | null>(null);
  const { castVote, isLoading } = useGovernor();
  const { isConnected } = useStellar();

  const totalVotes =
    parseFloat(proposal.forVotes) +
    parseFloat(proposal.againstVotes) +
    parseFloat(proposal.abstainVotes);

  const forPct = votePercent(proposal.forVotes, totalVotes.toString());
  const againstPct = votePercent(proposal.againstVotes, totalVotes.toString());

  const handleVote = async (support: 0 | 1 | 2) => {
    const label = support === 1 ? "for" : support === 0 ? "against" : "abstain";
    const receipt = await castVote(proposal.id, support);
    if (receipt) setVoted(label as typeof voted);
  };

  const statusCfg = STATUS_CONFIG[proposal.status];
  const categoryCfg = CATEGORY_CONFIG[proposal.category];

  return (
    <div className="bg-vita-dark-card border border-vita-dark-border rounded-xl p-5 hover:border-vita-purple/30 transition-colors animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}
            >
              {statusCfg.label}
            </span>
            <span className={`text-xs font-medium ${categoryCfg.color}`}>
              {categoryCfg.label}
            </span>
          </div>
          <h3 className="text-white font-semibold text-sm sm:text-base leading-snug">
            {proposal.title}
          </h3>
        </div>
        <span className="text-gray-500 text-xs font-mono shrink-0">
          #{proposal.id}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {shortenAddress(proposal.proposer)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(proposal.createdAt)}
        </span>
      </div>

      {/* Vote bars */}
      {totalVotes > 0 && (
        <div className="space-y-2 mb-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> For
              </span>
              <span className="text-green-400">{forPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${forPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-red-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Against
              </span>
              <span className="text-red-400">{againstPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all"
                style={{ width: `${againstPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Expand description */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors mb-3"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Less" : "More details"}
      </button>

      {expanded && (
        <p className="text-gray-400 text-sm leading-relaxed mb-4 border-t border-vita-dark-border pt-3">
          {proposal.description}
        </p>
      )}

      {/* Vote buttons */}
      {proposal.status === "active" && (
        <div className="flex gap-2 pt-2 border-t border-vita-dark-border">
          {voted ? (
            <div className="flex items-center gap-2 text-sm text-vita-teal">
              <AlertCircle className="w-4 h-4" />
              Voted: <span className="capitalize font-medium">{voted}</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => handleVote(1)}
                disabled={!isConnected || isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />}
                For
              </button>
              <button
                onClick={() => handleVote(0)}
                disabled={!isConnected || isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsDown className="w-3 h-3" />}
                Against
              </button>
              <button
                onClick={() => handleVote(2)}
                disabled={!isConnected || isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Minus className="w-3 h-3" />}
                Abstain
              </button>
            </>
          )}
        </div>
      )}

      {!isConnected && proposal.status === "active" && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Connect wallet to vote
        </p>
      )}
    </div>
  );
}

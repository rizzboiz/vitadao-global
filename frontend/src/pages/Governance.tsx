import { useState } from "react";
import { Vote, Filter, Search, PlusCircle } from "lucide-react";
import { MOCK_PROPOSALS } from "../utils/mockData";
import ProposalCard from "../components/ProposalCard";
import type { Proposal } from "../types";
import { useStellar } from "../context/StellarContext";

type StatusFilter = "all" | Proposal["status"];
type CategoryFilter = "all" | Proposal["category"];

export default function Governance() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const { isConnected } = useStellar();

  const filtered = MOCK_PROPOSALS.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const counts = {
    active: MOCK_PROPOSALS.filter((p) => p.status === "active").length,
    passed: MOCK_PROPOSALS.filter((p) => p.status === "passed").length,
    defeated: MOCK_PROPOSALS.filter((p) => p.status === "defeated").length,
  };

  return (
    <div className="min-h-screen bg-vita-dark py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Vote className="w-6 h-6 text-vita-purple-light" />
              Governance
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Vote on research proposals using your VITA tokens
            </p>
          </div>
          {isConnected && (
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vita-purple hover:bg-vita-purple/80 text-white text-sm font-medium transition-colors">
              <PlusCircle className="w-4 h-4" />
              New Proposal
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Active", count: counts.active, color: "text-vita-teal" },
            { label: "Passed", count: counts.passed, color: "text-green-400" },
            { label: "Defeated", count: counts.defeated, color: "text-red-400" },
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className="bg-vita-dark-card border border-vita-dark-border rounded-xl p-4 text-center"
            >
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-gray-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-vita-dark-card border border-vita-dark-border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vita-purple"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-vita-dark-card border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vita-purple"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="passed">Passed</option>
              <option value="defeated">Defeated</option>
              <option value="executed">Executed</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="bg-vita-dark-card border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vita-purple"
            >
              <option value="all">All Categories</option>
              <option value="research">Research</option>
              <option value="treasury">Treasury</option>
              <option value="parameter">Parameter</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Vote className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No proposals found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

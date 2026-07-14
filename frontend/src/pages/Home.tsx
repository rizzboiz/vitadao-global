import { Link } from "react-router-dom";
import {
  ArrowRight,
  Dna,
  Vote,
  Coins,
  BarChart3,
  Users,
  Shield,
  TrendingUp,
  FlaskConical,
} from "lucide-react";
import { MOCK_STATS, MOCK_IPNFTS, MOCK_PROPOSALS } from "../utils/mockData";
import IPNFTCard from "../components/IPNFTCard";
import ProposalCard from "../components/ProposalCard";

const STATS = [
  { label: "Total Funded", value: MOCK_STATS.totalFunded, icon: TrendingUp, color: "text-vita-teal" },
  { label: "Active Proposals", value: MOCK_STATS.activeProposals, icon: Vote, color: "text-vita-purple-light" },
  { label: "IP-NFTs Minted", value: MOCK_STATS.ipnftsMinted, icon: Dna, color: "text-yellow-400" },
  { label: "Community Members", value: MOCK_STATS.communityMembers, icon: Users, color: "text-vita-teal" },
];

const FEATURES = [
  {
    icon: Dna,
    title: "IP-NFTs",
    description:
      "Mint and fractionalize intellectual property as NFTs, enabling decentralized ownership of longevity research.",
    color: "from-vita-purple to-vita-purple/50",
  },
  {
    icon: Vote,
    title: "DAO Governance",
    description:
      "Vote on research proposals using VITA tokens. Shape the future of longevity science.",
    color: "from-vita-teal to-vita-teal/50",
  },
  {
    icon: Coins,
    title: "Research Funding",
    description:
      "Contribute ETH to community funding campaigns for pre-clinical and translational research.",
    color: "from-yellow-500 to-yellow-500/50",
  },
  {
    icon: BarChart3,
    title: "Tokenomics",
    description:
      "Track your VITA portfolio, voting history, and IP-NFT ownership in one dashboard.",
    color: "from-blue-500 to-blue-500/50",
  },
];

export default function Home() {
  const featuredIPNFTs = MOCK_IPNFTS.slice(0, 3);
  const activeProposals = MOCK_PROPOSALS.filter((p) => p.status === "active");

  return (
    <div className="min-h-screen bg-vita-dark text-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vita-purple/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-vita-teal/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-vita-purple/10 border border-vita-purple/30 text-vita-purple-light text-sm font-medium mb-6">
            <FlaskConical className="w-4 h-4" />
            Longevity Research DAO
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Funding the Science of{" "}
            <span className="bg-gradient-to-r from-vita-purple-light to-vita-teal bg-clip-text text-transparent">
              Living Longer
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            VitaDAO is a decentralized collective funding early-stage longevity research. 
            Govern IP-NFTs, vote on proposals, and fund the biotech breakthroughs that extend 
            human healthspan.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/governance"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-vita-purple hover:bg-vita-purple/80 text-white font-medium transition-colors"
            >
              Explore Proposals
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/ipnft"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-transparent border border-vita-dark-border text-gray-300 hover:bg-white/5 hover:border-vita-purple/40 font-medium transition-colors"
            >
              View IP-NFTs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-vita-dark-border bg-vita-dark-card/50">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center">
              <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {value}
              </p>
              <p className="text-gray-500 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Built for Longevity Science
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Every tool in VitaDAO is designed to accelerate decentralized biotech research
              funding.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="bg-vita-dark-card border border-vita-dark-border rounded-xl p-5 hover:border-vita-purple/30 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Proposals */}
      {activeProposals.length > 0 && (
        <section className="py-16 px-4 bg-vita-dark-card/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Vote className="w-5 h-5 text-vita-purple-light" />
                Active Proposals
              </h2>
              <Link
                to="/governance"
                className="text-sm text-vita-purple-light hover:text-vita-purple flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {activeProposals.map((p) => (
                <ProposalCard key={p.id} proposal={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured IP-NFTs */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Dna className="w-5 h-5 text-vita-teal" />
              Featured IP-NFTs
            </h2>
            <Link
              to="/ipnft"
              className="text-sm text-vita-teal hover:text-vita-teal-light flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredIPNFTs.map((nft) => (
              <IPNFTCard key={nft.tokenId} ipnft={nft} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-vita-purple/20 to-vita-teal/10 border border-vita-purple/20 rounded-2xl p-10">
            <Shield className="w-10 h-10 text-vita-purple-light mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Join the Longevity Revolution
            </h2>
            <p className="text-gray-400 mb-6">
              Hold VITA tokens to gain voting rights, fund research campaigns, and own fractions of 
              breakthrough IP-NFTs.
            </p>
            <Link
              to="/funding"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-vita-teal hover:bg-vita-teal-light text-vita-dark font-semibold transition-colors"
            >
              Fund Research Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

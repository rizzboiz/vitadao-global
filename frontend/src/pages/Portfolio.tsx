import { BarChart3, Dna, Vote, Coins, Wallet, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { useWallet } from "../hooks/useWallet";
import { shortenAddress } from "../utils/formatters";
import { MOCK_IPNFTS, MOCK_PROPOSALS } from "../utils/mockData";
import IPNFTCard from "../components/IPNFTCard";

// Mock portfolio data for the connected user
const MOCK_VITA_BALANCE = "12,500";
const MOCK_VOTING_POWER = "12,500";

const MOCK_VOTE_HISTORY = [
  { proposalId: "1", proposalTitle: "Fund Senolytics Research at Harvard Aging Lab", support: "for" as const, weight: "5000" },
  { proposalId: "2", proposalTitle: "Integrate Longevity Biomarker Dashboard", support: "for" as const, weight: "5000" },
  { proposalId: "3", proposalTitle: "Reduce Voting Period from 7 Days to 5 Days", support: "against" as const, weight: "5000" },
];

const MOCK_CONTRIBUTIONS = [
  { campaignId: 0, campaignTitle: "SENS Rejuvenation Biotechnology Research Fund", amount: "2.5" },
  { campaignId: 3, campaignTitle: "Open-Source Epigenetic Clock SDK", amount: "0.5" },
];

export default function Portfolio() {
  const { isConnected, address } = useWeb3();
  const { connect } = useWallet();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-vita-dark flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-vita-purple/20 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-vita-purple-light" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 text-sm mb-6">
            Connect your wallet to view your VITA balance, IP-NFTs, and voting history.
          </p>
          <button
            onClick={connect}
            className="px-6 py-3 rounded-xl bg-vita-purple hover:bg-vita-purple/80 text-white font-medium transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Simulate owned IP-NFTs (first 2 for demo)
  const ownedNFTs = MOCK_IPNFTS.slice(0, 2);

  return (
    <div className="min-h-screen bg-vita-dark py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-vita-purple-light" />
            My Portfolio
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-mono">
            {address ? shortenAddress(address, 6) : ""}
          </p>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "VITA Balance",
              value: MOCK_VITA_BALANCE,
              unit: "VITA",
              icon: Coins,
              color: "text-vita-purple-light",
              bg: "from-vita-purple/20 to-transparent",
            },
            {
              label: "Voting Power",
              value: MOCK_VOTING_POWER,
              unit: "VITA",
              icon: Vote,
              color: "text-vita-teal",
              bg: "from-vita-teal/20 to-transparent",
            },
            {
              label: "IP-NFTs Owned",
              value: ownedNFTs.length.toString(),
              unit: "NFTs",
              icon: Dna,
              color: "text-yellow-400",
              bg: "from-yellow-500/20 to-transparent",
            },
            {
              label: "Proposals Voted",
              value: MOCK_VOTE_HISTORY.length.toString(),
              unit: "votes",
              icon: BarChart3,
              color: "text-blue-400",
              bg: "from-blue-500/20 to-transparent",
            },
          ].map(({ label, value, unit, icon: Icon, color, bg }) => (
            <div
              key={label}
              className={`bg-gradient-to-br ${bg} bg-vita-dark-card border border-vita-dark-border rounded-xl p-5`}
            >
              <Icon className={`w-5 h-5 ${color} mb-3`} />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{unit}</p>
              <p className="text-gray-500 text-xs mt-2">{label}</p>
            </div>
          ))}
        </div>

        {/* Owned IP-NFTs */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Dna className="w-4 h-4 text-vita-teal" />
              My IP-NFTs
            </h2>
            <Link
              to="/ipnft"
              className="text-sm text-vita-teal hover:text-vita-teal-light flex items-center gap-1 transition-colors"
            >
              Browse all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {ownedNFTs.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {ownedNFTs.map((nft) => (
                <IPNFTCard key={nft.tokenId} ipnft={nft} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-vita-dark-card border border-vita-dark-border rounded-xl">
              <Dna className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No IP-NFTs owned yet</p>
              <Link
                to="/ipnft"
                className="mt-3 inline-flex items-center gap-1 text-sm text-vita-teal hover:text-vita-teal-light"
              >
                Mint your first <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </section>

        {/* Vote History */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Vote className="w-4 h-4 text-vita-purple-light" />
            Voting History
          </h2>
          <div className="bg-vita-dark-card border border-vita-dark-border rounded-xl overflow-hidden">
            {MOCK_VOTE_HISTORY.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No votes cast yet
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-vita-dark-border">
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Proposal</th>
                    <th className="text-center text-xs text-gray-500 font-medium px-4 py-3">Vote</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_VOTE_HISTORY.map((vote) => (
                    <tr
                      key={vote.proposalId}
                      className="border-b border-vita-dark-border last:border-0 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/governance"
                          className="text-sm text-gray-300 hover:text-white line-clamp-1"
                        >
                          #{vote.proposalId} {vote.proposalTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            vote.support === "for"
                              ? "bg-green-500/10 text-green-400"
                              : vote.support === "against"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          {vote.support}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-mono text-gray-400">
                        {vote.weight} VITA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Contributions */}
        <section>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Coins className="w-4 h-4 text-yellow-400" />
            Research Contributions
          </h2>
          <div className="bg-vita-dark-card border border-vita-dark-border rounded-xl overflow-hidden">
            {MOCK_CONTRIBUTIONS.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No contributions yet
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-vita-dark-border">
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Campaign</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CONTRIBUTIONS.map((c) => (
                    <tr
                      key={c.campaignId}
                      className="border-b border-vita-dark-border last:border-0 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/funding"
                          className="text-sm text-gray-300 hover:text-white"
                        >
                          {c.campaignTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-vita-teal font-medium">
                        {c.amount} ETH
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Dna, Search, PlusCircle, X, Loader2 } from "lucide-react";
import { MOCK_IPNFTS } from "../utils/mockData";
import IPNFTCard from "../components/IPNFTCard";
import { useIPNFT } from "../hooks/useIPNFT";
import { useStellar } from "../context/StellarContext";

const RESEARCH_AREAS = [
  "All",
  "Telomere Biology",
  "Senolytics",
  "Epigenetics",
  "Mitochondria",
  "Metabolic Aging",
  "Autophagy",
];

export default function IPNFTGallery() {
  const [areaFilter, setAreaFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showMintForm, setShowMintForm] = useState(false);
  const { isConnected } = useStellar();
  const { mintIPNFT, isLoading, error: mintError, txHash } = useIPNFT();

  const [mintForm, setMintForm] = useState({
    title: "",
    researchArea: "",
    fundingGoal: "",
    tokenURI: "",
  });
  const [mintSuccess, setMintSuccess] = useState(false);

  const filtered = MOCK_IPNFTS.filter((nft) => {
    const matchesArea = areaFilter === "All" || nft.researchArea === areaFilter;
    const matchesSearch =
      !search ||
      nft.title.toLowerCase().includes(search.toLowerCase()) ||
      nft.researchArea.toLowerCase().includes(search.toLowerCase()) ||
      nft.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesArea && matchesSearch;
  });

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    const receipt = await mintIPNFT({
      title: mintForm.title,
      researchArea: mintForm.researchArea,
      fundingGoal: mintForm.fundingGoal,
      tokenURI: mintForm.tokenURI || `ipfs://QmPlaceholder${Date.now()}`,
    });
    if (receipt) {
      setMintSuccess(true);
      setMintForm({ title: "", researchArea: "", fundingGoal: "", tokenURI: "" });
    }
  };

  return (
    <div className="min-h-screen bg-vita-dark py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Dna className="w-6 h-6 text-vita-teal" />
              IP-NFT Gallery
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Intellectual property NFTs from funded longevity research
            </p>
          </div>
          {isConnected && (
            <button
              onClick={() => setShowMintForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vita-teal text-vita-dark text-sm font-medium hover:bg-vita-teal-light transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Mint IP-NFT
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by title, area, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-vita-dark-card border border-vita-dark-border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vita-teal"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {RESEARCH_AREAS.map((area) => (
              <button
                key={area}
                onClick={() => setAreaFilter(area)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  areaFilter === area
                    ? "bg-vita-teal text-vita-dark"
                    : "bg-vita-dark-card border border-vita-dark-border text-gray-400 hover:text-white hover:border-vita-teal/40"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-gray-500 text-sm mb-6">
          {filtered.length} IP-NFT{filtered.length !== 1 ? "s" : ""} found
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Dna className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No IP-NFTs match your filters</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((nft) => (
              <IPNFTCard key={nft.tokenId} ipnft={nft} />
            ))}
          </div>
        )}

        {/* Mint Modal */}
        {showMintForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-vita-dark-card border border-vita-dark-border rounded-2xl w-full max-w-lg p-6 relative">
              <button
                onClick={() => {
                  setShowMintForm(false);
                  setMintSuccess(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-lg font-bold text-white mb-1">Mint IP-NFT</h2>
              <p className="text-gray-400 text-sm mb-6">
                Register research intellectual property on-chain. A 10 XLM mint fee applies.
              </p>

              {mintSuccess ? (
                <div className="text-center py-8">
                  <Dna className="w-12 h-12 text-vita-teal mx-auto mb-3" />
                  <p className="text-white font-semibold mb-2">IP-NFT Minted!</p>
                  {txHash && (
                    <p className="text-xs font-mono text-gray-500 break-all">
                      Tx: {txHash}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setShowMintForm(false);
                      setMintSuccess(false);
                    }}
                    className="mt-6 px-4 py-2 rounded-lg bg-vita-teal text-vita-dark text-sm font-medium"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMint} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Research Title *</label>
                    <input
                      type="text"
                      required
                      value={mintForm.title}
                      onChange={(e) => setMintForm({ ...mintForm, title: e.target.value })}
                      placeholder="e.g. Telomere Extension via Novel TERT Activators"
                      className="w-full bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vita-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Research Area *</label>
                    <select
                      required
                      value={mintForm.researchArea}
                      onChange={(e) => setMintForm({ ...mintForm, researchArea: e.target.value })}
                      className="w-full bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-vita-teal"
                    >
                      <option value="">Select area...</option>
                      {RESEARCH_AREAS.filter((a) => a !== "All").map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Funding Goal (XLM) *</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={mintForm.fundingGoal}
                      onChange={(e) => setMintForm({ ...mintForm, fundingGoal: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vita-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">IPFS URI (optional)</label>
                    <input
                      type="text"
                      value={mintForm.tokenURI}
                      onChange={(e) => setMintForm({ ...mintForm, tokenURI: e.target.value })}
                      placeholder="ipfs://Qm..."
                      className="w-full bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-vita-teal"
                    />
                  </div>

                  {mintError && (
                    <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                      {mintError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-vita-teal text-vita-dark font-semibold hover:bg-vita-teal-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      "Mint IP-NFT (10 XLM)"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

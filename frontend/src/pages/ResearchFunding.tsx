import { useState } from "react";
import { FlaskConical, PlusCircle, Search, X, Loader2 } from "lucide-react";
import { MOCK_CAMPAIGNS } from "../utils/mockData";
import FundingCard from "../components/FundingCard";
import { useFunding } from "../hooks/useFunding";
import { useStellar } from "../context/StellarContext";

const AREAS = ["All", "Rejuvenation Biotech", "Biomarkers", "Metabolic Aging", "Tools & Infrastructure"];

export default function ResearchFunding() {
  const [areaFilter, setAreaFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const { isConnected } = useStellar();
  const { createCampaign, isLoading, error: formError, txHash } = useFunding();

  const [form, setForm] = useState({
    title: "",
    description: "",
    researchArea: "",
    goalEth: "",
    durationDays: "30",
  });

  const filtered = MOCK_CAMPAIGNS.filter((c) => {
    const matchesArea = areaFilter === "All" || c.researchArea === areaFilter;
    const matchesSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchesArea && matchesSearch;
  });

  const totalRaised = MOCK_CAMPAIGNS.reduce((acc, c) => acc + parseFloat(c.raised), 0);
  const activeCampaigns = MOCK_CAMPAIGNS.filter((c) => !c.cancelled && !c.withdrawn).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const receipt = await createCampaign({
      title: form.title,
      description: form.description,
      researchArea: form.researchArea,
      goalEth: form.goalEth,
      durationDays: parseInt(form.durationDays),
    });
    if (receipt) {
      setFormSuccess(true);
      setForm({ title: "", description: "", researchArea: "", goalEth: "", durationDays: "30" });
    }
  };

  return (
    <div className="min-h-screen bg-vita-dark py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-yellow-400" />
              Research Funding
            </h1>
            <p className="text-gray-400 text-sm mt-1">
                Contribute XLM to fund longevity research campaigns
            </p>
          </div>
          {isConnected && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-black text-sm font-medium hover:bg-yellow-400 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Create Campaign
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-vita-dark-card border border-vita-dark-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-vita-teal">{totalRaised.toFixed(1)} XLM</p>
            <p className="text-gray-500 text-xs mt-1">Total Raised</p>
          </div>
          <div className="bg-vita-dark-card border border-vita-dark-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{activeCampaigns}</p>
            <p className="text-gray-500 text-xs mt-1">Active Campaigns</p>
          </div>
          <div className="bg-vita-dark-card border border-vita-dark-border rounded-xl p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold text-vita-purple-light">{MOCK_CAMPAIGNS.length}</p>
            <p className="text-gray-500 text-xs mt-1">Total Campaigns</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-vita-dark-card border border-vita-dark-border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <button
                key={area}
                onClick={() => setAreaFilter(area)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  areaFilter === area
                    ? "bg-yellow-500 text-black"
                    : "bg-vita-dark-card border border-vita-dark-border text-gray-400 hover:text-white"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No campaigns match your search</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {filtered.map((campaign) => (
              <FundingCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}

        {/* Create Campaign Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-vita-dark-card border border-vita-dark-border rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => { setShowForm(false); setFormSuccess(false); }}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-lg font-bold text-white mb-1">Create Funding Campaign</h2>
              <p className="text-gray-400 text-sm mb-6">
                Launch a community crowdfunding campaign for your research project.
              </p>

              {formSuccess ? (
                <div className="text-center py-8">
                  <FlaskConical className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <p className="text-white font-semibold mb-2">Campaign Created!</p>
                  {txHash && (
                    <p className="text-xs font-mono text-gray-500 break-all">Tx: {txHash}</p>
                  )}
                  <button
                    onClick={() => { setShowForm(false); setFormSuccess(false); }}
                    className="mt-6 px-4 py-2 rounded-lg bg-yellow-500 text-black text-sm font-medium"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Campaign Title *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Senolytics Research Fund"
                      className="w-full bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the research and how funds will be used..."
                      className="w-full bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/60 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Research Area *</label>
                    <select
                      required
                      value={form.researchArea}
                      onChange={(e) => setForm({ ...form, researchArea: e.target.value })}
                      className="w-full bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"
                    >
                      <option value="">Select area...</option>
                      {AREAS.filter((a) => a !== "All").map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Goal (XLM) *</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={form.goalEth}
                        onChange={(e) => setForm({ ...form, goalEth: e.target.value })}
                        placeholder="e.g. 50"
                        className="w-full bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Duration (days) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="365"
                        value={form.durationDays}
                        onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                        className="w-full bg-gray-800 border border-vita-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/60"
                      />
                    </div>
                  </div>

                  {formError && (
                    <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                    ) : "Create Campaign"}
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

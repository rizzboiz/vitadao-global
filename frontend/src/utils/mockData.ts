import type { Proposal, IPNFT, FundingCampaign } from "../types";

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "1",
    title: "Fund Senolytics Research at Harvard Aging Lab",
    description:
      "Proposal to allocate 50,000 VITA to fund a 12-month senolytic compound screening study targeting p21-positive senescent cells. Research will be conducted by Dr. Sarah Chen's lab at Harvard. IP rights will be captured as an IP-NFT owned by VitaDAO.",
    proposer: "0x1234567890abcdef1234567890abcdef12345678",
    status: "active",
    forVotes: "2400000",
    againstVotes: "340000",
    abstainVotes: "120000",
    startBlock: 18900000,
    endBlock: 18950400,
    category: "research",
    createdAt: "2024-01-10T12:00:00Z",
  },
  {
    id: "2",
    title: "Integrate Longevity Biomarker Dashboard into VitaDAO Portal",
    description:
      "Fund development of a public longevity biomarker tracking dashboard. This will display key aging metrics (epigenetic clocks, telomere length proxies) sourced from VitaDAO-funded research, increasing community engagement and research transparency.",
    proposer: "0xabcdef1234567890abcdef1234567890abcdef12",
    status: "passed",
    forVotes: "5100000",
    againstVotes: "210000",
    abstainVotes: "89000",
    startBlock: 18850000,
    endBlock: 18900400,
    category: "other",
    createdAt: "2024-01-03T08:00:00Z",
  },
  {
    id: "3",
    title: "Reduce Voting Period from 7 Days to 5 Days",
    description:
      "Proposal to change governance voting period parameter from 50,400 blocks (~7 days) to 36,000 blocks (~5 days). Rationale: faster governance cycles improve responsiveness to time-sensitive research opportunities.",
    proposer: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    status: "defeated",
    forVotes: "980000",
    againstVotes: "3200000",
    abstainVotes: "450000",
    startBlock: 18800000,
    endBlock: 18850400,
    category: "parameter",
    createdAt: "2023-12-28T16:00:00Z",
  },
  {
    id: "4",
    title: "Acquire IP-NFT for NAD+ Precursor Research",
    description:
      "Mint and acquire an IP-NFT covering novel NAD+ precursor synthesis patents from BioVita Inc. This would give VitaDAO governance rights over promising NAD+ metabolism research with potential healthspan applications.",
    proposer: "0x9876543210fedcba9876543210fedcba98765432",
    status: "pending",
    forVotes: "0",
    againstVotes: "0",
    abstainVotes: "0",
    startBlock: 18960000,
    endBlock: 19010400,
    category: "research",
    createdAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "5",
    title: "Treasury Diversification: Swap 10% VITA for ETH",
    description:
      "Proposal to swap 10% of DAO treasury VITA holdings for ETH to reduce single-asset exposure and ensure operational runway for at least 18 months regardless of VITA price fluctuations.",
    proposer: "0xfedcba9876543210fedcba9876543210fedcba98",
    status: "active",
    forVotes: "1800000",
    againstVotes: "1200000",
    abstainVotes: "300000",
    startBlock: 18920000,
    endBlock: 18970400,
    category: "treasury",
    createdAt: "2024-01-12T14:00:00Z",
  },
];

export const MOCK_IPNFTS: IPNFT[] = [
  {
    tokenId: 0,
    title: "Telomere Extension via Novel TERT Activators",
    description:
      "IP covering a class of small-molecule TERT activators that extend telomere length in human fibroblasts by 15-20% without measurable off-target effects. Phase 1 pre-clinical data included.",
    researchArea: "Telomere Biology",
    researcher: "0x1234567890abcdef1234567890abcdef12345678",
    fundingGoal: "50",
    currentFunding: "38.5",
    imageUrl:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
    tokenURI: "ipfs://QmTelomere123",
    mintedAt: "2023-11-15T10:00:00Z",
    fractionalized: true,
    tags: ["Telomeres", "TERT", "Small Molecules", "Pre-clinical"],
  },
  {
    tokenId: 1,
    title: "Senolytic Peptide CAR-T Therapy",
    description:
      "A novel CAR-T cell therapy targeting p16-expressing senescent cells with high specificity. Demonstrated 85% clearance of senescent cells in aged mouse models with improved physical performance.",
    researchArea: "Senolytics",
    researcher: "0xabcdef1234567890abcdef1234567890abcdef12",
    fundingGoal: "120",
    currentFunding: "67.2",
    imageUrl:
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop",
    tokenURI: "ipfs://QmSenolytic456",
    mintedAt: "2023-12-01T14:00:00Z",
    fractionalized: false,
    tags: ["Senolytics", "CAR-T", "Immunotherapy", "Mouse Models"],
  },
  {
    tokenId: 2,
    title: "Epigenetic Reprogramming with Yamanaka Partial Factors",
    description:
      "Proprietary gene expression vector enabling controlled partial Yamanaka reprogramming in vivo. Reverses epigenetic aging by 2-3 years in treated tissue without inducing pluripotency.",
    researchArea: "Epigenetics",
    researcher: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    fundingGoal: "200",
    currentFunding: "200",
    imageUrl:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop",
    tokenURI: "ipfs://QmEpigenetic789",
    mintedAt: "2023-10-20T09:00:00Z",
    fractionalized: true,
    tags: ["Epigenetics", "Yamanaka", "Reprogramming", "In Vivo"],
  },
  {
    tokenId: 3,
    title: "Mitochondrial Biogenesis Enhancer Compound MBE-7",
    description:
      "A potent mitochondrial biogenesis enhancer that upregulates PGC-1α and improves metabolic fitness. Shows 40% improvement in mitochondrial membrane potential in aged cell cultures.",
    researchArea: "Mitochondria",
    researcher: "0x9876543210fedcba9876543210fedcba98765432",
    fundingGoal: "75",
    currentFunding: "22.8",
    imageUrl:
      "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=400&h=300&fit=crop",
    tokenURI: "ipfs://QmMitochondria012",
    mintedAt: "2024-01-05T11:00:00Z",
    fractionalized: false,
    tags: ["Mitochondria", "PGC-1α", "Metabolism", "Cell Culture"],
  },
  {
    tokenId: 4,
    title: "NAD+ Salvage Pathway Enhancement via Novel NMN Analogs",
    description:
      "Synthetic NMN analogs with 3x bioavailability over standard NMN. Demonstrated significant NAD+ restoration and improved sirtuin activity in aged primate models.",
    researchArea: "Metabolic Aging",
    researcher: "0xfedcba9876543210fedcba9876543210fedcba98",
    fundingGoal: "90",
    currentFunding: "90",
    imageUrl:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop",
    tokenURI: "ipfs://QmNAD345",
    mintedAt: "2023-09-10T15:00:00Z",
    fractionalized: true,
    tags: ["NAD+", "NMN", "Sirtuins", "Primates"],
  },
  {
    tokenId: 5,
    title: "Autophagy Activation by mTOR Complex 1 Inhibitor ACI-12",
    description:
      "A highly selective mTORC1 inhibitor that activates autophagy and clears protein aggregates with minimal off-target immunosuppression, overcoming key limitations of existing rapalogs.",
    researchArea: "Autophagy",
    researcher: "0x1111222233334444555566667777888899990000",
    fundingGoal: "60",
    currentFunding: "14.3",
    imageUrl:
      "https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=400&h=300&fit=crop",
    tokenURI: "ipfs://QmAutophagy678",
    mintedAt: "2024-01-08T13:00:00Z",
    fractionalized: false,
    tags: ["Autophagy", "mTOR", "Rapalog", "Protein Aggregates"],
  },
];

export const MOCK_CAMPAIGNS: FundingCampaign[] = [
  {
    id: 0,
    title: "SENS Rejuvenation Biotechnology Research Fund",
    description:
      "Supporting Dr. Aubrey de Grey's SENS research agenda targeting the seven hallmarks of aging. Funds will go toward allotopic mitochondrial DNA expression research.",
    researchArea: "Rejuvenation Biotech",
    researcher: "0x1234567890abcdef1234567890abcdef12345678",
    goal: "100",
    raised: "67.4",
    deadline: "2024-03-01T00:00:00Z",
    withdrawn: false,
    cancelled: false,
    contributors: 234,
    imageUrl:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&h=400&fit=crop",
  },
  {
    id: 1,
    title: "GlycanAge Biological Clock Validation Study",
    description:
      "Validation study for the GlycanAge test as a longevity biomarker in a 1,000-person cohort. Will generate open-access dataset for the longevity research community.",
    researchArea: "Biomarkers",
    researcher: "0xabcdef1234567890abcdef1234567890abcdef12",
    goal: "45",
    raised: "45",
    deadline: "2024-01-20T00:00:00Z",
    withdrawn: true,
    cancelled: false,
    contributors: 189,
    imageUrl:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Caloric Restriction Mimetic Drug Screen",
    description:
      "High-throughput screen of 10,000 compounds for caloric restriction mimetic activity. Top candidates will undergo ITP-style lifespan testing in C. elegans and mice.",
    researchArea: "Metabolic Aging",
    researcher: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    goal: "80",
    raised: "31.2",
    deadline: "2024-04-15T00:00:00Z",
    withdrawn: false,
    cancelled: false,
    contributors: 97,
    imageUrl:
      "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=600&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Open-Source Epigenetic Clock SDK",
    description:
      "Building an open-source developer SDK for integrating Horvath-style epigenetic clocks into research applications. Includes Python and JavaScript libraries with REST API.",
    researchArea: "Tools & Infrastructure",
    researcher: "0x9876543210fedcba9876543210fedcba98765432",
    goal: "25",
    raised: "18.9",
    deadline: "2024-02-28T00:00:00Z",
    withdrawn: false,
    cancelled: false,
    contributors: 312,
    imageUrl:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop",
  },
];

export const MOCK_STATS = {
  totalFunded: "842.3 ETH",
  activeProposals: 2,
  ipnftsMinted: 47,
  activeCampaigns: 3,
  communityMembers: "12,400+",
  vitaHolders: "8,200+",
};

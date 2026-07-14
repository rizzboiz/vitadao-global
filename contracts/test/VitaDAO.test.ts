import { expect } from "chai";
import { ethers } from "hardhat";
import { VITA, IPNFT, ResearchFunding } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("VitaDAO Contracts", function () {
  let vita: VITA;
  let ipnft: IPNFT;
  let funding: ResearchFunding;
  let owner: HardhatEthersSigner;
  let researcher: HardhatEthersSigner;
  let contributor: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, researcher, contributor, treasury] = await ethers.getSigners();

    const VITA = await ethers.getContractFactory("VITA");
    vita = await VITA.deploy(owner.address);

    const IPNFT = await ethers.getContractFactory("IPNFT");
    ipnft = await IPNFT.deploy(owner.address, treasury.address);

    const ResearchFunding = await ethers.getContractFactory("ResearchFunding");
    funding = await ResearchFunding.deploy(owner.address, treasury.address);
  });

  describe("VITA Token", function () {
    it("should have correct name and symbol", async function () {
      expect(await vita.name()).to.equal("VitaDAO");
      expect(await vita.symbol()).to.equal("VITA");
    });

    it("should mint max supply to deployer", async function () {
      const maxSupply = ethers.parseEther("100000000");
      expect(await vita.totalSupply()).to.equal(maxSupply);
      expect(await vita.balanceOf(owner.address)).to.equal(maxSupply);
    });

    it("should not exceed max supply", async function () {
      await expect(
        vita.mint(researcher.address, ethers.parseEther("1"))
      ).to.be.revertedWith("VITA: max supply exceeded");
    });

    it("should support ERC20Votes delegation", async function () {
      await vita.delegate(owner.address);
      const votes = await vita.getVotes(owner.address);
      expect(votes).to.be.gt(0n);
    });
  });

  describe("IPNFT", function () {
    it("should mint an IP-NFT with correct data", async function () {
      const mintFee = await ipnft.mintFee();
      await ipnft.connect(researcher).mintIPNFT(
        researcher.address,
        "Telomere Extension Study",
        "Longevity",
        ethers.parseEther("10"),
        "ipfs://QmTest123",
        { value: mintFee }
      );

      expect(await ipnft.ownerOf(0)).to.equal(researcher.address);
      const data = await ipnft.getIPNFTData(0);
      expect(data.title).to.equal("Telomere Extension Study");
      expect(data.researchArea).to.equal("Longevity");
      expect(data.researcher).to.equal(researcher.address);
    });

    it("should revert if mint fee is insufficient", async function () {
      await expect(
        ipnft.connect(researcher).mintIPNFT(
          researcher.address,
          "Test",
          "Longevity",
          ethers.parseEther("1"),
          "ipfs://test",
          { value: 0 }
        )
      ).to.be.revertedWith("IPNFT: insufficient mint fee");
    });

    it("should track total supply", async function () {
      const mintFee = await ipnft.mintFee();
      await ipnft.connect(researcher).mintIPNFT(
        researcher.address, "Study 1", "Aging", ethers.parseEther("5"),
        "ipfs://1", { value: mintFee }
      );
      await ipnft.connect(researcher).mintIPNFT(
        researcher.address, "Study 2", "Cancer", ethers.parseEther("8"),
        "ipfs://2", { value: mintFee }
      );
      expect(await ipnft.totalSupply()).to.equal(2n);
    });
  });

  describe("ResearchFunding", function () {
    it("should create a campaign", async function () {
      await funding.connect(researcher).createCampaign(
        "Senolytics Research",
        "Clearing senescent cells to extend healthspan",
        "Aging",
        ethers.parseEther("5"),
        30
      );

      const campaign = await funding.campaigns(0);
      expect(campaign.title).to.equal("Senolytics Research");
      expect(campaign.researcher).to.equal(researcher.address);
      expect(campaign.goal).to.equal(ethers.parseEther("5"));
    });

    it("should accept contributions", async function () {
      await funding.connect(researcher).createCampaign(
        "Test Campaign", "Desc", "Aging",
        ethers.parseEther("5"), 30
      );

      await funding.connect(contributor).contribute(0, {
        value: ethers.parseEther("1"),
      });

      const campaign = await funding.campaigns(0);
      expect(campaign.raised).to.equal(ethers.parseEther("1"));
    });

    it("should allow withdrawal when goal is met", async function () {
      await funding.connect(researcher).createCampaign(
        "Quick Fund", "Desc", "Aging",
        ethers.parseEther("1"), 30
      );

      await funding.connect(contributor).contribute(0, {
        value: ethers.parseEther("1"),
      });

      const before = await ethers.provider.getBalance(researcher.address);
      await funding.connect(researcher).withdraw(0);
      const after = await ethers.provider.getBalance(researcher.address);

      // Researcher should receive funds minus fee
      expect(after).to.be.gt(before);
    });

    it("should revert withdrawal if goal not reached", async function () {
      await funding.connect(researcher).createCampaign(
        "Underfunded", "Desc", "Aging",
        ethers.parseEther("10"), 30
      );

      await funding.connect(contributor).contribute(0, {
        value: ethers.parseEther("1"),
      });

      await expect(
        funding.connect(researcher).withdraw(0)
      ).to.be.revertedWith("ResearchFunding: goal not reached");
    });
  });
});

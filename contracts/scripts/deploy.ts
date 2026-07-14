import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // 1. Deploy VITA token
  console.log("\n1. Deploying VITA token...");
  const VITA = await ethers.getContractFactory("VITA");
  const vita = await VITA.deploy(deployer.address);
  await vita.waitForDeployment();
  const vitaAddress = await vita.getAddress();
  console.log("   VITA deployed to:", vitaAddress);

  // 2. Deploy IPNFT (treasury = deployer for now)
  console.log("\n2. Deploying IPNFT...");
  const IPNFT = await ethers.getContractFactory("IPNFT");
  const ipnft = await IPNFT.deploy(deployer.address, deployer.address);
  await ipnft.waitForDeployment();
  const ipnftAddress = await ipnft.getAddress();
  console.log("   IPNFT deployed to:", ipnftAddress);

  // 3. Deploy IPNFTFractionalize
  console.log("\n3. Deploying IPNFTFractionalize...");
  const IPNFTFractionalize = await ethers.getContractFactory("IPNFTFractionalize");
  const fractionalize = await IPNFTFractionalize.deploy(ipnftAddress, deployer.address);
  await fractionalize.waitForDeployment();
  const fractionalizeAddress = await fractionalize.getAddress();
  console.log("   IPNFTFractionalize deployed to:", fractionalizeAddress);

  // Grant fractionalize contract rights to call setFractionalized
  await ipnft.transferOwnership(fractionalizeAddress);
  console.log("   IPNFT ownership transferred to IPNFTFractionalize");

  // 4. Deploy VitaDAOGovernor
  console.log("\n4. Deploying VitaDAOGovernor...");
  const VitaDAOGovernor = await ethers.getContractFactory("VitaDAOGovernor");
  const governor = await VitaDAOGovernor.deploy(vitaAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("   VitaDAOGovernor deployed to:", governorAddress);

  // 5. Deploy ResearchFunding
  console.log("\n5. Deploying ResearchFunding...");
  const ResearchFunding = await ethers.getContractFactory("ResearchFunding");
  const funding = await ResearchFunding.deploy(deployer.address, deployer.address);
  await funding.waitForDeployment();
  const fundingAddress = await funding.getAddress();
  console.log("   ResearchFunding deployed to:", fundingAddress);

  console.log("\n=== Deployment Summary ===");
  console.log({
    VITA: vitaAddress,
    IPNFT: ipnftAddress,
    IPNFTFractionalize: fractionalizeAddress,
    VitaDAOGovernor: governorAddress,
    ResearchFunding: fundingAddress,
  });

  // Write addresses to a file for frontend use
  const addresses = {
    VITA: vitaAddress,
    IPNFT: ipnftAddress,
    IPNFTFractionalize: fractionalizeAddress,
    VitaDAOGovernor: governorAddress,
    ResearchFunding: fundingAddress,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
  };

  const fs = await import("fs");
  fs.writeFileSync(
    "./deployments.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\nAddresses written to deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

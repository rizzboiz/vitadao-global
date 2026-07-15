import {
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Address,
  rpc,
} from "@stellar/stellar-sdk";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const FRIENDBOT_URL = "https://friendbot.stellar.org";
const WASM_DIR = path.resolve(__dirname, "..", "target", "wasm32-unknown-unknown", "release");

const CONTRACTS = [
  { key: "IPNFT", name: "IP-NFT", file: "ip_nft_fixed.wasm" },
  { key: "IPNFTFractionalize", name: "IP-NFT Fractionalize", file: "ip_nft_fractionalize_fixed.wasm" },
  { key: "ResearchFunding", name: "Research Funding", file: "research_funding_fixed.wasm" },
  { key: "VitaDAOGovernor", name: "Governance", file: "governance_fixed.wasm" },
];

async function pollTransaction(server, hash, label) {
  for (let i = 0; i < 60; i++) {
    const resp = await server.getTransaction(hash);
    if (resp.status === "SUCCESS") {
      console.log(`  ${label}: SUCCESS (ledger ${resp.ledger})`);
      return resp;
    }
    if (resp.status === "FAILED") {
      throw new Error(`${label} failed: ${JSON.stringify(resp)}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${label} timed out`);
}

async function deployContract(server, account, keypair, wasm, networkPassphrase) {
  // Step 1: Upload WASM
  console.log("  [1/2] Uploading WASM...");
  const uploadTx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase,
  })
    .addOperation(Operation.uploadContractWasm({ wasm }))
    .setTimeout(30)
    .build();

  const uploadSim = await server.simulateTransaction(uploadTx);
  if (!uploadSim) throw new Error("Upload simulation returned null");

  const uploadPrepared = rpc.assembleTransaction(uploadTx, uploadSim).build();
  uploadPrepared.sign(keypair);

  const uploadSend = await server.sendTransaction(uploadPrepared);
  if (uploadSend.status !== "PENDING") {
    throw new Error(`Upload send error: ${uploadSend.error || uploadSend.status}`);
  }

  const uploadResp = await pollTransaction(server, uploadSend.hash, "Upload");

  // Extract wasm hash from the return value (scvBytes)
  const retval = uploadResp.returnValue;
  if (!retval || retval.switch().name !== 'scvBytes') {
    throw new Error(`Could not extract wasm hash from return value`);
  }
  const wasmHash = retval.bytes();

  // Step 2: Create contract
  console.log("  [2/2] Creating contract...");
  account = await server.getAccount(keypair.publicKey());

  const createTx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase,
  })
    .addOperation(
      Operation.createCustomContract({
        wasmHash,
        address: new Address(keypair.publicKey()),
      })
    )
    .setTimeout(30)
    .build();

  const createSim = await server.simulateTransaction(createTx);
  if (!createSim) throw new Error("Create simulation returned null");

  const createPrepared = rpc.assembleTransaction(createTx, createSim).build();
  createPrepared.sign(keypair);

  const createSend = await server.sendTransaction(createPrepared);
  if (createSend.status !== "PENDING") {
    throw new Error(`Create send error: ${createSend.error || createSend.status}`);
  }

  const createResp = await pollTransaction(server, createSend.hash, "Create");

  // Extract contract ID from return value (scvAddress)
  const createRetval = createResp.returnValue;
  if (!createRetval || createRetval.switch().name !== 'scvAddress') {
    throw new Error(`Could not extract contract ID from return value`);
  }
  const contractId = Address.fromScAddress(createRetval.address()).toString();

  return contractId;
}

async function main() {
  console.log("=== VitaDAO - Deploy to Stellar Testnet ===\n");

  const SECRET = process.env.STELLAR_SECRET_KEY
    || "SB56TBMO6J25TNVKMNDGTBHR5UP2BDZJTDTPDHGKENWKSIB5YEVJS76Y";
  const keypair = Keypair.fromSecret(SECRET);
  const pubKey = keypair.publicKey();
  console.log(`Deployer: ${pubKey}`);

  const server = new rpc.Server(RPC_URL);

  let account;
  try {
    account = await server.getAccount(pubKey);
    console.log(`Balance: ${account.balances[0]?.balance || "0"} XLM`);
  } catch {
    console.log("Funding via Friendbot...");
    const resp = await fetch(`${FRIENDBOT_URL}?addr=${pubKey}`);
    const data = await resp.json();
    if (data.hash) console.log(`Funded! Tx: ${data.hash}`);
    account = await server.getAccount(pubKey);
  }

  const results = {};

  for (const contract of CONTRACTS) {
    const wasmPath = path.join(WASM_DIR, contract.file);
    let wasm;
    try {
      wasm = readFileSync(wasmPath);
    } catch {
      console.error(`\nSKIPPED: ${contract.name} — wasm not found`);
      continue;
    }

    console.log(`\n--- ${contract.name} (${(wasm.length / 1024).toFixed(1)} KB) ---`);

    try {
      account = await server.getAccount(pubKey);
      const id = await deployContract(server, account, keypair, wasm, NETWORK_PASSPHRASE);
      console.log(`  ✅ Contract ID: ${id}`);
      results[contract.key] = id;
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      if (err.stack) console.error(`     ${err.stack.split('\n').slice(1,3).join('\n     ')}`);
    }
  }

  const outPath = path.resolve(__dirname, "..", "deployed.json");
  writeFileSync(outPath, JSON.stringify({
    network: "testnet",
    deployer: pubKey,
    deployed: results,
    timestamp: new Date().toISOString(),
  }, null, 2));

  console.log(`\n=== Results saved to ${outPath} ===`);
  console.log(JSON.stringify(results, null, 2));

  if (Object.keys(results).length > 0) {
    console.log("\n=== Frontend config (contracts.ts) ===");
    console.log(`testnet: {`);
    for (const [key, id] of Object.entries(results)) {
      console.log(`  ${key}: "${id}",`);
    }
    console.log(`},`);
  }
}

main().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});

import binaryenModule from "binaryen";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WASM_DIR = path.resolve(__dirname, "..", "target", "wasm32-unknown-unknown", "release");
const binaryen = binaryenModule.default;

const contracts = [
  "ip_nft.wasm",
  "ip_nft_fractionalize.wasm",
  "research_funding.wasm",
  "governance.wasm",
];

for (const file of contracts) {
  const wasmPath = path.join(WASM_DIR, file);
  const data = readFileSync(wasmPath);
  const wasmBytes = new Uint8Array(data);
  
  try {
    const mod = binaryen.readBinary(wasmBytes);
    
    // Check if it has a validate method
    if (typeof mod.validate === 'function') {
      const valid = mod.validate();
      console.log(`${file}: parsed, valid=${valid}`);
    } else {
      console.log(`${file}: parsed successfully`);
    }
    
    // Optimize
    if (typeof mod.optimize === 'function') {
      mod.optimize();
      console.log(`${file}: optimized`);
    }
    
    // Emit
    const output = mod.emitBinary();
    const outPath = path.join(WASM_DIR, file.replace(".wasm", "_opt.wasm"));
    writeFileSync(outPath, Buffer.from(output));
    console.log(`${file}: ${data.length} -> ${output.length} bytes`);
  } catch (e) {
    console.log(`${file}: Error - ${e.message.substring(0, 200)}`);
  }
}

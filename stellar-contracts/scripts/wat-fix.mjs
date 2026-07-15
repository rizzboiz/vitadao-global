import wabtModule from "wabt";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WASM_DIR = path.resolve(__dirname, "..", "target", "wasm32-unknown-unknown", "release");

const contracts = [
  "ip_nft.wasm",
  "ip_nft_fractionalize.wasm",
  "research_funding.wasm",
  "governance.wasm",
];

async function main() {
  const wabt = await wabtModule();

  for (const file of contracts) {
    const wasmPath = path.join(WASM_DIR, file);
    const data = readFileSync(wasmPath);

    // Read WASM with all features enabled
    const module = wabt.readWasm(data, {
      readDebugNames: true,
      features: { reference_types: true, bulk_memory: true, nontrapping_float_to_int: true }
    });

    const wat = module.toText({ foldExprs: false, inlineExport: false });

    // Modify WAT:
    // 1. Remove table.init, elem.drop, table.copy, table.fill instructions
    //    These come after their stack operands, so we replace each with the right number of drops
    // 2. Keep everything else as-is
    const lines = wat.split('\n');
    const outLines = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip reference-types instructions (they consume stack values)
      // table.init, elem.drop, table.copy, table.fill
      if (trimmed.startsWith('table.init') || 
          trimmed.startsWith('elem.drop') ||
          trimmed.startsWith('table.copy') || 
          trimmed.startsWith('table.fill')) {
        // Determine how many drops based on instruction
        let numPops = 3; // default for table.init, table.copy, table.fill
        if (trimmed.startsWith('elem.drop')) numPops = 1;
        
        // Add drops with proper indentation
        const indent = line.match(/^\s*/)[0];
        for (let i = 0; i < numPops; i++) {
          outLines.push(`${indent}drop`);
        }
        continue;
      }

      outLines.push(line);
    }

    const fixedWat = outLines.join('\n');

    // Parse back with reference_types disabled
    const parsed = wabt.parseWat(file.replace('.wasm', ''), fixedWat, {
      features: { reference_types: false, bulk_memory: true, nontrapping_float_to_int: true }
    });

    const binary = parsed.toBinary({
      log: false,
      canonicalize_lebs: true,
      write_debug_names: false,
      features: { reference_types: false, bulk_memory: true, nontrapping_float_to_int: true }
    });

    const outPath = path.join(WASM_DIR, file.replace('.wasm', '_fixed.wasm'));
    writeFileSync(outPath, Buffer.from(binary.buffer));
    console.log(`${file}: ${data.length} -> ${binary.buffer.byteLength} bytes`);
  }
}

main().catch(e => console.error(e.message));

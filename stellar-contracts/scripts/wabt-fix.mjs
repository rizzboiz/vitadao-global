import wabtModule from "wabt";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

    // 1. Read with all features enabled (to handle reference-types)
    const module = wabt.readWasm(data, {
      readDebugNames: true,
      features: { reference_types: true, bulk_memory: true, nontrapping_float_to_int: true }
    });

    // 2. Convert to WAT text (this normalizes call_indirect table indices, strips 0xfc table instrs)
    const wat = module.toText({ foldExprs: false, inlineExport: false });

    // 3. Parse WAT back with reference_types DISABLED (won't emit ref-types in binary)
    const parsed = wabt.parseWat(file.replace(".wasm", ""), wat, {
      features: { reference_types: false, bulk_memory: true, nontrapping_float_to_int: true }
    });

    const binary = parsed.toBinary({
      log: false,
      canonicalize_lebs: true,
      write_debug_names: false,
    });

    const cleanBytes = new Uint8Array(binary.buffer);

    // 4. Extract custom sections from original WASM and append them
    const customSections = extractCustomSections(data);
    const result = Buffer.concat([Buffer.from(cleanBytes), ...customSections]);

    const outPath = path.join(WASM_DIR, file.replace(".wasm", "_fixed.wasm"));
    writeFileSync(outPath, result);
    console.log(`${file}: ${data.length} -> ${result.length} bytes (${customSections.length} custom sections preserved)`);
  }
}

function extractCustomSections(data) {
  const sections = [];
  let pos = 8; // skip WASM header

  while (pos < data.length) {
    const secId = data[pos++];
    const lenR = readLeb(data, pos);
    pos += lenR.bytes;
    const secEnd = pos + lenR.value;

    if (secId === 0) {
      // Custom section - extract the entire section (id + length + data)
      const secIdByte = 0;
      const secData = Buffer.from(data.slice(pos, secEnd));
      const header = Buffer.alloc(1 + lebSize(secData.length));
      header[0] = secIdByte;
      writeLeb(header, 1, secData.length);
      sections.push(Buffer.concat([header, secData]));
    }

    pos = secEnd;
  }

  return sections;
}

function readLeb(buf, pos) {
  let value = 0, shift = 0, count = 0;
  while (true) {
    const b = buf[pos + count];
    value |= (b & 0x7f) << shift;
    shift += 7;
    count++;
    if ((b & 0x80) === 0) break;
  }
  return { value, bytes: count };
}

function writeLeb(buf, pos, value) {
  let v = value >>> 0;
  while (true) {
    let b = v & 0x7f;
    v >>>= 7;
    if (v > 0) b |= 0x80;
    buf[pos++] = b;
    if (v === 0) break;
  }
}

function lebSize(value) {
  let v = value >>> 0;
  let s = 0;
  do { v >>>= 7; s++; } while (v > 0);
  return s;
}

main().catch(e => console.error(e.message));

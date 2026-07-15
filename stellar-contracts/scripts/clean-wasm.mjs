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

for (const file of contracts) {
  const wasmPath = path.join(WASM_DIR, file);
  const data = readFileSync(wasmPath);
  const bytes = new Uint8Array(data);

  const out = [];
  let pos = 8; // skip magic + version
  out.push(...bytes.slice(0, pos));

  while (pos < bytes.length) {
    const sectionId = bytes[pos++];
    let len = 0, shift = 0;
    while (true) {
      const byte = bytes[pos++];
      len |= (byte & 0x7f) << shift;
      shift += 7;
      if ((byte & 0x80) === 0) break;
    }
    const sectionData = bytes.slice(pos, pos + len);
    pos += len;

    // Skip data count section (section id 12) and producers/target_features custom sections
    if (sectionId === 12) {
      // data count - skip
    } else if (sectionId === 9) {
      // element section - check if it uses reference-types encoding
      // check first byte (flags)
    } else {
      // Write section id
      out.push(sectionId);
      // Write length (LEB128)
      let tmp = len;
      do {
        let byte = tmp & 0x7f;
        tmp >>= 7;
        if (tmp > 0) byte |= 0x80;
        out.push(byte);
      } while (tmp > 0);
      out.push(...sectionData);
    }
  }

  const outPath = path.join(WASM_DIR, file.replace(".wasm", "_clean.wasm"));
  writeFileSync(outPath, Buffer.from(out));
  console.log(`${file}: ${data.length} -> ${out.length} bytes`);
}

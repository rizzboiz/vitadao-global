import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "target", "wasm32-unknown-unknown", "release");

function readLeb(buf, pos) {
  let value = 0, shift = 0, count = 0;
  while (true) { const b = buf[pos+count]; value |= (b&0x7f)<<shift; shift += 7; count++; if ((b&0x80)===0) break; }
  return {value, bytes: count};
}

for (const file of ["ip_nft.wasm", "ip_nft_fixed.wasm"]) {
  const data = readFileSync(path.join(dir, file));
  let pos = 8;
  console.log(`\n=== ${file} (${data.length} bytes) ===`);
  while (pos < data.length) {
    const secId = data[pos++];
    const r = readLeb(data, pos);
    pos += r.bytes;
    const secStart = pos;
    const secEnd = pos + r.value;
    if (secId === 9 || secId === 0) {
      const dump = [];
      for (let i = secStart; i < Math.min(secEnd, secStart + 32); i++) dump.push(data[i].toString(16).padStart(2,'0'));
      console.log(`  Section id=${secId} size=${r.value} data[${secStart}-${secEnd-1}]: ${dump.join(' ')}`);
    }
    pos = secEnd;
  }
}

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

const data = readFileSync(path.join(dir, "ip_nft_fixed.wasm"));

// Dump section structure
let pos = 8;
let secIdx = 0;
while (pos < data.length) {
  const secId = data[pos++];
  const r = readLeb(data, pos);
  pos += r.bytes;
  const secStart = pos;
  const secEnd = pos + r.value;
  console.log(`Section ${secIdx}: id=${secId} size=${r.value} pos=${secStart}-${secEnd}`);
  if (secId === 9 || secId === 0) {
    const dump = [];
    for (let i = secStart; i < Math.min(secEnd, secStart + 30); i++) dump.push(data[i].toString(16).padStart(2,'0'));
    console.log(`  data: ${dump.join(' ')}`);
  }
  pos = secEnd;
  secIdx++;
}

import { readFileSync } from "fs";
import path from "path";

const dir = path.resolve(process.cwd(), "target", "wasm32-unknown-unknown", "release");
const data = readFileSync(path.join(dir, "research_funding.wasm"));
for (let i = 15; i <= 30; i++) {
  console.log(`${i}: 0x${data[i].toString(16).padStart(2,'0')}`);
}

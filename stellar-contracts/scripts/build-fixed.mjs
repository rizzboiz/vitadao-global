import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WASM_DIR = path.resolve(__dirname, "..", "target", "wasm32-unknown-unknown", "release");
const TMP_DIR = path.join(__dirname, "..", "tmp-fix");
const WABT_BIN = path.resolve(__dirname, "node_modules", ".bin");

const contracts = [
  "ip_nft.wasm",
  "ip_nft_fractionalize.wasm",
  "research_funding.wasm",
  "governance.wasm",
];

function run(cmd, cwd) {
  return execSync(cmd, { cwd, encoding: "utf8", stdio: "pipe" });
}

function readLeb(buf, pos) {
  let value = 0, shift = 0, count = 0;
  while (true) { const b = buf[pos + count]; value |= (b & 0x7f) << shift; shift += 7; count++; if ((b & 0x80) === 0) break; }
  return { value, bytes: count };
}

function lebSize(value) {
  let v = value >>> 0, s = 0;
  do { v >>>= 7; s++; } while (v > 0);
  return s;
}

function extractCustomSections(data) {
  const sections = [];
  let pos = 8;
  while (pos < data.length) {
    const secId = data[pos++];
    const r = readLeb(data, pos);
    pos += r.bytes;
    const secEnd = pos + r.value;
    if (secId === 0) {
      const secBuf = Buffer.from(data.slice(pos, secEnd));
      const header = Buffer.alloc(1 + lebSize(secBuf.length));
      header[0] = 0;
      let v = secBuf.length >>> 0, hp = 1;
      while (true) { let b = v & 0x7f; v >>>= 7; if (v > 0) b |= 0x80; header[hp++] = b; if (v === 0) break; }
      sections.push(Buffer.concat([header, secBuf]));
    }
    pos = secEnd;
  }
  return sections;
}

mkdirSync(TMP_DIR, { recursive: true });

for (const file of contracts) {
  const wasmPath = path.join(WASM_DIR, file);
  const data = readFileSync(wasmPath);
  const base = file.replace(".wasm", "");
  const watPath = path.join(TMP_DIR, `${base}.wat`);
  const outPath = path.join(WASM_DIR, `${base}_fixed.wasm`);

  console.log(`\n--- ${file} ---`);

  // Step 1: wasm2wat with all features
  run(`"${path.join(WABT_BIN, "wasm2wat")}" "${wasmPath}" -o "${watPath}"`);
  console.log("  wasm2wat: OK");

  // Step 2: fix WAT - replace 0xfc table instructions with drops
  let wat = readFileSync(watPath, "utf8");
  const lines = wat.split("\n");
  const outLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = line.match(/^\s*/)[0];

    // table.init, table.copy, table.fill: pop 3, push 0
    if (/^table\.init\b/.test(trimmed) || /^table\.copy\b/.test(trimmed) || /^table\.fill\b/.test(trimmed)) {
      outLines.push(`${indent}drop`, `${indent}drop`, `${indent}drop`);
      continue;
    }
    // table.set: pop 2, push 0
    if (/^table\.set\b/.test(trimmed)) {
      outLines.push(`${indent}drop`, `${indent}drop`);
      continue;
    }
    // table.get: pop 1, push 1
    if (/^table\.get\b/.test(trimmed)) {
      outLines.push(`${indent}drop`, `${indent}i32.const 0`);
      continue;
    }
    // table.grow: pop 2, push 1
    if (/^table\.grow\b/.test(trimmed)) {
      outLines.push(`${indent}drop`, `${indent}drop`, `${indent}i32.const -1`);
      continue;
    }
    // table.size: pop 0, push 1
    if (/^table\.size\b/.test(trimmed)) {
      outLines.push(`${indent}i32.const 0`);
      continue;
    }
    // elem.drop: pop 1 (segment index), push 0
    // Actually elem.drop takes an immediate, not stack. Replace with drop+drop to balance the stack
    // if elem.drop pushed the segment index... 
    // Actually elem.drop pops nothing from the value stack. So just remove it.
    if (/^elem\.drop\b/.test(trimmed)) {
      continue;
    }

    outLines.push(line);
  }

  wat = outLines.join("\n");

  // Step 3: wat2wasm with reference-types DISABLED
  writeFileSync(watPath, wat, "utf8");
  run(`"${path.join(WABT_BIN, "wat2wasm")}" "${watPath}" --disable-reference-types -o "${outPath}"`);
  console.log("  wat2wasm: OK");

  // Step 4: append custom sections from original
  const customs = extractCustomSections(data);
  if (customs.length > 0) {
    const clean = readFileSync(outPath);
    const result = Buffer.concat([clean, ...customs]);
    writeFileSync(outPath, result);
    console.log(`  Appended ${customs.length} custom sections: ${clean.length} -> ${result.length} bytes`);
  }
}

console.log("\nDone!");

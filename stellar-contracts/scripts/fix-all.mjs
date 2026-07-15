import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WASM_DIR = path.resolve(__dirname, "..", "target", "wasm32-unknown-unknown", "release");
const TMP_DIR = path.join(__dirname, "..", "tmp-fix");
const WABT_BIN = path.resolve(__dirname, "node_modules", ".bin");

const files = [
  "ip_nft.wasm",
  "ip_nft_fractionalize.wasm",
  "research_funding.wasm",
  "governance.wasm",
];

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: "pipe" });
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
      while (true) { let byte_ = v & 0x7f; v >>>= 7; if (v > 0) byte_ |= 0x80; header[hp++] = byte_; if (v === 0) break; }
      sections.push(Buffer.concat([header, secBuf]));
    }
    pos = secEnd;
  }
  return sections;
}

function checkRefTypes(filePath) {
  const data = readFileSync(filePath);
  // Find code section
  let pos = 8, codeStart = 0, codeLen = 0;
  while (pos < data.length) {
    const secId = data[pos++];
    const r = readLeb(data, pos);
    pos += r.bytes;
    if (secId === 10) { codeStart = pos; codeLen = r.value; }
    pos += r.value;
  }
  
  let badCI = 0;
  let fcRef = {};
  for (let i = codeStart; i < codeStart + codeLen - 2; i++) {
    if (data[i] === 0x11) {
      const typeR = readLeb(data, i + 1);
      const tableR = readLeb(data, i + 1 + typeR.bytes);
      if (tableR.value !== 0) badCI++;
    }
    if (data[i] === 0xfc) {
      const subR = readLeb(data, i + 1);
      const names = {0:1,1:1,2:1,3:1,4:1,5:1,6:1,8:1};
      if (names[subR.value]) {
        fcRef[subR.value] = (fcRef[subR.value] || 0) + 1;
      }
    }
  }
  return { badCI, fcRef };
}

mkdirSync(TMP_DIR, { recursive: true });

for (const file of files) {
  const base = file.replace(".wasm", "");
  const wasmPath = path.join(WASM_DIR, file);
  const watPath = path.join(TMP_DIR, `${base}.wat`);
  const outPath = path.join(WASM_DIR, `${base}_fixed.wasm`);

  console.log(`\n--- ${file} ---`);

  // Step 1: wasm2wat
  run(`"${path.join(WABT_BIN, "wasm2wat")}" "${wasmPath}" -o "${watPath}"`);
  
  // Step 2: Fix WAT - replace 0xfc table instructions with drops
  let wat = readFileSync(watPath, "utf8");
  const lines = wat.split("\n");
  const outLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = line.match(/^\s*/)[0];
    
    if (/^table\.init\b/.test(trimmed) || /^table\.copy\b/.test(trimmed) || /^table\.fill\b/.test(trimmed)) {
      outLines.push(`${indent}drop`, `${indent}drop`, `${indent}drop`);
    } else if (/^table\.set\b/.test(trimmed)) {
      outLines.push(`${indent}drop`, `${indent}drop`);
    } else if (/^table\.get\b/.test(trimmed)) {
      outLines.push(`${indent}drop`, `${indent}i32.const 0`);
    } else if (/^table\.grow\b/.test(trimmed)) {
      outLines.push(`${indent}drop`, `${indent}drop`, `${indent}i32.const -1`);
    } else if (/^table\.size\b/.test(trimmed)) {
      outLines.push(`${indent}i32.const 0`);
    } else if (/^elem\.drop\b/.test(trimmed)) {
      // elem.drop takes immediate, not stack. Just remove.
    } else {
      outLines.push(line);
    }
  }

  wat = outLines.join("\n");
  writeFileSync(watPath, wat, "utf8");

  // Step 3: wat2wasm with --disable-reference-types
  try {
    run(`"${path.join(WABT_BIN, "wat2wasm")}" "${watPath}" --disable-reference-types -o "${outPath}"`);
  } catch (e) {
    console.log(`  wat2wasm failed: ${e.message.split('\n')[0]}`);
    continue;
  }

  // Step 4: Extract and append custom sections
  const orig = readFileSync(wasmPath);
  const customs = extractCustomSections(orig);
  
  if (customs.length > 0) {
    const clean = readFileSync(outPath);
    const result = Buffer.concat([clean, ...customs]);
    writeFileSync(outPath, result);
    console.log(`  Clean: ${clean.length} bytes, +${customs.length} customs = ${result.length} bytes`);
  }

  // Step 5: Verify no reference-types remain
  const check = checkRefTypes(outPath);
  if (check.badCI > 0 || Object.keys(check.fcRef).length > 0) {
    console.log(`  ISSUES: ${check.badCI} bad CI, ${JSON.stringify(check.fcRef)}`);
  } else {
    console.log(`  OK: no reference-types constructs`);
  }
}

console.log("\nDone!");

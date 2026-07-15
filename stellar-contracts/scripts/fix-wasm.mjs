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

// Stack effects of 0xfc table instructions: [pops, pushes]
const TABLE_EFFECT = {
  0x0c: [3, 0], 0x0d: [0, 0], 0x0e: [3, 0], 0x0f: [3, 0],
  0x10: [2, 1], 0x11: [1, 1], 0x12: [2, 0], 0x13: [0, 1],
};
const TABLE_IMMS = { 0x0c: 2, 0x0d: 1, 0x0e: 2, 0x0f: 1, 0x10: 1, 0x11: 1, 0x12: 1, 0x13: 1 };

function readLeb(bytes, pos) {
  let value = 0, shift = 0, count = 0;
  while (true) {
    const b = bytes[pos + count];
    if (b === undefined) break;
    value |= (b & 0x7f) << shift;
    shift += 7;
    count++;
    if ((b & 0x80) === 0) break;
  }
  return { value, bytes: count };
}

function writeLeb(out, value) {
  let tmp = value >>> 0;
  do {
    let b = tmp & 0x7f;
    tmp >>>= 7;
    if (tmp > 0) b |= 0x80;
    out.push(b);
  } while (tmp > 0);
}

//
// Compute the full byte size of a single WASM instruction
//
function instrSize(bytes, pos, end) {
  if (pos >= end) return 0;
  const op = bytes[pos];

  // Single-byte opcodes (no immediates)
  const noimm_one = [
    0x00, 0x01, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0f,
    0x1a, 0x1b,
    0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7,
    0xe0, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xee, 0xef,
    0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
  ];
  if (noimm_one.includes(op)) return 1;

  // Comparison/arithmetic operators (0x45-0x7f, excluding some ranges)
  if (op >= 0x45 && op <= 0x7f) return 1;
  if (op >= 0x67 && op <= 0x7f) return 1; // actually covered by above

  // block/loop/if (0x02-0x04): immediate is block_type (1 LEB128)
  if (op >= 0x02 && op <= 0x04) {
    const r = readLeb(bytes, pos + 1);
    return 1 + r.bytes;
  }

  // br/br_if (0x0c-0x0d): label_idx (LEB128)
  if (op >= 0x0c && op <= 0x0d) {
    const r = readLeb(bytes, pos + 1);
    return 1 + r.bytes;
  }

  // br_table (0x0e): vec(label_idx) + default_label
  if (op === 0x0e) {
    let p = pos + 1;
    const n = readLeb(bytes, p); p += n.bytes;
    for (let i = 0; i < n.value; i++) { const l = readLeb(bytes, p); p += l.bytes; }
    const def = readLeb(bytes, p); p += def.bytes;
    return p - pos;
  }

  // call (0x10): func_idx (LEB128)
  if (op === 0x10) {
    const r = readLeb(bytes, pos + 1);
    return 1 + r.bytes;
  }

  // call_indirect (0x11): type_idx (LEB128) + table_idx (LEB128)
  if (op === 0x11) {
    const t = readLeb(bytes, pos + 1);
    const x = readLeb(bytes, pos + 1 + t.bytes);
    return 1 + t.bytes + x.bytes;
  }

  // return_call (0x12), return_call_indirect (0x14) [tail-call]
  if (op === 0x12) {
    const r = readLeb(bytes, pos + 1);
    return 1 + r.bytes;
  }
  if (op === 0x14) {
    const t = readLeb(bytes, pos + 1);
    const x = readLeb(bytes, pos + 1 + t.bytes);
    return 1 + t.bytes + x.bytes;
  }

  // select t* (0x1c): vec(valtype)
  if (op === 0x1c) {
    let p = pos + 1;
    const n = readLeb(bytes, p); p += n.bytes;
    p += n.value; // each valtype is 1 byte (0x7f/0x7e/0x7d/0x7c/0x7b)
    return p - pos;
  }

  // local.get/set/tee (0x20-0x22), global.get/set (0x23-0x24)
  if (op >= 0x20 && op <= 0x24) {
    const r = readLeb(bytes, pos + 1);
    return 1 + r.bytes;
  }

  // table.get/set (0x25-0x26) [reference-types] (we strip these)
  if (op === 0x25 || op === 0x26) {
    const r = readLeb(bytes, pos + 1);
    return 1 + r.bytes;
  }

  // memory size/grow (0x3f-0x40): 0x00 reserved byte
  if (op === 0x3f || op === 0x40) return 2;

  // i32/i64.const (0x41-0x42): signed LEB128 value
  if (op === 0x41 || op === 0x42) {
    let tmp = pos + 1, shift = 0, count = 0;
    while (true) { const b = bytes[tmp]; tmp++; count++; if ((b & 0x80) === 0) break; }
    return 1 + count;
  }

  // f32/f64.const (0x43-0x44)
  if (op === 0x43) return 5;
  if (op === 0x44) return 9;

  // Load/store with memarg (0x28-0x3d + 0x2e/0x2f/0x36-0x3e):
  // These have memarg = align(LEB128) + offset(LEB128)
  // 0x28 = i32.load, 0x29 = i64.load, 0x2a = f32.load, 0x2b = f64.load,
  // 0x2c = i32.load8_s, 0x2d = i32.load8_u, 0x2e = i32.load16_s, 0x2f = i32.load16_u,
  // 0x30 = i64.load8_s, 0x31 = i64.load8_u, 0x32 = i64.load16_s, 0x33 = i64.load16_u,
  // 0x34 = i64.load32_s, 0x35 = i64.load32_u,
  // 0x36 = i32.store, 0x37 = i64.store, 0x38 = f32.store, 0x39 = f64.store,
  // 0x3a = i32.store8, 0x3b = i32.store16, 0x3c = i64.store8, 0x3d = i64.store16,
  // 0x3e = i64.store32
  if ((op >= 0x28 && op <= 0x3e) || op === 0x2c || op === 0x2d || op === 0x2e || op === 0x2f) {
    const a = readLeb(bytes, pos + 1); // align
    const o = readLeb(bytes, pos + 1 + a.bytes); // offset
    return 1 + a.bytes + o.bytes;
  }
  // Simplify: also handle any load/store that might be covered by other ranges
  if (op >= 0x28 && op <= 0x3e) {
    const a = readLeb(bytes, pos + 1);
    const o = readLeb(bytes, pos + 1 + a.bytes);
    return 1 + a.bytes + o.bytes;
  }

  // 0xfc prefix (misc/bulk-memory/reference-types)
  if (op === 0xfc) {
    const subR = readLeb(bytes, pos + 1);
    const sub = subR.value;
    let base = 1 + subR.bytes;
    // trunc_sat (0-7): no further operands
    if (sub <= 7) return base;
    // memory.init (8): segidx + memidx
    if (sub === 8) { const s = readLeb(bytes, pos + base); base += s.bytes; const m = readLeb(bytes, pos + base); base += m.bytes; return base; }
    // data.drop (9): segidx
    if (sub === 9) { const s = readLeb(bytes, pos + base); base += s.bytes; return base; }
    // memory.copy (0x0a): dstmem + srcmem
    if (sub === 0x0a) { const d = readLeb(bytes, pos + base); base += d.bytes; const s = readLeb(bytes, pos + base); base += s.bytes; return base; }
    // memory.fill (0x0b): memidx
    if (sub === 0x0b || sub === 0x0f || sub === 0x10 || sub === 0x11 || sub === 0x12 || sub === 0x13) {
      const m = readLeb(bytes, pos + base); base += m.bytes; return base;
    }
    // table.init (0x0c): segidx + tableidx
    if (sub === 0x0c) { const s = readLeb(bytes, pos + base); base += s.bytes; const t = readLeb(bytes, pos + base); base += t.bytes; return base; }
    // elem.drop (0x0d): segidx
    if (sub === 0x0d) { const s = readLeb(bytes, pos + base); base += s.bytes; return base; }
    // table.copy (0x0e): dst + src
    if (sub === 0x0e) { const d = readLeb(bytes, pos + base); base += d.bytes; const s = readLeb(bytes, pos + base); base += s.bytes; return base; }
    // table.fill (0x0f): tableidx
    if (sub === 0x0f) { const m = readLeb(bytes, pos + base); base += m.bytes; return base; }
    // table.grow (0x10): tableidx
    if (sub === 0x10) { const m = readLeb(bytes, pos + base); base += m.bytes; return base; }
    // table.get (0x11): tableidx
    if (sub === 0x11) { const m = readLeb(bytes, pos + base); base += m.bytes; return base; }
    // table.set (0x12): tableidx
    if (sub === 0x12) { const m = readLeb(bytes, pos + base); base += m.bytes; return base; }
    // table.size (0x13): tableidx
    if (sub === 0x13) { const m = readLeb(bytes, pos + base); base += m.bytes; return base; }
    // Unknown subopcode - try reading more LEB128s to stay in sync (heuristic)
    return base + 4;
  }

  // SIMD prefix (0xfd)
  if (op === 0xfd) {
    // Too complex to handle fully. Just estimate 4 bytes.
    const subR = readLeb(bytes, pos + 1);
    let base = 1 + subR.bytes;
    return base + 4;
  }

  // Exception handling prefix (0xfe)
  if (op === 0xfe) {
    const subR = readLeb(bytes, pos + 1);
    let base = 1 + subR.bytes;
    return base + 4;
  }

  // Try/catch/throw: block-like structures
  if (op === 0x06 || op === 0x07) {
    const r = readLeb(bytes, pos + 1);
    return 1 + r.bytes;
  }

  // Unknown opcode - default to 1 byte to avoid infinite loop
  console.error(`  Unknown opcode 0x${op.toString(16)} at pos ${pos}`);
  return 1;
}

function fixCodeSection(codeBytes) {
  const out = [];
  let readPos = 0;

  const fcResult = readLeb(codeBytes, readPos);
  writeLeb(out, fcResult.value);
  readPos += fcResult.bytes;

  for (let f = 0; f < fcResult.value; f++) {
    const bodySizeResult = readLeb(codeBytes, readPos);
    const oldBodySize = bodySizeResult.value;
    readPos += bodySizeResult.bytes;

    const bodyStart = readPos;
    const bodyContent = [];

    // Copy locals
    const localCountResult = readLeb(codeBytes, readPos);
    writeLeb(bodyContent, localCountResult.value);
    readPos += localCountResult.bytes;

    for (let l = 0; l < localCountResult.value; l++) {
      const cResult = readLeb(codeBytes, readPos);
      writeLeb(bodyContent, cResult.value);
      readPos += cResult.bytes;
      bodyContent.push(codeBytes[readPos++]);
    }

    // Process instructions
    while (readPos < bodyStart + oldBodySize) {
      const opcode = codeBytes[readPos];
      const size = instrSize(codeBytes, readPos, bodyStart + oldBodySize);

      if (opcode === 0x11) {
        // call_indirect: ensure table index is 0x00
        const t = readLeb(codeBytes, readPos + 1);
        const x = readLeb(codeBytes, readPos + 1 + t.bytes);
        bodyContent.push(0x11);
        writeLeb(bodyContent, t.value);
        bodyContent.push(0x00); // always table index 0
        readPos += size;
      } else if (opcode === 0xfc) {
        const subR = readLeb(codeBytes, readPos + 1);
        const sub = subR.value;

        if (TABLE_EFFECT[sub] !== undefined) {
          // Strip reference-types table instruction
          const imms = TABLE_IMMS[sub] || 0;
          let base = 1 + subR.bytes;
          for (let j = 0; j < imms; j++) { const or = readLeb(codeBytes, readPos + base); base += or.bytes; }
          const [pops, pushes] = TABLE_EFFECT[sub];
          for (let d = 0; d < pops; d++) bodyContent.push(0x1a); // drop
          // For ref-typed pushes, use ref.null instead of i32.const 0
          // But i32.const 0 is OK for i32-typed pushes
          // For table.get which pushes reftype, we need ref.null but we don't know the type
          // Use unreachable -> i32.const 0 for simplicity (won't be reached at runtime)
          for (let d = 0; d < pushes; d++) { bodyContent.push(0x41); bodyContent.push(0x00); } // i32.const 0
          readPos += size;
        } else {
          // Non-reference-types 0xfc instruction: pass through
          for (let i = 0; i < size; i++) bodyContent.push(codeBytes[readPos + i]);
          readPos += size;
        }
      } else if (opcode === 0x25 || opcode === 0x26) {
        // table.get/table.set (old-style, subopcode 0x25/0x26)
        // This is a single-byte opcode in the reference-types proposal, not 0xfc prefix
        // table.get (0x25): pops i32(tableidx), pushes funcref. Net: 0
        // table.set (0x26): pops funcref + i32(tableidx). Net: -2
        const r = readLeb(codeBytes, readPos + 1);
        if (opcode === 0x25) {
          bodyContent.push(0x1a); // drop (pop tableidx)
          bodyContent.push(0x41); bodyContent.push(0x00); // i32.const 0 (push 0 instead of funcref)
        } else {
          bodyContent.push(0x1a); bodyContent.push(0x1a); // drop tableidx, drop value
        }
        readPos += size;
      } else {
        // Pass through unchanged
        for (let i = 0; i < size; i++) bodyContent.push(codeBytes[readPos + i]);
        readPos += size;
      }
    }

    writeLeb(out, bodyContent.length);
    out.push(...bodyContent);
  }

  return out;
}

function writeSection(out, sectionId, data) {
  out.push(sectionId);
  writeLeb(out, data.length);
  out.push(...data);
}

// Main
for (const file of contracts) {
  const wasmPath = path.join(WASM_DIR, file);
  const data = readFileSync(wasmPath);
  const bytes = new Uint8Array(data);

  const out = [];
  let pos = 8;
  out.push(...bytes.slice(0, pos));

  while (pos < bytes.length) {
    const sectionId = bytes[pos++];
    const lenResult = readLeb(bytes, pos);
    const len = lenResult.value;
    pos += lenResult.bytes;
    const sectionData = bytes.slice(pos, pos + len);
    pos += len;

    if (sectionId === 10) {
      const fixed = fixCodeSection(codeBytesToArray(sectionData));
      console.log(`${file}: code section ${sectionData.length} -> ${fixed.length} bytes`);
      writeSection(out, sectionId, Buffer.from(fixed));
    } else {
      writeSection(out, sectionId, sectionData);
    }
  }

  const outPath = path.join(WASM_DIR, file.replace(".wasm", "_fixed.wasm"));
  writeFileSync(outPath, Buffer.from(out));
  console.log(`${file}: ${data.length} -> ${out.length} bytes\n`);
}

function codeBytesToArray(buf) {
  const arr = [];
  for (let i = 0; i < buf.length; i++) arr.push(buf[i]);
  return arr;
}

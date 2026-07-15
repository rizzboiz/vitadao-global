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

// Reference-types table instructions in 0xfc prefix:
// subopcodes 0x0c-0x15: table.init, elem.drop, table.copy, table.fill, table.grow, table.get, table.set, table.size
const IS_REF_TYPE_TABLE = {};
for (let s = 0x0c; s <= 0x15; s++) IS_REF_TYPE_TABLE[s] = true;

// Number of LEB128 immediates for each ref-types table subopcode
const TABLE_INSTR_IMMS = {
  0x0c: 2, // table.init: segidx, tableidx
  0x0d: 1, // elem.drop: segidx
  0x0e: 2, // table.copy: dst, src
  0x0f: 1, // table.fill: tableidx
  0x10: 1, // table.grow: tableidx
  0x11: 1, // table.get: tableidx
  0x12: 1, // table.set: tableidx
  0x13: 1, // table.size: tableidx
};

for (const file of ["ip_nft_fixed.wasm","ip_nft_fractionalize_fixed.wasm","research_funding_fixed.wasm","governance_fixed.wasm"]) {
  const data = readFileSync(path.join(dir, file));
  let pos = 8, codeStart = 0, codeLen = 0;
  while (pos < data.length) {
    const sid = data[pos++];
    const r = readLeb(data, pos); pos += r.bytes;
    if (sid === 10) { codeStart = pos; codeLen = r.value; }
    pos += r.value;
  }
  
  let badCI = 0; const fcTableInstrs = [];
  let cp = codeStart;
  
  while (cp < codeStart + codeLen) {
    const r = readLeb(data, cp);
    const bodySize = r.value;
    cp += r.bytes;
    const bodyEnd = cp + bodySize;
    
    const lr = readLeb(data, cp); cp += lr.bytes;
    for (let i = 0; i < lr.value; i++) { const cr = readLeb(data, cp); cp += cr.bytes; cp++; }
    
    while (cp < bodyEnd) {
      const op = data[cp];
      
      if (op === 0x11) {
        // call_indirect: typeidx tableidx
        const tr = readLeb(data, cp+1);
        const tabR = readLeb(data, cp+1+tr.bytes);
        if (tabR.value !== 0) badCI++;
        cp += 1 + tr.bytes + tabR.bytes;
      } else if (op === 0xfc) {
        const subR = readLeb(data, cp+1);
        const sub = subR.value;
        cp += 1 + subR.bytes;
        
        if (IS_REF_TYPE_TABLE[sub]) {
          const immCount = TABLE_INSTR_IMMS[sub] || 0;
          for (let j = 0; j < immCount; j++) { const or = readLeb(data, cp); cp += or.bytes; }
          fcTableInstrs.push(`0xfc/${sub}`);
        } else if (sub >= 0x08 && sub <= 0x0b) {
          // memory.* ops: skip operands
          const operands = {0x08: 2, 0x09: 1, 0x0a: 2, 0x0b: 1}[sub];
          for (let j = 0; j < operands; j++) { const or = readLeb(data, cp); cp += or.bytes; }
        } else if (sub <= 7) {
          // trunc_sat: no operands
        } else {
          // unknown subopcode, skip
        }
      } else if (op === 0x10 || op === 0x2f) {
        cp++; const cr = readLeb(data, cp); cp += cr.bytes;
      } else if (op === 0x41 || op === 0x42) {
        cp++; const cr = readLeb(data, cp); cp += cr.bytes;
      } else if (op === 0x3f) {
        cp++; // br_table: n (LEB), labels (n LEBs), default label (LEB)
        // For simplicity, just skip 2 bytes
        cp+=2;
      } else if (op === 0x2c || op === 0x2d || op === 0x2e) {
        cp += 2; // memarg: align+offset
      } else if (op === 0x04 || op === 0x05 || op === 0x06 || op === 0x07 || op === 0x12 || op === 0x13 || op === 0x14 || op === 0x15 || op === 0x16 || op === 0x17 || op === 0x18 || op === 0x19 || op === 0x1b || op === 0x1c || op === 0x1d || op === 0x1e || op === 0x1f) {
        cp += 2; // br_if, br, call, etc
      } else {
        cp++;
      }
    }
    cp = bodyEnd;
  }
  
  console.log(`${file}: badCI=${badCI}, fcRefType=${fcTableInstrs.length ? JSON.stringify(fcTableInstrs) : 'none'}`);
}

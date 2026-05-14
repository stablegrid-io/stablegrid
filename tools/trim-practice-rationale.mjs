// Trim every `rationale` and `distractorRationale` in practice-set JSON files
// to <=150 chars. Two-pass strategy:
//   1. Sentence boundary: keep first 1-2 sentences while staying under cap.
//   2. Word boundary: if first sentence is itself > cap, truncate at last
//      full word that fits, append "." if it ended on a non-terminator.
//
// In-place rewrite (writes back to the same JSON file). Idempotent — already
// short fields are left alone. Run from project root:
//   node tools/trim-practice-rationale.mjs
//
// Add --dry to preview without writing.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'data/operations/practice-sets/pyspark';
const CAP = 150;
const DRY = process.argv.includes('--dry');

const SENTENCE_RE = /[^.!?]+[.!?]+(?:\s|$)/g;

const trim150 = (raw) => {
  if (typeof raw !== 'string') return raw;
  const text = raw.trim();
  if (text.length <= CAP) return text;

  // Pass 1: greedy sentence accumulation under cap.
  const sentences = text.match(SENTENCE_RE) ?? [];
  if (sentences.length > 0) {
    let acc = '';
    for (const s of sentences) {
      const candidate = (acc + s).trimEnd();
      if (candidate.length <= CAP) {
        acc = candidate;
      } else if (acc.length === 0) {
        // first sentence already over cap → fall through to word-boundary
        break;
      } else {
        return acc.trim();
      }
    }
    if (acc.length > 0 && acc.length <= CAP) return acc.trim();
  }

  // Pass 2: word boundary inside the first ~150 chars.
  let cut = text.slice(0, CAP);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 50) cut = cut.slice(0, lastSpace);
  cut = cut.replace(/[,;:\s]+$/, '').trim();
  if (!/[.!?]$/.test(cut)) cut += '.';
  return cut;
};

const trimNode = (node) => {
  let mutations = 0;
  if (!node || typeof node !== 'object') return 0;
  if (Array.isArray(node)) {
    for (const item of node) mutations += trimNode(item);
    return mutations;
  }
  for (const key of Object.keys(node)) {
    if ((key === 'rationale' || key === 'distractorRationale') && typeof node[key] === 'string') {
      const before = node[key];
      const after = trim150(before);
      if (after !== before) {
        node[key] = after;
        mutations += 1;
      }
    } else {
      mutations += trimNode(node[key]);
    }
  }
  return mutations;
};

const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
let totalFiles = 0;
let totalMutations = 0;

for (const file of files) {
  const path = join(DIR, file);
  const raw = readFileSync(path, 'utf8');
  const doc = JSON.parse(raw);
  const m = trimNode(doc);
  if (m > 0) {
    totalFiles += 1;
    totalMutations += m;
    if (!DRY) {
      // Preserve trailing newline if original had one.
      const out = JSON.stringify(doc, null, 2) + (raw.endsWith('\n') ? '\n' : '');
      writeFileSync(path, out, 'utf8');
    }
    console.log(`${DRY ? '[dry] ' : ''}${file}: trimmed ${m} field(s)`);
  }
}

console.log(`\n${DRY ? '[dry] ' : ''}Touched ${totalFiles} files, trimmed ${totalMutations} fields total.`);

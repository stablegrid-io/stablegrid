// One-shot editorial sweep: replaces legacy design tokens across the codebase.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = '/Users/nedasvaitkus/Desktop/grid';
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'public']);
const SKIP_PATHS = [
  'components/home/landing',
  'components/home/LandingPage.tsx',
  'components/home/landing/LandingFooter',
  'components/home/XPBattery.tsx',
  'components/ui/SystemLabel.tsx',
];
const TARGETS = ['components', 'app'];

const REPLACEMENTS = [
  // text-white patterns — invisible on cream paper
  [/\btext-white(?=[\s"'`}])/g, 'text-on-surface'],
  [/\btext-white\/(\d+)\b/g, 'text-on-surface/$1'],
  [/\bbg-white\/\[0\.(\d+)\]/g, 'bg-on-surface/[0.$1]'],
  [/\bborder-white\/\[0\.(\d+)\]/g, 'border-on-surface/[0.$1]'],
  [/\bbg-white\/(\d+)\b/g, 'bg-on-surface/$1'],
  [/\bborder-white\/(\d+)\b/g, 'border-on-surface/$1'],
  [/\bdivide-white\/\[0\.(\d+)\]/g, 'divide-on-surface/[0.$1]'],

  [/\btext-text-light-primary\b/g, 'text-on-surface'],
  [/\btext-text-dark-primary\b/g, 'text-on-surface'],
  [/\btext-text-light-secondary\b/g, 'text-on-surface-variant'],
  [/\btext-text-dark-secondary\b/g, 'text-on-surface-variant'],
  [/\btext-text-light-tertiary\b/g, 'text-on-surface-variant'],
  [/\btext-text-dark-tertiary\b/g, 'text-on-surface-variant'],
  [/\btext-text-light-muted\b/g, 'text-on-surface-variant'],
  [/\btext-text-dark-muted\b/g, 'text-on-surface-variant'],
  [/\btext-text-light-disabled\b/g, 'text-on-surface-variant'],
  [/\btext-text-dark-disabled\b/g, 'text-on-surface-variant'],
  [/\bbg-light-bg\b/g, 'bg-surface'],
  [/\bbg-dark-bg\b/g, 'bg-surface'],
  [/\bbg-light-surface\b/g, 'bg-surface-container'],
  [/\bbg-dark-surface\b/g, 'bg-surface-container'],
  [/\bbg-light-muted\b/g, 'bg-surface-container-low'],
  [/\bbg-dark-muted\b/g, 'bg-surface-container-low'],
  [/\bbg-light-active\b/g, 'bg-surface-container'],
  [/\bbg-dark-active\b/g, 'bg-surface-container'],
  [/\bbg-light-hover\b/g, 'bg-surface-container'],
  [/\bbg-dark-hover\b/g, 'bg-surface-container'],
  [/\bbg-light-border\b/g, 'bg-surface-dim'],
  [/\bbg-dark-border\b/g, 'bg-surface-dim'],
  [/\baccent-brand-500\b/g, 'accent-primary'],
  [/\bborder-light-border\b/g, 'border-surface-dim'],
  [/\bborder-dark-border\b/g, 'border-surface-dim'],
  [/\bborder-light-active\b/g, 'border-on-surface'],
  [/\bborder-dark-active\b/g, 'border-on-surface'],
  [/\bdivide-light-border\b/g, 'divide-surface-dim'],
  [/\bdivide-dark-border\b/g, 'divide-surface-dim'],
  [/\bdark:(bg|text|border|hover:bg|hover:text|hover:border|placeholder|focus:bg|focus:text|focus:border|focus:ring|active:bg|active:text|group-hover:bg|group-hover:text|group-hover:border|disabled:bg|disabled:text|disabled:border)-[A-Za-z0-9_/[\]\.\-]+/g, ''],
  [/\b(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:ring)-brand-500\b/g, '$1-primary'],
  [/\b(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:ring)-brand-400\b/g, '$1-primary-fixed-dim'],
  [/\b(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:ring)-brand-300\b/g, '$1-primary-fixed-dim'],
  [/\b(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:ring)-brand-600\b/g, '$1-primary-dim'],
  [/\b(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:ring)-brand-700\b/g, '$1-primary-dim'],
  [/\b(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:ring)-brand-800\b/g, '$1-primary-dim'],
  [/\b(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:ring)-brand-200\b/g, '$1-primary-fixed'],
  [/\b(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:ring)-brand-100\b/g, '$1-primary-fixed'],
  [/\b(bg|text|border|ring|hover:bg|hover:text|hover:border|focus:ring)-brand-50\b/g, '$1-primary-fixed'],
  [/\brounded-\[(7|8|10|12|14|16|18|20|22|24|26|28|30|32)px\]/g, ''],
  [/\brounded-(2xl|3xl)\b/g, ''],
];

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (SKIP_PATHS.some((s) => p.includes(s))) continue;
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) yield p;
  }
}

let totalFiles = 0;
let totalChanges = 0;

for (const target of TARGETS) {
  for await (const file of walk(join(ROOT, target))) {
    let src;
    try { src = await readFile(file, 'utf8'); } catch { continue; }
    let out = src;
    let changedHere = 0;
    for (const [re, sub] of REPLACEMENTS) {
      const before = out;
      out = out.replace(re, sub);
      if (out !== before) changedHere += 1;
    }
    if (out !== src) {
      out = out.replace(/className="([^"]*)"/g, (m, c) => `className="${c.replace(/\s+/g, ' ').trim()}"`);
      await writeFile(file, out, 'utf8');
      totalFiles += 1;
      totalChanges += changedHere;
    }
  }
}

console.log(`Files modified: ${totalFiles}, replacement passes: ${totalChanges}`);

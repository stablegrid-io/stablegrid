// One-shot Playwright capture of /dev/fb-post at native 1200×630 FB feed.
// Writes the PNG to ~/Desktop/stablegrid-fb-post.png and exits.
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const URL = process.env.POST_URL ?? 'http://localhost:3000/dev/fb-post';
const OUT = resolve(homedir(), 'Desktop', 'stablegrid-fb-post.png');

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1320, height: 760 },
  deviceScaleFactor: 2
});
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: 'networkidle' });

// Hide cookie consent banner + preferences modal so they don't bleed in.
await page.addStyleTag({
  content: `.fixed.z-50, .fixed.z-\\[60\\], [role="dialog"] { display: none !important; }`
});

const canvas = page.locator('div[style*="1200px"][style*="630px"]').first();
await canvas.waitFor({ state: 'visible' });
await canvas.screenshot({ path: OUT, type: 'png' });

await browser.close();
console.log(`Saved: ${OUT}`);

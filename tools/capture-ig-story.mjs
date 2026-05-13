// One-shot Playwright capture of /dev/story at native 1080×1920 IG aspect.
// Writes the PNG to ~/Desktop/stablegrid-ig-story.png and exits.
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const URL = process.env.STORY_URL ?? 'http://localhost:3000/dev/story';
const OUT = resolve(homedir(), 'Desktop', 'stablegrid-ig-story.png');

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 2 // retina-quality PNG
});
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: 'networkidle' });

// Hide the cookie consent banner + preferences modal so they don't bleed
// into the screenshot. CookieConsentManager renders them as fixed-position
// nodes with z-50/z-[60]; the canvas itself is in normal flow so it stays.
await page.addStyleTag({
  content: `
    .fixed.z-50, .fixed.z-\\[60\\], [role="dialog"] { display: none !important; }
  `
});

// The 1080×1920 canvas is the first child of the centering wrapper.
const canvas = page.locator('div[style*="1080px"][style*="1920px"]').first();
await canvas.waitFor({ state: 'visible' });
await canvas.screenshot({ path: OUT, type: 'png' });

await browser.close();
console.log(`Saved: ${OUT}`);

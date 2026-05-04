#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdirSync, renameSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT_DIR = join(process.cwd(), 'recordings');
const TMP_DIR = join(OUTPUT_DIR, '_tmp');
const BASE_URL = process.env.RECORD_URL || 'http://localhost:3000';
const VIEWPORT = { width: 1440, height: 900 };

mkdirSync(TMP_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  recordVideo: { dir: TMP_DIR, size: VIEWPORT },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

console.log(`→ opening ${BASE_URL}`);
await page.goto(BASE_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const totalHeight = await page.evaluate(() => document.body.scrollHeight);
const viewportH = VIEWPORT.height;
const stepPx = 60;
const stepDelayMs = 35;

console.log(`→ scrolling through ${totalHeight}px`);
for (let y = 0; y < totalHeight - viewportH; y += stepPx) {
  await page.evaluate((py) => window.scrollTo(0, py), y);
  await page.waitForTimeout(stepDelayMs);
}
await page.evaluate((py) => window.scrollTo(0, py), totalHeight);
await page.waitForTimeout(1200);

console.log('→ scrolling back to top');
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
await page.waitForTimeout(2500);

await page.close();
await context.close();
await browser.close();

const files = readdirSync(TMP_DIR).filter((f) => f.endsWith('.webm'));
if (!files.length) {
  console.error('✗ no video produced');
  process.exit(1);
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const finalPath = join(OUTPUT_DIR, `landing-${stamp}.webm`);
renameSync(join(TMP_DIR, files[0]), finalPath);
rmSync(TMP_DIR, { recursive: true, force: true });

console.log(`✓ saved: ${finalPath}`);

#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Renders every beta-card slide to a PNG via headless Chromium.
 *
 * Usage:
 *   1. Make sure the dev server is running: `npm run dev`
 *   2. Run: `node tools/render-beta-cards.mjs`
 *
 * Output:
 *   ./beta-cards-out/{id}.png  (e.g. hero.png, 01.png, 02.png, ...)
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const SLIDES = [
  { id: 'hero', width: 1080, height: 1350 },
  { id: '01', width: 1080, height: 1080 },
  { id: '02', width: 1080, height: 1080 },
  { id: '03', width: 1080, height: 1080 },
  { id: '04', width: 1080, height: 1080 },
  { id: '05', width: 1080, height: 1080 },
  { id: '06', width: 1080, height: 1080 },
  { id: '07', width: 1080, height: 1080 },
];

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUTPUT_DIR = resolve(process.cwd(), 'beta-cards-out');

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1500 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  for (const { id, width, height } of SLIDES) {
    const url = `${BASE_URL}/beta-card/${id}`;
    console.log(`→ ${url}`);

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-slide-card]', { state: 'visible' });
    // give web fonts a moment to settle
    await page.evaluate(() => document.fonts.ready);

    const card = page.locator('[data-slide-card]').first();
    const box = await card.boundingBox();
    if (!box) {
      console.warn(`  ! could not measure card for ${id}, skipping`);
      continue;
    }

    const outPath = resolve(OUTPUT_DIR, `${id}.png`);
    await card.screenshot({ path: outPath, omitBackground: false });
    console.log(`  ✓ ${outPath}  (${width}×${height} @2x)`);
  }

  await browser.close();
  console.log(`\nDone. PNGs in ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

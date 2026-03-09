import { expect, test } from '@playwright/test';

const perfEnabled = process.env.PERF_ASSERT === '1';

test.describe('landing performance smoke', () => {
  test.use({ viewport: { width: 1512, height: 982 } });
  test.skip(!perfEnabled, 'Set PERF_ASSERT=1 to run performance assertions.');

  test('landing scroll stays responsive and signup CTA remains interactive', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Long-task API assertions are Chromium-only.');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#grid-flow')).toBeVisible();

    const metrics = await page.evaluate(async () => {
      const rafDeltas: number[] = [];
      const longTasks: number[] = [];
      let previousTimestamp = performance.now();

      let observer: PerformanceObserver | null = null;
      if (typeof PerformanceObserver !== 'undefined') {
        try {
          observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              longTasks.push(entry.duration);
            }
          });
          observer.observe({ type: 'longtask', buffered: true });
        } catch {
          observer = null;
        }
      }

      const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 0);
      const durationMs = 2200;

      await new Promise<void>((resolve) => {
        const start = performance.now();
        const tick = (timestamp: number) => {
          rafDeltas.push(timestamp - previousTimestamp);
          previousTimestamp = timestamp;

          const progress = Math.min((timestamp - start) / durationMs, 1);
          window.scrollTo(0, maxScroll * progress);

          if (progress < 1) {
            requestAnimationFrame(tick);
            return;
          }

          resolve();
        };

        requestAnimationFrame(tick);
      });

      await new Promise((resolve) => window.setTimeout(resolve, 180));
      observer?.disconnect();

      const stableFrameDeltas = rafDeltas.slice(5).filter((delta) => Number.isFinite(delta) && delta < 120);
      const sorted = [...stableFrameDeltas].sort((a, b) => a - b);
      const average =
        stableFrameDeltas.length > 0
          ? stableFrameDeltas.reduce((sum, delta) => sum + delta, 0) / stableFrameDeltas.length
          : 0;
      const p95 =
        sorted.length > 0 ? sorted[Math.floor(Math.min(sorted.length - 1, sorted.length * 0.95))] : 0;
      const maxLongTask = longTasks.length > 0 ? Math.max(...longTasks) : 0;

      return {
        frameSamples: stableFrameDeltas.length,
        rafAvgMs: Number(average.toFixed(2)),
        rafP95Ms: Number(p95.toFixed(2)),
        longTaskCount: longTasks.length,
        maxLongTaskMs: Number(maxLongTask.toFixed(2))
      };
    });

    expect(metrics.frameSamples).toBeGreaterThan(50);
    expect(metrics.rafP95Ms).toBeLessThan(40);
    expect(metrics.maxLongTaskMs).toBeLessThan(130);
    expect(metrics.longTaskCount).toBeLessThan(12);

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(220);

    const cta = page.locator('#grid-flow a[href="/signup"]').last();
    await expect(cta).toBeVisible();
    await cta.click();
    await page.waitForURL('**/signup');
  });
});

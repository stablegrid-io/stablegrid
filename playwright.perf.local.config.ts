import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  webServer: {
    command: 'npm run start -- -p 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 120_000
  }
});

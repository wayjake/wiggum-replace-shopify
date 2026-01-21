// 🎭 Playwright Configuration
// "Me fail English? That's unpossible!" - Ralph
//
// ╭────────────────────────────────────────────────────────────╮
// │  🧪 E2E Testing with Playwright                            │
// │  Tests run against a local dev server                      │
// │  80% coverage of user stories is the goal!                 │
// ╰────────────────────────────────────────────────────────────╯

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 📁 Test directory
  testDir: './e2e',

  // 🔄 Run tests serially to avoid rate limiting issues during auth tests
  fullyParallel: false,

  // 🚫 Fail build on test.only in CI
  forbidOnly: !!process.env.CI,

  // 🔁 Retry failed tests (twice locally, twice in CI)
  retries: process.env.CI ? 2 : 2,

  // 👷 Workers - use 1 worker to avoid rate limiting conflicts
  workers: 1,

  // ⏱️ Timeout for each test (60 seconds for SSR hydration delays)
  timeout: 60000,

  // 📊 Reporter
  reporter: 'html',

  // ⚙️ Shared settings for all projects
  use: {
    // 🌐 Base URL for the application
    baseURL: 'http://localhost:3000',

    // 📸 Collect trace when retrying failed test
    trace: 'on-first-retry',

    // 📷 Screenshot on failure
    screenshot: 'only-on-failure',
  },

  // 🎯 Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 🚀 Run dev server before starting tests
  webServer: {
    command: 'npm run dev:e2e', // Uses E2E_TEST=true to disable rate limiting
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // Reuse locally, fresh start in CI
    timeout: 120 * 1000,
  },
});

import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Playwright configuration for Andamio E2E testing
 *
 * Projects:
 * - chromium: Desktop Chrome browser
 * - mobile: Mobile viewport testing
 * - accessibility: Accessibility-focused testing with axe-core
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",

  /* Global test timeout - 60s to handle slow server responses */
  timeout: 60000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 10000,
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry flaky tests - 1 retry locally, 2 in CI */
  retries: process.env.CI ? 2 : 1,

  /* Limit parallel workers to prevent overwhelming the dev server */
  workers: process.env.CI ? 1 : 2,

  /* Stop after 3 failures locally for faster feedback */
  maxFailures: process.env.CI ? undefined : 3,

  /* Reporter configuration */
  reporter: [
    ["html", { outputFolder: "./reports/html" }],
    ["json", { outputFile: "./reports/results.json" }],
    ["list"],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL for navigation */
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",

    /* Action timeout for clicks, fills, etc. */
    actionTimeout: 15000,

    /* Navigation timeout */
    navigationTimeout: 30000,

    /* Collect trace on failure for debugging */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video recording on failure */
    video: "on-first-retry",
  },

  /* Configure projects for major browsers and viewports */
  projects: [
    /* Desktop Chromium */
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    /* Mobile Chrome (Pixel 5) - with longer timeouts for slower mobile rendering */
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
        /* Mobile needs longer timeouts due to slower rendering */
        navigationTimeout: 45000,
        actionTimeout: 20000,
      },
    },

    /* Accessibility testing project */
    {
      name: "accessibility",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /.*accessibility.*\.spec\.ts/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for Next.js to start
    // Pass the full environment to the dev server subprocess
    env: {
      ...process.env,
      // Ensure these are set even if not in parent env
      NEXT_PUBLIC_CARDANO_NETWORK: process.env.NEXT_PUBLIC_CARDANO_NETWORK ?? "preprod",
    },
  },
});

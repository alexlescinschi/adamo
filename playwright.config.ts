import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  workers: 1,
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100/robots.txt",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      DEPLOY_ENV: "staging",
      SITE_URL: "https://new.adamo.md",
      SYNC_999_SECRET: "test-sync-secret-123456",
    },
  },
});

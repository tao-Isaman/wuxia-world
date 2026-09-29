import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser", timeout: 90_000, workers: 1,
  expect: { timeout: 15_000 },
  use: { baseURL: "http://127.0.0.1:3017", headless: true, viewport: { width: 1440, height: 900 },
    trace: { mode: "retain-on-failure", screenshots: false, snapshots: true }, screenshot: "only-on-failure" },
  webServer: { command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3017",
    url: "http://127.0.0.1:3017", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});

import path from "node:path";
import { defineConfig } from "@playwright/test";
import { BASE_URL } from "./support/env";

const REPORT_DIR = path.resolve(__dirname, "..", "e2e-report");

// รัน: npm run test:e2e
// - ใช้ dev server ที่เปิดอยู่แล้ว (ถ้ายังไม่เปิดจะสั่ง npm run dev ให้)
// - รันทีละไฟล์ทีละเทสต์ (workers: 1) เพราะหลายเทสต์ใช้ DB/สต็อกชุดเดียวกัน
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  outputDir: path.join(REPORT_DIR, "artifacts"),
  reporter: [
    ["list"],
    ["html", { outputFolder: path.join(REPORT_DIR, "html"), open: "never" }],
    ["./summary-reporter.ts", { outputFile: path.join(REPORT_DIR, "summary.md") }],
  ],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
    locale: "th-TH",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    acceptDownloads: true,
  },
  webServer: {
    command: "npm run dev",
    url: `${BASE_URL}/login`,
    reuseExistingServer: true,
    timeout: 180_000,
    cwd: path.resolve(__dirname, ".."),
  },
});

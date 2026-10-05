import { test, expect, staff, registerCustomer, type Session } from "../support/fixtures";
import { request as pwRequest } from "@playwright/test";
import { BASE_URL, testName } from "../support/env";
import { SAMPLE_IMAGE, modal, openTab, settle } from "../support/ui";

// เอกสารจากรายงานอีเวนต์ (ใบเสนอราคา/ใบแจ้งหนี้/ใบสั่งงาน + PDF) และเอกสารแนบในแท็บเอกสาร
const EV = testName("งานเอกสาร");

test.beforeAll(async () => {
  // อีเวนต์ที่อนุมัติแล้ว (ไม่ผูกอุปกรณ์ → ไม่กระทบสต็อก) ปุ่มเอกสารจึงกดได้
  const acc = await registerCustomer(pwRequest, "docs");
  const c = await pwRequest.newContext({ baseURL: BASE_URL });
  await c.post("/api/auth/login", { data: { identifier: acc.identifier, password: acc.password } });
  const ev = await (await c.post("/api/events", { data: { title: EV, company: "บริษัท อี2อี จำกัด", place: "สถานที่ทดสอบ", startDate: "2026-12-01", endDate: "2026-12-02", organizer: "x", contactName: "x", contactPhone: "0811111111", budgetTHB: 50000 } })).json();
  await c.post("/api/auth/logout");
  const m = await pwRequest.newContext({ baseURL: BASE_URL });
  const mgr = staff("manager");
  await m.post("/api/auth/login", { data: { identifier: mgr.identifier, password: mgr.password } });
  expect((await m.patch(`/api/events/${ev.id}`, { data: { decision: "approved", startDate: "2026-12-01", endDate: "2026-12-02", equipment: [] } })).status()).toBe(200);
  await m.post("/api/auth/logout");
  await c.dispose(); await m.dispose();
});

async function checkEventDocuments(s: Session) {
  await openTab(s.page, "รายงาน", "อีเวนต์");
  const row = s.page.locator("div.divide-y > div").filter({ hasText: EV }).first();
  for (const doc of ["ใบเสนอราคา", "ใบแจ้งหนี้", "ใบสั่งงาน"]) {
    await row.locator("button:enabled", { hasText: new RegExp(`^\\s*${doc}\\s*$`) }).click();
    const m = s.page.locator("div.fixed").filter({ hasText: EV }).last();
    await expect(m).toBeVisible();
    if (doc === "ใบเสนอราคา") {
      const [dl] = await Promise.all([s.page.waitForEvent("download"), m.getByRole("button", { name: /ดาวน์โหลด PDF/ }).first().click()]);
      expect(dl.suggestedFilename()).toMatch(/^QUO-EVT\d+.*\.pdf$/);
      expect((await dl.path()) && (await import("node:fs")).statSync((await dl.path())!).size).toBeGreaterThan(1000);
    }
    await m.locator("button:has(svg.lucide-x)").first().click();
    await expect(s.page.locator("div.fixed").filter({ hasText: EV })).toHaveCount(0);
  }
}

test("ผู้จัดการออกใบเสนอราคา/ใบแจ้งหนี้/ใบสั่งงาน และดาวน์โหลด PDF ได้", { tag: "@manager" }, async ({ openAs }) => {
  await checkEventDocuments(await openAs(staff("manager", "username")));
});

test("เจ้าหน้าที่คลังเปิดเอกสารของอีเวนต์และดาวน์โหลด PDF ได้", { tag: "@stockkeeper" }, async ({ openAs }) => {
  await checkEventDocuments(await openAs(staff("stockkeeper")));
});

test("ผู้จัดการเพิ่มและลบเอกสารในแท็บเอกสารได้", { tag: "@manager" }, async ({ openAs }) => {
  const { page } = await openAs(staff("manager"));
  const title = testName("เอกสารแนบ");
  await openTab(page, "รายงาน", "เอกสาร");
  await page.getByRole("button", { name: /เพิ่มเอกสาร/ }).first().click();
  const m = modal(page, "เพิ่มเอกสาร");
  await m.getByPlaceholder("เช่น ใบแจ้งหนี้ - งานสัมมนา 2025").fill(title);
  await m.locator('input[type="file"]').setInputFiles(SAMPLE_IMAGE);
  await m.getByRole("button", { name: "บันทึกเอกสาร" }).click();
  await expect(page.getByText(title)).toBeVisible();
  await page.locator("tr", { hasText: title }).locator('button[title="ลบ"]').click();
  await page.locator("div.fixed", { hasText: "ยืนยันการลบ" }).last().locator("button").last().click();
  await expect(page.getByText(title)).toHaveCount(0);
});

test("เจ้าหน้าที่คลังดูเอกสารได้ แต่เพิ่ม/ลบไม่ได้", { tag: "@stockkeeper" }, async ({ openAs }) => {
  const { page } = await openAs(staff("stockkeeper"));
  await openTab(page, "รายงาน", "เอกสาร");
  await expect(page.getByRole("button", { name: /เพิ่มเอกสาร/ })).toHaveCount(0);
  await expect(page.locator('button[title="ลบ"]')).toHaveCount(0);
  await page.locator('button[title="ดู"]').first().click();
  await settle(page);
});

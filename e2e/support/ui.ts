import { expect, type Page } from "@playwright/test";
import path from "node:path";

// ตัวช่วยกดหน้าจอที่ใช้ซ้ำในหลายไฟล์ — selector อิงข้อความ/โครงสร้างที่ผู้ใช้เห็นจริง
export const SAMPLE_IMAGE = path.resolve(__dirname, "..", "fixtures", "sample-slip.png");

export const header = (p: Page) => p.locator("div.sticky.top-0").first();
export const content = (p: Page) => p.locator("div.sticky.top-0 ~ *");
export const modal = (p: Page, text: string) => p.locator("div.fixed", { hasText: text }).last();
export const eventCard = (p: Page, title: string) =>
  content(p).locator("div.rounded-2xl.p-5").filter({ has: p.locator("h2", { hasText: title }) }).first();
export const issueCard = (p: Page, title: string) =>
  p.locator("div.rounded-2xl", { has: p.locator("h2", { hasText: title }) }).last();

export async function settle(p: Page, ms = 500) {
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.waitForTimeout(ms);
}

export async function headerTabs(p: Page): Promise<string[]> {
  return (await header(p).locator("button").allInnerTexts())
    .map((t) => t.trim())
    .filter((t) => t && !/^\d+$/.test(t));
}

/** เปิดเมนูหลัก (และแท็บย่อยถ้าระบุ) */
export async function openTab(p: Page, name: string, sub?: string) {
  await header(p).getByRole("button", { name, exact: true }).first().click();
  await settle(p);
  if (sub) {
    await p.locator("div.rounded-2xl.p-2.shadow-sm button, div.mt-4.rounded-2xl.p-3.shadow-sm button", { hasText: sub }).first().click();
    await settle(p);
  }
}

export async function loginUI(p: Page, identifier: string, password: string) {
  await p.goto("/login");
  await p.fill("input[autocomplete=username]", identifier);
  await p.fill("input[type=password]", password);
  await p.click("button[type=submit]");
}

export async function logoutUI(p: Page) {
  await p.click('button[aria-label="ออกจากระบบ"]');
  await p.waitForURL("**/login");
}

/** fetch จากในหน้าเว็บ (ใช้ cookie ของผู้ใช้คนนั้น) */
export async function apiGet<T = unknown>(p: Page, url: string): Promise<{ status: number; body: T }> {
  return p.evaluate(async (u) => {
    const r = await fetch(u);
    return { status: r.status, body: await r.json().catch(() => null) };
  }, url);
}

export async function createEventUI(p: Page, title: string) {
  await openTab(p, "อีเวนต์");
  await p.getByRole("button", { name: /สร้างอีเวนต์ใหม่/ }).first().click();
  const field = (label: string) =>
    p.locator(`xpath=//div[contains(@class,'mb-1')][contains(normalize-space(.),'${label}')]/following-sibling::input[1]`).first();
  await field("ชื่ออีเวนต์").fill(title);
  await p.getByPlaceholder("เลือกหรือพิมพ์ชื่อบริษัท").fill("บริษัท อี2อี จำกัด");
  await p.getByPlaceholder("ชื่อ-นามสกุลลูกค้า").fill("ลูกค้า E2E");
  await p.getByPlaceholder("ชื่อผู้ประสานงาน").fill("ผู้ประสานงาน");
  await p.getByPlaceholder("กรอกเบอร์โทรผู้ติดต่อ").fill("0811111111");
  await p.getByPlaceholder("กรอกจำนวนงบประมาณ").fill("50000");
  await field("สถานที่จัดงาน").fill("สถานที่ทดสอบ");
  await field("วันเริ่มอีเวนต์").fill("2026-12-01");
  await field("วันจบอีเวนต์").fill("2026-12-02");
  await p.locator("button", { hasText: /^สร้างอีเวนต์$/ }).click();
  await expect(eventCard(p, title)).toBeVisible();
}

/** ผู้จัดการ: เปิดจัดการอุปกรณ์ → (อนุมัติพร้อมอุปกรณ์ | ไม่อนุมัติ) */
export async function decideEventUI(p: Page, title: string, decision: "approve" | "reject", equipment?: { name: string; qty: number }) {
  await openTab(p, "อีเวนต์");
  await eventCard(p, title).getByRole("button", { name: /จัดการอุปกรณ์/ }).click();
  if (equipment) {
    await p.getByRole("button", { name: /เพิ่มอุปกรณ์/ }).first().click();
    const sel = modal(p, "เลือกอุปกรณ์และระบุจำนวน");
    const search = sel.getByPlaceholder("พิมพ์ชื่ออุปกรณ์เพื่อค้นหา");
    await search.click();
    await search.fill(equipment.name);
    await sel.locator("button", { hasText: equipment.name }).first().click();
    await sel.getByPlaceholder("กรอกจำนวน").fill(String(equipment.qty));
    await sel.locator("button").last().click();
  }
  await p.getByRole("button", { name: "บันทึกและอนุมัติ" }).click();
  await expect(p.getByText("ยืนยันการบันทึกผล")).toBeVisible();
  await p.locator("button", { hasText: decision === "approve" ? "บันทึกและอนุมัติอีเวนต์" : "ลบอีเวนต์ออกจากระบบ" }).click();
  await settle(p, 1000);
}

/** เจ้าหน้าที่คลัง: กดเบิกจากการ์ดอีเวนต์แล้วยืนยัน */
export async function issueUI(p: Page, title: string) {
  await openTab(p, "เบิก/คืน");
  await issueCard(p, title).getByRole("button", { name: /เบิกอุปกรณ์/ }).click();
  await expect(p.getByText("ยืนยันการเบิกอุปกรณ์").first()).toBeVisible();
  await p.locator("button", { hasText: "ยืนยันการเบิก" }).last().click();
  await settle(p, 1000);
}

/** เจ้าหน้าที่คลัง: กดคืนจากการ์ดอีเวนต์ (ถ้า damaged ระบุ = ติ๊กเสียหาย + แนบรูป) แล้วยืนยัน */
export async function returnUI(p: Page, title: string, damaged?: { qty: number }) {
  await openTab(p, "เบิก/คืน", "คืนอุปกรณ์");
  await issueCard(p, title).getByRole("button", { name: /คืนอุปกรณ์/ }).click();
  const m = modal(p, "ยืนยันการคืนอุปกรณ์");
  await expect(m).toBeVisible();
  if (damaged) {
    await m.locator("label", { hasText: "เสียหาย" }).first().click();
    await m.locator('input[type="number"]').first().fill(String(damaged.qty));
    // input ไฟล์จริงอยู่นอก modal และผูกกับอุปกรณ์ที่กด "อัปโหลดรูป" — ต้องกดปุ่มแล้วตอบ file chooser
    const [chooser] = await Promise.all([p.waitForEvent("filechooser"), m.getByRole("button", { name: /อัปโหลดรูป/ }).first().click()]);
    await chooser.setFiles(SAMPLE_IMAGE);
  }
  await m.locator("button:enabled", { hasText: "ยืนยันการคืน" }).click();
  await settle(p, 1200);
}

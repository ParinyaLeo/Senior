import { test, expect, staff, openSession, registerCustomer, type Session } from "../support/fixtures";
import { testName } from "../support/env";
import {
  SAMPLE_IMAGE, apiGet, createEventUI, decideEventUI, eventCard, issueCard, issueUI, modal, openTab, returnUI, settle,
} from "../support/ui";

// วงจรอีเวนต์เต็มข้าม 3 role — ทุกขั้นใช้ session เดิม (serial) เหมือนผู้ใช้จริง 3 คนใช้งานพร้อมกัน
test.describe.configure({ mode: "serial" });

type Ev = { id: string; title: string; status: { text: string }; issueStatus: string; paymentReceipt?: { dataUrl: string } };
let customer: Session, manager: Session, keeper: Session;
const EV_MAIN = testName("งานหลัก");
const EV_REJECT = testName("งานไม่อนุมัติ");
const EV_DELETE = testName("งานลบเอง");
const ITEM = () => process.env.E2E_ITEM_NAME!;

const events = async (s: Session) => (await apiGet<Ev[]>(s.page, "/api/events")).body;
const find = async (s: Session, title: string) => (await events(s)).find((e) => e.title === title);
const itemAvailable = async () => (await apiGet<{ name: string; available: number }[]>(manager.page, "/api/stock")).body.find((r) => r.name === ITEM())!.available;
const notifications = async (s: Session) => (await apiGet<{ message: string }[]>(s.page, "/api/notifications")).body.map((n) => n.message);

test.beforeAll(async ({ browser, playwright }) => {
  customer = await openSession(browser, await registerCustomer(playwright.request, "lifecycle"));
  manager = await openSession(browser, staff("manager", "username"));
  keeper = await openSession(browser, staff("stockkeeper"));
});
test.afterAll(async () => {
  const unexpected = [customer, manager, keeper].flatMap((s) => s?.unexpected ?? []);
  for (const s of [customer, manager, keeper]) await s?.close();
  expect(unexpected, "ไม่ควรมี 401/403/5xx ระหว่างใช้งานตามสิทธิ์").toEqual([]);
});

test("ลูกค้าสร้างอีเวนต์ 3 รายการผ่านฟอร์ม และเห็นเฉพาะของตัวเอง", { tag: "@customer" }, async () => {
  for (const t of [EV_MAIN, EV_REJECT, EV_DELETE]) await createEventUI(customer.page, t);
  expect((await events(customer)).map((e) => e.title).sort()).toEqual([EV_MAIN, EV_REJECT, EV_DELETE].sort());
});

test("ผู้จัดการได้แจ้งเตือนอีเวนต์ใหม่รออนุมัติ", { tag: "@manager" }, async () => {
  expect(await notifications(manager)).toEqual(expect.arrayContaining([expect.stringContaining(EV_MAIN)]));
});

test("ลูกค้าลบอีเวนต์ตัวเองที่ยังรออนุมัติได้", { tag: "@customer" }, async () => {
  await openTab(customer.page, "อีเวนต์");
  await eventCard(customer.page, EV_DELETE).locator('button[title="ลบ"]').click();
  await modal(customer.page, "ยืนยันการลบอีเวนต์").locator("button").last().click();
  await expect(eventCard(customer.page, EV_DELETE)).toHaveCount(0);
  expect(await find(customer, EV_DELETE)).toBeUndefined();
});

test("ผู้จัดการไม่อนุมัติอีเวนต์ → ถูกลบ และลูกค้าได้แจ้งเตือน", { tag: "@manager" }, async () => {
  await manager.page.reload(); await settle(manager.page);
  await decideEventUI(manager.page, EV_REJECT, "reject");
  expect(await find(manager, EV_REJECT)).toBeUndefined();
  expect(await notifications(customer)).toEqual(expect.arrayContaining([expect.stringContaining(`${EV_REJECT} ไม่อนุมัติ`)]));
});

test("ผู้จัดการอนุมัติพร้อมจองอุปกรณ์ 2 ชิ้น → สต็อกถูกจอง", { tag: "@manager" }, async () => {
  const before = await itemAvailable();
  await decideEventUI(manager.page, EV_MAIN, "approve", { name: ITEM(), qty: 2 });
  expect((await find(manager, EV_MAIN))!.status.text).toBe("อนุมัติแล้ว");
  expect(await itemAvailable()).toBe(before - 2);
  expect(await notifications(customer)).toEqual(expect.arrayContaining([expect.stringContaining(`${EV_MAIN} อนุมัติรายการอุปกรณ์แล้ว`)]));
});

test("ลูกค้าเปิดกระดิ่ง → เห็นแจ้งเตือนและถูก mark ว่าอ่านแล้ว", { tag: "@customer" }, async () => {
  await customer.page.locator("div.sticky.top-0 button.relative.grid").first().click();
  await expect(customer.page.getByText("การแจ้งเตือน")).toBeVisible();
  await settle(customer.page);
  await customer.page.keyboard.press("Escape");
  expect((await apiGet<unknown[]>(customer.page, "/api/notifications?unread=true")).body).toHaveLength(0);
});

test("เจ้าหน้าที่คลังเบิกอุปกรณ์จากการ์ด → กำลังใช้งาน", { tag: "@stockkeeper" }, async () => {
  await keeper.page.reload(); await settle(keeper.page);
  await issueUI(keeper.page, EV_MAIN);
  expect((await find(keeper, EV_MAIN))!.issueStatus).toBe("inuse");
});

test("ผู้จัดการเห็นอีเวนต์ในแท็บกำลังใช้งาน แต่ไม่มีปุ่มเบิก/คืน", { tag: "@manager" }, async () => {
  await manager.page.reload(); await settle(manager.page);
  await openTab(manager.page, "เบิก/คืน", "กำลังใช้งาน");
  await expect(issueCard(manager.page, EV_MAIN)).toBeVisible();
  await openTab(manager.page, "เบิก/คืน", "คืนอุปกรณ์");
  await expect(issueCard(manager.page, EV_MAIN).getByRole("button", { name: /คืนอุปกรณ์/ })).toHaveCount(0);
});

test("เจ้าหน้าที่คลังคืนอุปกรณ์ → สต็อกกลับครบ และลูกค้าได้แจ้งเตือนให้ชำระเงิน", { tag: "@stockkeeper" }, async () => {
  const before = await itemAvailable();
  await returnUI(keeper.page, EV_MAIN);
  expect((await find(keeper, EV_MAIN))!.status.text).toBe("รอชำระเงิน");
  expect(await itemAvailable()).toBe(before + 2);
  expect(await notifications(customer)).toEqual(expect.arrayContaining([expect.stringContaining(`${EV_MAIN} คืนอุปกรณ์ครบแล้ว`)]));
});

test("ลูกค้าแนบสลิปการชำระเงิน → รอตรวจสอบ และเปิดไฟล์สลิปของตัวเองได้", { tag: "@customer" }, async () => {
  await customer.page.reload(); await settle(customer.page);
  await openTab(customer.page, "อีเวนต์");
  await eventCard(customer.page, EV_MAIN).locator('input[type="file"]').setInputFiles(SAMPLE_IMAGE);
  const m = modal(customer.page, "ยืนยันการแนบสลิป");
  await m.getByRole("button", { name: "ยืนยัน", exact: true }).click();
  await settle(customer.page, 1000);
  const ev = (await find(customer, EV_MAIN))!;
  expect(ev.status.text).toBe("รอตรวจสอบการชำระเงิน");
  expect(ev.paymentReceipt?.dataUrl).toMatch(/^\/uploads\/receipts\/EVT\d+-\d+\.png$/);
  expect((await customer.context.request.get(ev.paymentReceipt!.dataUrl)).status()).toBe(200);
});

test("ผู้จัดการได้แจ้งเตือน เปิดดูสลิปได้ และยืนยันการชำระเงิน → เสร็จสิ้น", { tag: "@manager" }, async () => {
  expect(await notifications(manager)).toEqual(expect.arrayContaining([expect.stringContaining(`${EV_MAIN} รอผู้จัดการตรวจสอบ`)]));
  await manager.page.reload(); await settle(manager.page);
  await openTab(manager.page, "อีเวนต์");
  const href = await eventCard(manager.page, EV_MAIN).locator("a", { hasText: "เปิดดูสลิป" }).getAttribute("href");
  expect((await manager.context.request.get(href!)).status()).toBe(200);
  await eventCard(manager.page, EV_MAIN).getByRole("button", { name: /ยืนยันการชำระเงิน/ }).click();
  await modal(manager.page, "กรุณาตรวจสอบสลิปก่อนอนุมัติ").getByRole("button", { name: "ยืนยัน", exact: true }).click();
  await settle(manager.page, 1000);
  expect((await find(manager, EV_MAIN))!.status.text).toBe("เสร็จสิ้น");
  expect(await notifications(customer)).toEqual(expect.arrayContaining([expect.stringContaining(`${EV_MAIN} ชำระเงินเรียบร้อย`)]));
});

test("ทุก role เปิดดูรายละเอียดอีเวนต์และมุมมองปฏิทินได้", { tag: "@all-roles" }, async () => {
  for (const s of [customer, manager, keeper]) {
    await s.page.reload(); await settle(s.page);
    await openTab(s.page, "อีเวนต์");
    await s.page.locator('button[title="ดูรายละเอียด"]').first().click();
    await expect(s.page.getByText("รายละเอียดอีเวนต์").first()).toBeVisible();
    await s.page.keyboard.press("Escape");
    await s.page.locator("div.mt-4.rounded-2xl.p-3.shadow-sm button", { hasText: "ปฏิทิน" }).click();
    await expect(s.page.getByText(/^(อา|จ)$/).first()).toBeVisible();
  }
});

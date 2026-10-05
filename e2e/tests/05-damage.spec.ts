import { test, expect, staff, openSession, registerCustomer, type Session } from "../support/fixtures";
import { testName } from "../support/env";
import { apiGet, decideEventUI, issueUI, modal, openTab, returnUI, settle } from "../support/ui";

// คืนอุปกรณ์แบบเสียหาย + รูปหลักฐาน → รายงานความเสียหาย → ใบแจ้งหนี้ → จำหน่าย (ใช้อุปกรณ์ทดสอบเท่านั้น)
test.describe.configure({ mode: "serial" });

type Dmg = { id: string; itemName: string; eventId: string; qty: number; status: string; photoPaths: string[] };
type Row = { name: string; qty: number; available: number; repairing: number };
let customer: Session, manager: Session, keeper: Session;
const EV = testName("งานเสียหาย");
const ITEM = () => process.env.E2E_ITEM_NAME!;
const damageRow = async (s: Session) => (await apiGet<Dmg[]>(s.page, "/api/damage-items")).body.find((d) => d.itemName === ITEM());
const item = async () => (await apiGet<Row[]>(manager.page, "/api/stock")).body.find((r) => r.name === ITEM())!;

test.beforeAll(async ({ browser, playwright }) => {
  customer = await openSession(browser, await registerCustomer(playwright.request, "damage"));
  manager = await openSession(browser, staff("manager"));
  keeper = await openSession(browser, staff("stockkeeper", "username"));
  const res = await customer.context.request.post("/api/events", {
    data: { title: EV, company: "บริษัท อี2อี จำกัด", place: "สถานที่ทดสอบ", startDate: "2026-12-01", endDate: "2026-12-02", organizer: "x", contactName: "x", contactPhone: "0811111111", budgetTHB: 1000 },
  });
  expect(res.status()).toBe(200);
});
test.afterAll(async () => {
  const unexpected = [customer, manager, keeper].flatMap((s) => s?.unexpected ?? []);
  for (const s of [customer, manager, keeper]) await s?.close();
  expect(unexpected, "ไม่ควรมี 401/403/5xx ระหว่างใช้งานตามสิทธิ์").toEqual([]);
});

let qtyBefore = 0;
test("ผู้จัดการอนุมัติ (อุปกรณ์ทดสอบ 2 ชิ้น) และเจ้าหน้าที่คลังเบิก", { tag: "@manager" }, async () => {
  await manager.page.reload(); await settle(manager.page);
  await decideEventUI(manager.page, EV, "approve", { name: ITEM(), qty: 2 });
  await keeper.page.reload(); await settle(keeper.page);
  await issueUI(keeper.page, EV);
  qtyBefore = (await item()).qty;
});

test("เจ้าหน้าที่คลังคืนแบบเสียหาย 1 ชิ้นพร้อมรูปหลักฐาน → บันทึกความเสียหาย", { tag: "@stockkeeper" }, async () => {
  const saved = keeper.page.waitForResponse((r) => r.url().endsWith("/api/damage-items") && r.request().method() === "POST");
  await returnUI(keeper.page, EV, { qty: 1 });
  expect((await saved).status()).toBe(200);
  const d = (await damageRow(keeper))!;
  expect(d.qty).toBe(1);
  expect(d.status).toBe("reported");
  expect(d.photoPaths).toHaveLength(1);
  expect((await keeper.context.request.get(d.photoPaths[0])).status()).toBe(200);
  const it = await item();
  expect(it.qty).toBe(qtyBefore - 1); // ชิ้นที่เสียถูกย้ายออกจากจำนวนใช้งาน
  expect(it.repairing).toBe(1);
});

test("รายงานความเสียหาย (ผู้จัดการ) แสดงรายการใหม่และรูปหลักฐานโหลดได้", { tag: "@manager" }, async () => {
  await manager.page.reload(); await settle(manager.page);
  await openTab(manager.page, "รายงาน", "ความเสียหาย");
  await manager.page.locator("tr", { hasText: ITEM() }).first().locator('button[title="ดูรายละเอียดเพิ่มเติม"]').click();
  const img = manager.page.locator("div.fixed img").first();
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
  await manager.page.keyboard.press("Escape");
});

test("ผู้จัดการออกใบแจ้งหนี้ค่าความเสียหาย และเปิดแก้ไขมูลค่าได้", { tag: "@manager" }, async () => {
  await manager.page.locator("tr", { hasText: ITEM() }).first().getByRole("button", { name: /ออกใบแจ้งหนี้/ }).click();
  const inv = modal(manager.page, "ใบแจ้งหนี้ค่าความเสียหาย");
  await expect(inv).toContainText(ITEM());
  await manager.page.locator('button[title="แก้ไขมูลค่าความเสียหาย"]').first().click();
  await expect(manager.page.getByText("แก้ไขมูลค่าความเสียหาย").first()).toBeVisible();
  await manager.page.getByRole("button", { name: "ยกเลิก", exact: true }).last().click();
  await inv.locator("button:has(svg.lucide-x)").first().click(); // modal นี้ไม่ปิดด้วย Escape
});

test("เจ้าหน้าที่คลังเห็นรายงานความเสียหาย แต่ไม่มีปุ่มออกใบแจ้งหนี้", { tag: "@stockkeeper" }, async () => {
  await keeper.page.reload(); await settle(keeper.page);
  await openTab(keeper.page, "รายงาน", "ความเสียหาย");
  await expect(keeper.page.locator("tr", { hasText: ITEM() }).first()).toBeVisible();
  await expect(keeper.page.getByRole("button", { name: /ออกใบแจ้งหนี้/ })).toHaveCount(0);
});

test("ลูกค้าเปิดรูปความเสียหายไม่ได้ (404)", { tag: "@customer" }, async () => {
  const d = (await damageRow(manager))!;
  expect((await customer.context.request.get(d.photoPaths[0])).status()).toBe(404);
});

test("ผู้จัดการจำหน่ายล็อตที่เสียหาย → ปิดล็อต และ repairing กลับเป็น 0", { tag: "@manager" }, async () => {
  await manager.page.reload(); await settle(manager.page);
  await openTab(manager.page, "สต็อก");
  await manager.page.getByRole("button", { name: /จำหน่ายสต็อก/ }).first().click();
  // modal จัดกลุ่มตามอุปกรณ์ ต้องกดชื่ออุปกรณ์ก่อน ล็อตถึงจะกางออก
  await manager.page.locator("div.fixed").getByText(ITEM(), { exact: true }).first().click();
  const lot = manager.page.locator("div.fixed div.rounded-2xl", { hasText: EV }).filter({ has: manager.page.locator("textarea") }).last();
  await lot.getByPlaceholder("เช่น LT-1234-03, LT-1234-04 หรือแยกบรรทัด").fill("E2E-DISPOSE-01");
  const done = manager.page.waitForResponse((r) => r.url().endsWith("/api/stock/repairs") && r.request().method() === "POST");
  await lot.getByRole("button", { name: /จำหน่าย/ }).last().click();
  expect((await done).status()).toBe(200);
  await expect.poll(async () => (await damageRow(manager))!.status).toBe("disposed");
  const it = await item();
  expect(it.repairing).toBe(0);
  expect(it.qty).toBe(qtyBefore - 1);
});

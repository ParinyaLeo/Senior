import { test, expect, staff, type Session } from "../support/fixtures";
import { testName } from "../support/env";
import { apiGet, modal, openTab, settle } from "../support/ui";

type Row = { id: string; name: string; brand: string; qty: number; available: number };
const stockRow = async (s: Session, name: string) => (await apiGet<Row[]>(s.page, "/api/stock")).body.find((r) => r.name === name);

async function addItemUI(s: Session, name: string) {
  await openTab(s.page, "สต็อก");
  await s.page.getByRole("button", { name: /เพิ่มใหม่/ }).first().click();
  const m = modal(s.page, "เพิ่มอุปกรณ์ใหม่");
  await m.getByPlaceholder("ชื่ออุปกรณ์").fill(name);
  await m.getByPlaceholder("ยี่ห้อ").fill("E2E");
  await m.getByPlaceholder("ระบุจำนวน").fill("5");
  await m.getByPlaceholder("ระบุค่าบริการต่อวัน").fill("100");
  await m.getByPlaceholder("ระบุราคาต้นทุน").fill("1000");
  await m.locator("button").last().click();
  await settle(s.page, 1000);
}
const rowMenu = (s: Session, name: string) => s.page.locator("tr", { hasText: name }).first().locator('button[title="ตัวเลือกเพิ่มเติม"]');

test("ผู้จัดการเห็นสต็อกทั้งหมด เพิ่ม → แก้ไข → รับเข้า → ลบอุปกรณ์ได้", { tag: "@manager" }, async ({ openAs }) => {
  const m = await openAs(staff("manager"));
  const name = testName("สต็อกผู้จัดการ");
  const all = (await apiGet<Row[]>(m.page, "/api/stock")).body;
  expect(all.length).toBeGreaterThan(0);

  await addItemUI(m, name);
  expect((await stockRow(m, name))?.qty).toBe(5);

  await rowMenu(m, name).click();
  await m.page.locator("button", { hasText: "แก้ไข" }).last().click();
  const edit = modal(m.page, "แก้ไขอุปกรณ์");
  await edit.getByPlaceholder("ยี่ห้อ").fill("E2E-EDITED");
  await edit.locator("button").last().click();
  await settle(m.page, 1000);
  expect((await stockRow(m, name))?.brand).toBe("E2E-EDITED");

  await m.page.getByRole("button", { name: /รับเข้าสต็อก/ }).first().click();
  const rcv = modal(m.page, "เพิ่มจำนวนสต็อกให้อุปกรณ์ที่มีอยู่แล้ว");
  await rcv.getByPlaceholder("พิมพ์ชื่ออุปกรณ์หรือรหัส SKU").fill(name);
  await rcv.locator("button", { hasText: name }).first().click();
  await rcv.getByPlaceholder("ระบุราคาซื้อต่อหน่วย").fill("1000");
  await rcv.getByRole("button", { name: /บันทึกรับเข้า/ }).click();
  await settle(m.page, 1500);
  expect((await stockRow(m, name))!.qty).toBeGreaterThan(5);

  // อุปกรณ์ที่มีประวัติรับเข้าลบไม่ได้ (กติกาเดิม) — ลบตัวใหม่ที่ยังไม่มีประวัติ
  const temp = testName("สต็อกลบได้");
  await m.page.reload(); await settle(m.page);
  await addItemUI(m, temp);
  await rowMenu(m, temp).click();
  await m.page.locator("button.text-red-600", { hasText: /^\s*ลบ\s*$/ }).last().click();
  await modal(m.page, "ยืนยันการลบอุปกรณ์").locator("button").last().click();
  await settle(m.page, 1000);
  expect(await stockRow(m, temp)).toBeUndefined();
});

test("เจ้าหน้าที่คลังเพิ่ม แก้ไข และดูประวัติรับเข้าได้", { tag: "@stockkeeper" }, async ({ openAs }) => {
  const k = await openAs(staff("stockkeeper", "username"));
  const name = testName("สต็อกคลัง");
  await addItemUI(k, name);
  expect((await stockRow(k, name))?.qty).toBe(5);
  await rowMenu(k, name).click();
  await k.page.locator("button", { hasText: "แก้ไข" }).last().click();
  await modal(k.page, "แก้ไขอุปกรณ์").getByPlaceholder("ยี่ห้อ").fill("E2E-KEEPER");
  await modal(k.page, "แก้ไขอุปกรณ์").locator("button").last().click();
  await settle(k.page, 1000);
  expect((await stockRow(k, name))?.brand).toBe("E2E-KEEPER");
  // modal รายละเอียดโหลดประวัติรับเข้า/ซ่อม — ต้องได้ 200 (คลังมีสิทธิ์)
  const loaded = Promise.all(
    ["/api/stock/receive", "/api/stock/repairs"].map((p) => k.page.waitForResponse((r) => new URL(r.url()).pathname === p))
  );
  await k.page.locator("tr", { hasText: name }).first().locator('button[title="ดู"]').click();
  await expect(k.page.getByText("รายละเอียดอุปกรณ์")).toBeVisible();
  expect((await loaded).map((r) => r.status())).toEqual([200, 200]);
});

test("2 คนเพิ่มอุปกรณ์รหัสเดียวกันพร้อมกัน → สำเร็จ 1 คน อีกคนได้ 409 ไม่ทับกัน", { tag: "@all-roles" }, async ({ openAs }) => {
  const m = await openAs(staff("manager"));
  const k = await openAs(staff("stockkeeper"));
  const stock = (await apiGet<Row[]>(m.page, "/api/stock")).body;
  const max = Math.max(...stock.map((s) => Number(s.id.replace("-", "").match(/^EQ(\d+)$/)?.[1] ?? 0)));
  const id = `EQ-${String(max + 1).padStart(3, "0")}`;
  const row = (who: string) => ({ id, code: `E2E-${who}`, name: testName(`รหัสชน ${who}`), brand: "E2E", category: "ไฟฟ้า", system: "ระบบแสง", zone: "โซน A", warehouseAddress: "", status: "พร้อมใช้", qty: 1, available: 1, pricePerDay: 1, cost: 1, repairing: 0 });
  const [rm, rk] = await Promise.all([
    m.context.request.put("/api/stock", { data: { items: [row("M")], createdIds: [id], deletedIds: [] } }),
    k.context.request.put("/api/stock", { data: { items: [row("K")], createdIds: [id], deletedIds: [] } }),
  ]);
  expect([rm.status(), rk.status()].sort()).toEqual([200, 409]);
  const winner = rm.status() === 200 ? "M" : "K";
  const rows = (await apiGet<{ id: string; code: string }[]>(m.page, "/api/stock")).body.filter((r) => r.id === id);
  expect(rows.map((r) => r.code)).toEqual([`E2E-${winner}`]);
});

test("ทั้งสอง role เปิดหน้าจำหน่ายสต็อกได้", { tag: "@all-roles" }, async ({ openAs }) => {
  for (const acc of [staff("manager"), staff("stockkeeper")]) {
    const s = await openAs(acc);
    await openTab(s.page, "สต็อก");
    await s.page.getByRole("button", { name: /จำหน่ายสต็อก/ }).first().click();
    await expect(modal(s.page, "จัดการอุปกรณ์ที่อยู่ระหว่างซ่อมแซม")).toBeVisible();
  }
});

import { request as pwRequest, type APIRequestContext } from "@playwright/test";
import { test, expect, staff, registerCustomer, type Account } from "../support/fixtures";
import { BASE_URL } from "../support/env";
import { headerTabs, openTab } from "../support/ui";

// ── เมนู/ปุ่มบนหน้าจอตาม role ──
test.describe("เมนูและปุ่มตามสิทธิ์", () => {
  test("ลูกค้าเห็นเฉพาะเมนูอีเวนต์ + ปุ่มสร้างอีเวนต์", { tag: "@customer" }, async ({ openAs, newCustomer }) => {
    const { page } = await openAs(await newCustomer("menu"));
    expect(await headerTabs(page)).toEqual(expect.arrayContaining(["อีเวนต์"]));
    expect(await headerTabs(page)).not.toContain("สต็อก");
    await expect(page.getByRole("button", { name: /สร้างอีเวนต์ใหม่/ })).toBeVisible();
    await expect(page.getByText("สลับบทบาท")).toHaveCount(0);
  });

  test("ผู้จัดการเห็น 5 เมนู ไม่มีปุ่มสร้างอีเวนต์ ไม่มีปุ่มเบิก/คืนด่วน และลบอุปกรณ์ได้", { tag: "@manager" }, async ({ openAs }) => {
    const { page } = await openAs(staff("manager"));
    expect(await headerTabs(page)).toEqual(expect.arrayContaining(["อีเวนต์", "สต็อก", "เบิก/คืน", "รายงาน", "ตั้งค่า"]));
    await expect(page.getByRole("button", { name: /สร้างอีเวนต์ใหม่/ })).toHaveCount(0);
    await openTab(page, "เบิก/คืน");
    await expect(page.locator("button.text-white", { hasText: "เบิกอุปกรณ์" })).toHaveCount(0);
    await openTab(page, "สต็อก");
    await page.locator('button[title="ตัวเลือกเพิ่มเติม"]').first().click();
    await expect(page.locator("button.text-red-600", { hasText: /^\s*ลบ\s*$/ })).toHaveCount(1);
  });

  test("เจ้าหน้าที่คลังไม่มีเมนูตั้งค่า/แท็บการเงิน มีปุ่มเบิก/คืนด่วน และลบอุปกรณ์ไม่ได้", { tag: "@stockkeeper" }, async ({ openAs }) => {
    const { page } = await openAs(staff("stockkeeper"));
    expect(await headerTabs(page)).not.toContain("ตั้งค่า");
    await openTab(page, "รายงาน");
    await expect(page.locator("div.rounded-2xl.p-2.shadow-sm button", { hasText: "การเงิน" })).toHaveCount(0);
    await openTab(page, "เบิก/คืน");
    await expect(page.locator("button.text-white", { hasText: "เบิกอุปกรณ์" })).toHaveCount(1);
    await openTab(page, "สต็อก");
    await page.locator('button[title="ตัวเลือกเพิ่มเติม"]').first().click();
    await expect(page.locator("button", { hasText: "แก้ไข" }).last()).toBeVisible();
    await expect(page.locator("button.text-red-600", { hasText: /^\s*ลบ\s*$/ })).toHaveCount(0);
  });
});

// ── API: ทุก endpoint × ทุก role (role ที่มีสิทธิ์ใช้ payload ผิด/id ที่ไม่มี → 400/404 = ผ่าน guard แต่ไม่เขียนข้อมูล) ──
type Role = "guest" | "customer" | "manager" | "stockkeeper";
const S: Role[] = ["manager", "stockkeeper"];
const ALL: Role[] = ["customer", "manager", "stockkeeper"];
const NOID = "/api/events/NO-SUCH-EVENT";
const multipart = { multipart: { bogus: "1" } };
const CASES: [string, "GET" | "POST" | "PUT" | "PATCH" | "DELETE", string, Record<string, unknown> | undefined, Role[], boolean?][] = [
  ["GET events", "GET", "/api/events", undefined, ALL],
  ["POST events (สร้าง)", "POST", "/api/events", {}, ["customer"]],
  ["DELETE events/[id]", "DELETE", NOID, undefined, ["customer"]],
  ["PATCH events: แนบสลิป", "PATCH", NOID, undefined, ["customer"], true],
  ["PATCH events: ใบสั่งงาน", "PATCH", NOID, { workOrderSalesTargets: "bad" }, S],
  ["PATCH events: เบิก/คืนด่วน", "PATCH", NOID, { quickEquipmentAction: "bad" }, ["stockkeeper"]],
  ["PATCH events: ยืนยันชำระเงิน", "PATCH", NOID, { paymentAction: "bad" }, ["manager"]],
  ["PATCH events: เบิก/คืนจากการ์ด", "PATCH", NOID, { issueStatus: "bad" }, ["stockkeeper"]],
  ["PATCH events: อนุมัติ/ไม่อนุมัติ", "PATCH", NOID, {}, ["manager"]],
  ["GET events/[id]/history", "GET", `${NOID}/history`, undefined, ["manager"]],
  ["POST events/[id]/history", "POST", `${NOID}/history`, {}, ["manager"]],
  ["GET stock", "GET", "/api/stock", undefined, ALL],
  ["PUT stock (เพิ่ม/แก้)", "PUT", "/api/stock", { items: [{}] }, S],
  ["PATCH stock (จอง/คืน)", "PATCH", "/api/stock", { action: "bad" }, ["manager"]],
  ["GET stock/history", "GET", "/api/stock/history?limit=1", undefined, S],
  ["GET stock/receive", "GET", "/api/stock/receive", undefined, S],
  ["POST stock/receive", "POST", "/api/stock/receive", {}, S],
  ["GET stock/repairs", "GET", "/api/stock/repairs", undefined, S],
  ["POST stock/repairs (จำหน่าย)", "POST", "/api/stock/repairs", {}, S],
  ["GET stock/repairs/lots", "GET", "/api/stock/repairs/lots", undefined, S],
  ["GET damage-items", "GET", "/api/damage-items", undefined, S],
  ["POST damage-items", "POST", "/api/damage-items", undefined, ["stockkeeper"], true],
  ["PATCH damage-items/[id]", "PATCH", "/api/damage-items/NO-SUCH", {}, ["manager"]],
  ["GET settings", "GET", "/api/settings", undefined, S],
  ["PUT settings", "PUT", "/api/settings", {}, ["manager"]],
  ["GET notifications", "GET", "/api/notifications", undefined, ALL],
  ["POST notifications", "POST", "/api/notifications", {}, ALL],
  ["DELETE notifications?id=", "DELETE", "/api/notifications?id=NO-SUCH", undefined, ALL],
  ["PATCH notifications/mark-read", "PATCH", "/api/notifications/mark-read", { ids: ["NO-SUCH"] }, ALL],
];

test.describe("สิทธิ์ API ทุก endpoint", () => {
  const ctx: Partial<Record<Role, APIRequestContext>> = {};
  test.beforeAll(async () => {
    const login = async (acc: Account) => {
      const c = await pwRequest.newContext({ baseURL: BASE_URL });
      expect((await c.post("/api/auth/login", { data: { identifier: acc.identifier, password: acc.password } })).status()).toBe(200);
      return c;
    };
    ctx.guest = await pwRequest.newContext({ baseURL: BASE_URL });
    ctx.customer = await login(await registerCustomer(pwRequest, "acl"));
    ctx.manager = await login(staff("manager"));
    ctx.stockkeeper = await login(staff("stockkeeper", "username"));
  });
  test.afterAll(async () => {
    for (const c of Object.values(ctx)) { await c?.post("/api/auth/logout").catch(() => {}); await c?.dispose(); }
  });

  const tags: Record<Role, string> = { guest: "@guest", customer: "@customer", manager: "@manager", stockkeeper: "@stockkeeper" };
  for (const role of ["guest", "customer", "manager", "stockkeeper"] as Role[]) {
    test(`${role}: ได้ 401/403 ในที่ที่ไม่มีสิทธิ์ และผ่าน guard ในที่ที่มีสิทธิ์ (${CASES.length} endpoint)`, { tag: tags[role] }, async () => {
      const wrong: string[] = [];
      for (const [label, method, url, body, allowed, isForm] of CASES) {
        const opts = isForm ? multipart : body !== undefined ? { data: body } : {};
        const res = await ctx[role]!.fetch(url, { method, ...opts });
        const st = res.status();
        const expectBlocked = role === "guest" ? 401 : allowed.includes(role) ? null : 403;
        const good = expectBlocked ? st === expectBlocked : st !== 401 && st !== 403 && st < 500;
        if (!good) wrong.push(`${label}: ได้ ${st} (ควรเป็น ${expectBlocked ?? "ผ่าน guard"})`);
      }
      expect(wrong).toEqual([]);
    });
  }

  test("ปลอม role จาก client ไม่ได้ (?role=, body.role, formData role)", { tag: "@customer" }, async () => {
    const own = await (await ctx.customer!.get("/api/notifications")).json();
    const forged = await (await ctx.customer!.get("/api/notifications?role=Manager")).json();
    expect(forged).toEqual(own);
    expect((await ctx.customer!.patch(NOID, { data: { paymentAction: "confirmPayment", role: "Manager" } })).status()).toBe(403);
    expect((await ctx.customer!.post("/api/notifications", { data: { title: "x", message: "x", audience: ["SA"], role: "Manager" } })).status()).toBe(403);
    expect((await ctx.stockkeeper!.patch(NOID, { data: { decision: "approved", startDate: "2026-12-01", endDate: "2026-12-02", equipment: [], role: "Manager" } })).status()).toBe(403);
  });

  test("เจ้าหน้าที่คลังลบอุปกรณ์ผ่าน API ไม่ได้ และส่งรายการว่างก็ไม่ลบอะไร", { tag: "@stockkeeper" }, async () => {
    const before = await (await ctx.manager!.get("/api/stock")).json();
    expect((await ctx.stockkeeper!.put("/api/stock", { data: { items: [], deletedIds: [before[0].id] } })).status()).toBe(403);
    expect((await ctx.stockkeeper!.put("/api/stock", { data: { items: [] } })).status()).toBe(200);
    expect(await (await ctx.manager!.get("/api/stock")).json()).toEqual(before);
  });
});

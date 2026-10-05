import { test, expect, staff } from "../support/fixtures";
import { CUSTOMER_PASSWORD, STAFF, customerEmail } from "../support/env";
import { header, headerTabs, loginUI, logoutUI, settle } from "../support/ui";

const BAD_CREDENTIALS = "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง";

test.describe("ไม่ login", () => {
  test("เปิดหน้าแอปโดยไม่ login → redirect ไป /login", { tag: "@guest" }, async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("เรียก API โดยไม่ login → 401", { tag: "@guest" }, async ({ request }) => {
    for (const p of ["/api/events", "/api/stock", "/api/notifications", "/api/auth/me"]) {
      expect((await request.get(p)).status(), p).toBe(401);
    }
  });

  test("login รหัสผิด → แสดง error และอยู่หน้าเดิม", { tag: "@guest" }, async ({ page }) => {
    await loginUI(page, STAFF.manager.email, "wrong-password");
    await expect(page.locator("form p[role=alert]")).toHaveText(BAD_CREDENTIALS);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login บัญชีที่ไม่มีอยู่ → error ข้อความเดียวกับรหัสผิด", { tag: "@guest" }, async ({ page }) => {
    await loginUI(page, "nobody-here", "whatever123");
    await expect(page.locator("form p[role=alert]")).toHaveText(BAD_CREDENTIALS);
  });
});

test.describe("ลูกค้า", () => {
  test("สมัครสมาชิกผ่านหน้า /register → เข้าแอปทันที", { tag: "@customer" }, async ({ page }) => {
    const email = customerEmail("register");
    await page.goto("/register");
    await page.locator("form input").nth(0).fill("ลูกค้า E2E สมัครใหม่");
    await page.fill("input[type=email]", email);
    await page.locator("input[type=password]").nth(0).fill(CUSTOMER_PASSWORD);
    await page.locator("input[type=password]").nth(1).fill(CUSTOMER_PASSWORD);
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/\/$/);
    await expect(header(page)).toContainText("ลูกค้า E2E สมัครใหม่");
    await logoutUI(page);
  });

  test("สมัครด้วยอีเมลที่มีอยู่แล้ว (ต่างตัวพิมพ์) → error", { tag: "@customer" }, async ({ page, newCustomer }) => {
    const acc = await newCustomer("dup");
    await page.goto("/register");
    await page.locator("form input").nth(0).fill("ซ้ำ");
    await page.fill("input[type=email]", acc.identifier.toUpperCase());
    await page.locator("input[type=password]").nth(0).fill(CUSTOMER_PASSWORD);
    await page.locator("input[type=password]").nth(1).fill(CUSTOMER_PASSWORD);
    await page.click("button[type=submit]");
    await expect(page.getByText("อีเมลนี้ถูกใช้สมัครแล้ว")).toBeVisible();
  });

  test("login ด้วยอีเมล → logout → กลับมาเข้าหน้าแอปไม่ได้", { tag: "@customer" }, async ({ page, newCustomer }) => {
    const acc = await newCustomer("login");
    await loginUI(page, acc.identifier, acc.password);
    await expect(page).toHaveURL(/\/$/);
    await logoutUI(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("กรอกรหัสผิด 5 ครั้ง → บัญชีถูกล็อกชั่วคราว แม้รหัสถูก", { tag: "@customer" }, async ({ page, request, newCustomer }) => {
    const acc = await newCustomer("lock");
    for (let i = 0; i < 5; i++) {
      expect((await request.post("/api/auth/login", { data: { identifier: acc.identifier, password: "wrong-password" } })).status()).toBe(401);
    }
    await loginUI(page, acc.identifier, acc.password);
    await expect(page.locator("form p[role=alert]")).toContainText("เข้าสู่ระบบผิดหลายครั้งเกินไป");
    await expect(page).toHaveURL(/\/login$/);
  });
});

for (const key of ["manager", "stockkeeper"] as const) {
  const tag = key === "manager" ? "@manager" : "@stockkeeper";
  const expectedTab = key === "manager" ? "ตั้งค่า" : "เบิก/คืน";
  test.describe(STAFF[key].label, () => {
    for (const by of ["email", "username"] as const) {
      test(`login ด้วย${by === "email" ? "อีเมล" : "ชื่อผู้ใช้"} → เข้าแอปตาม role → logout`, { tag }, async ({ page }) => {
        const acc = staff(key, by);
        await loginUI(page, by === "username" ? acc.identifier.toUpperCase() : acc.identifier, acc.password);
        await expect(page).toHaveURL(/\/$/);
        expect(await headerTabs(page)).toContain(expectedTab);
        await expect(header(page)).toContainText(STAFF[key].label);
        await logoutUI(page);
      });
    }
  });
}

test("เลือกบทบาทไม่ตรงกับบัญชี → เตือน แล้วเข้าตาม role จริงของบัญชี", { tag: "@stockkeeper" }, async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: /ลูกค้า/ }).click();
  await page.fill("input[autocomplete=username]", STAFF.stockkeeper.username);
  await page.fill("input[type=password]", STAFF.stockkeeper.password);
  await page.click("button[type=submit]");
  await expect(page.locator("form [role=status]")).toContainText("บัญชีนี้ไม่ใช่บทบาทที่เลือกไว้");
  await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
  await settle(page);
  expect(await headerTabs(page)).toContain("เบิก/คืน");
  await logoutUI(page);
});

import { test as base, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { BASE_URL, CUSTOMER_PASSWORD, STAFF, customerEmail, type StaffKey } from "./env";

export type Account = { identifier: string; password: string; label: string };

export function staff(key: StaffKey, by: "email" | "username" = "email"): Account {
  const s = STAFF[key];
  return { identifier: by === "email" ? s.email : s.username, password: s.password, label: s.label };
}

export type Session = {
  page: Page;
  context: BrowserContext;
  account: Account;
  /** response 401/403/5xx ที่เกิดระหว่างใช้งาน UI (ตามสิทธิ์ปกติไม่ควรมี) */
  unexpected: string[];
  close: () => Promise<void>;
};

// การทดสอบที่ตั้งใจยิงสิ่งที่ต้องได้ 401/403/404 ให้ใช้ session.context.request (ไม่ผ่าน event ของหน้าเว็บ จึงไม่ถูกนับ)
function watchUnexpected(context: BrowserContext, bucket: string[]) {
  context.on("response", (r) => {
    const u = new URL(r.url());
    if (!u.pathname.startsWith("/api/") && !u.pathname.startsWith("/uploads/")) return;
    if (u.pathname === "/api/auth/login" || u.pathname === "/api/auth/register") return; // รหัสผิด/สมัครซ้ำ ทดสอบโดยตั้งใจ
    if (r.status() === 401 || r.status() === 403 || r.status() >= 500) {
      bucket.push(`${r.status()} ${r.request().method()} ${u.pathname}`);
    }
  });
}

/** เปิด browser context ใหม่ที่ login แล้ว (login ผ่าน API ใน context เดียวกัน → cookie ใช้ร่วมกับหน้าเว็บ) */
export async function openSession(browser: Browser, account: Account): Promise<Session> {
  const context = await browser.newContext({ baseURL: BASE_URL, acceptDownloads: true, viewport: { width: 1440, height: 900 } });
  const unexpected: string[] = [];
  watchUnexpected(context, unexpected);
  const inFlight = new Set<unknown>();
  context.on("request", (r) => inFlight.add(r));
  context.on("requestfinished", (r) => inFlight.delete(r));
  context.on("requestfailed", (r) => inFlight.delete(r));
  const res = await context.request.post("/api/auth/login", {
    data: { identifier: account.identifier, password: account.password },
  });
  expect(res.status(), `login ${account.identifier}`).toBe(200);
  const page = await context.newPage();
  page.on("dialog", (d) => d.dismiss());
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  return {
    page,
    context,
    account,
    unexpected,
    close: async () => {
      // รอ request ที่หน้าเว็บยิงค้างอยู่ (เช่น modal ที่เพิ่งเปิดโหลดข้อมูล) ให้เสร็จก่อน logout
      // ไม่งั้น request เหล่านั้นจะไปถึง server หลัง session ถูกลบ แล้วได้ 401 ปลอม
      // (waitForLoadState("networkidle") ใช้ไม่ได้ เพราะคืนค่าทันทีถ้าหน้าเคย idle มาแล้ว)
      const deadline = Date.now() + 10_000;
      while (inFlight.size > 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
      await context.request.post("/api/auth/logout").catch(() => {});
      await context.close();
    },
  };
}

export async function registerCustomer(baseRequest: { newContext: (o: { baseURL: string }) => Promise<import("@playwright/test").APIRequestContext> }, tag: string): Promise<Account> {
  const email = customerEmail(tag);
  const api = await baseRequest.newContext({ baseURL: BASE_URL });
  const res = await api.post("/api/auth/register", {
    data: { email, password: CUSTOMER_PASSWORD, displayName: `ลูกค้า E2E ${tag}`, company: "บริษัท อี2อี จำกัด" },
  });
  expect(res.status(), `register ${email}`).toBe(201);
  await api.post("/api/auth/logout");
  await api.dispose();
  return { identifier: email, password: CUSTOMER_PASSWORD, label: `ลูกค้า ${tag}` };
}

export const test = base.extend<{
  /** session ที่ login แล้ว — ปิดและเช็ค response ผิดปกติให้อัตโนมัติตอนจบเทสต์ */
  openAs: (account: Account) => Promise<Session>;
  /** สมัครบัญชีลูกค้าใหม่ผ่าน API (อีเมลขึ้นต้น e2e- ถูกลบตอน teardown) */
  newCustomer: (tag: string) => Promise<Account>;
}>({
  openAs: async ({ browser }, provide) => {
    const sessions: Session[] = [];
    await provide(async (account) => {
      const s = await openSession(browser, account);
      sessions.push(s);
      return s;
    });
    for (const s of sessions) await s.close();
    expect(sessions.flatMap((s) => s.unexpected), "ไม่ควรมี 401/403/5xx ระหว่างใช้งานตามสิทธิ์").toEqual([]);
  },
  newCustomer: async ({ playwright }, provide) => {
    await provide((tag) => registerCustomer(playwright.request, tag));
  },
});

export { expect };

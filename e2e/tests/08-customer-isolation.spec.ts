import { request as pwRequest, type APIRequestContext } from "@playwright/test";
import { test, expect, staff, registerCustomer, type Account } from "../support/fixtures";
import { BASE_URL, testName } from "../support/env";

// ลูกค้าเห็น/แตะได้เฉพาะข้อมูลของตัวเอง + การใช้งานพร้อมกันหลายคน
const login = async (acc: Account) => {
  const c = await pwRequest.newContext({ baseURL: BASE_URL });
  expect((await c.post("/api/auth/login", { data: { identifier: acc.identifier, password: acc.password } })).status()).toBe(200);
  return c;
};
const newEvent = (title: string) => ({ title, company: "x", place: "x", startDate: "2026-12-01", endDate: "2026-12-02", organizer: "x", contactName: "x", contactPhone: "0811111111", budgetTHB: 1 });

let a: APIRequestContext, b: APIRequestContext, manager: APIRequestContext;
let aEvent = "";
test.beforeAll(async () => {
  a = await login(await registerCustomer(pwRequest, "iso-a"));
  b = await login(await registerCustomer(pwRequest, "iso-b"));
  manager = await login(staff("manager"));
  aEvent = (await (await a.post("/api/events", { data: newEvent(testName("งานของ A")) })).json()).id;
  // ผู้จัดการส่งแจ้งเตือนถึงเจ้าของอีเวนต์ของ A
  expect((await manager.post("/api/notifications", { data: { title: "E2E", message: testName("ถึง A"), audience: ["SA"], eventId: aEvent } })).status()).toBe(200);
});
test.afterAll(async () => {
  for (const c of [a, b, manager]) { await c?.post("/api/auth/logout").catch(() => {}); await c?.dispose(); }
});

test("ลูกค้าใหม่ไม่เห็นอีเวนต์เก่าและอีเวนต์ของคนอื่น", { tag: "@customer" }, async () => {
  expect(await (await b.get("/api/events")).json()).toEqual([]);
  const own = await (await a.get("/api/events")).json();
  expect(own.map((e: { id: string }) => e.id)).toEqual([aEvent]);
});

test("แจ้งเตือนถึงลูกค้าไปถึงเจ้าของคนเดียว", { tag: "@customer" }, async () => {
  const msgs = async (c: APIRequestContext) => (await (await c.get("/api/notifications")).json()).map((n: { message: string }) => n.message);
  expect(await msgs(a)).toContain(testName("ถึง A"));
  expect(await msgs(b)).not.toContain(testName("ถึง A"));
});

test("ลูกค้าแนบสลิป/ลบอีเวนต์ของคนอื่นไม่ได้ (404)", { tag: "@customer" }, async () => {
  expect((await b.patch(`/api/events/${aEvent}`, { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("x") } } })).status()).toBe(404);
  expect((await b.delete(`/api/events/${aEvent}`)).status()).toBe(404);
  expect((await (await a.get("/api/events")).json()).length).toBe(1);
});

test("ลูกค้าส่งแจ้งเตือนหาลูกค้าคนอื่นไม่ได้ (403)", { tag: "@customer" }, async () => {
  expect((await b.post("/api/notifications", { data: { title: "spam", message: "spam", audience: ["SA"], eventId: aEvent } })).status()).toBe(403);
});

test("ลูกค้า 8 คนสร้างอีเวนต์พร้อมกัน → เลขไม่ซ้ำ และแต่ละคนเห็นแค่ของตัวเอง", { tag: "@customer" }, async () => {
  const users = await Promise.all(Array.from({ length: 8 }, async (_, i) => login(await registerCustomer(pwRequest, `conc-${i}`))));
  const ids: string[] = await Promise.all(users.map(async (c, i) => (await (await c.post("/api/events", { data: newEvent(testName(`พร้อมกัน ${i}`)) })).json()).id));
  expect(new Set(ids).size).toBe(8);
  const seen = await Promise.all(users.map(async (c) => (await (await c.get("/api/events")).json()).map((e: { id: string }) => e.id)));
  seen.forEach((list, i) => expect(list).toEqual([ids[i]]));
  for (const c of users) { await c.post("/api/auth/logout"); await c.dispose(); }
});

test("พนักงาน 30 session login และเรียก API พร้อมกัน → ไม่มี 5xx/deadlock", { tag: "@all-roles" }, async () => {
  const accounts = [staff("manager"), staff("manager", "username"), staff("stockkeeper"), staff("stockkeeper", "username")];
  const sessions = await Promise.all(Array.from({ length: 30 }, (_, i) => login(accounts[i % 4])));
  const statuses = await Promise.all(
    sessions.flatMap((c) => ["/api/events", "/api/stock", "/api/notifications", "/api/auth/me"].map(async (p) => (await c.get(p)).status()))
  );
  expect(statuses.filter((s) => s !== 200)).toEqual([]);
  for (const c of sessions) { await c.post("/api/auth/logout"); await c.dispose(); }
});

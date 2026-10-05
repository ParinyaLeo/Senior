import fs from "node:fs";
import { request as pwRequest, type APIRequestContext } from "@playwright/test";
import { test, expect, staff, registerCustomer, type Account } from "../support/fixtures";
import { BASE_URL, testName } from "../support/env";
import { SAMPLE_IMAGE } from "../support/ui";

// ไฟล์แนบเสิร์ฟผ่าน /uploads/<kind>/<name> ที่เช็ค session + สิทธิ์ (ไฟล์ไม่ได้อยู่ใน public/ แล้ว)
let owner: APIRequestContext, other: APIRequestContext, manager: APIRequestContext, keeper: APIRequestContext, guest: APIRequestContext;
let slipUrl = "";
const login = async (acc: Account) => {
  const c = await pwRequest.newContext({ baseURL: BASE_URL });
  expect((await c.post("/api/auth/login", { data: { identifier: acc.identifier, password: acc.password } })).status()).toBe(200);
  return c;
};

test.beforeAll(async () => {
  owner = await login(await registerCustomer(pwRequest, "file-owner"));
  other = await login(await registerCustomer(pwRequest, "file-other"));
  manager = await login(staff("manager"));
  keeper = await login(staff("stockkeeper"));
  guest = await pwRequest.newContext({ baseURL: BASE_URL });
  const ev = await (await owner.post("/api/events", { data: { title: testName("งานไฟล์"), company: "x", place: "x", startDate: "2026-12-01", endDate: "2026-12-02", organizer: "x", contactName: "x", contactPhone: "0811111111", budgetTHB: 1 } })).json();
  // ตั้งชื่อไฟล์เป็น .html แต่ type เป็น image/png — ระบบต้องตั้งนามสกุลจาก MIME ไม่ใช่จากชื่อ
  const up = await owner.patch(`/api/events/${ev.id}`, {
    multipart: { file: { name: "evil.html", mimeType: "image/png", buffer: fs.readFileSync(SAMPLE_IMAGE) } },
  });
  expect(up.status()).toBe(200);
  slipUrl = (await up.json()).paymentReceipt.dataUrl;
});
test.afterAll(async () => {
  for (const c of [owner, other, manager, keeper]) await c?.post("/api/auth/logout").catch(() => {});
  for (const c of [owner, other, manager, keeper, guest]) await c?.dispose();
});

test("นามสกุลไฟล์ที่เก็บมาจาก MIME (.png) ไม่ใช่จากชื่อไฟล์ที่ส่งมา (evil.html)", { tag: "@customer" }, async () => {
  expect(slipUrl).toMatch(/^\/uploads\/receipts\/EVT\d+-\d+\.png$/);
});

test("ไม่ login เปิดสลิป/รูปความเสียหายไม่ได้ (401)", { tag: "@guest" }, async () => {
  expect((await guest.get(slipUrl)).status()).toBe(401);
  expect((await guest.get("/uploads/damage/EVT000-0-1.png")).status()).toBe(401);
});

test("เจ้าของสลิปเปิดไฟล์ได้ เนื้อไฟล์ตรง และ header ปลอดภัย", { tag: "@customer" }, async () => {
  const r = await owner.get(slipUrl);
  expect(r.status()).toBe(200);
  expect(Buffer.compare(await r.body(), fs.readFileSync(SAMPLE_IMAGE))).toBe(0);
  expect(r.headers()["content-type"]).toBe("image/png");
  expect(r.headers()["x-content-type-options"]).toBe("nosniff");
  expect(r.headers()["cache-control"]).toBe("private, no-store");
});

test("ลูกค้าคนอื่นเปิดสลิปของคนอื่นไม่ได้ (404 ไม่บอกว่ามีไฟล์)", { tag: "@customer" }, async () => {
  expect((await other.get(slipUrl)).status()).toBe(404);
});

test("ผู้จัดการและเจ้าหน้าที่คลังเปิดสลิปได้", { tag: "@all-roles" }, async () => {
  expect((await manager.get(slipUrl)).status()).toBe(200);
  expect((await keeper.get(slipUrl)).status()).toBe(200);
});

test("กัน path traversal และ kind ที่ไม่รู้จัก", { tag: "@manager" }, async () => {
  for (const u of ["/uploads/receipts/..%2F..%2F.env", "/uploads/receipts/%2E%2E%2Fdamage%2Fx.png", "/uploads/other/x.png", "/uploads/receipts/.env", "/uploads/receipts/nope.png"]) {
    expect((await manager.get(u)).status(), u).toBe(404);
  }
});

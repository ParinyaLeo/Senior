import { request } from "@playwright/test";
import { BASE_URL, STAFF, testName } from "./support/env";
import { cleanupTestData, resetStaffAccounts, staffAccountsExist } from "./support/db";

// ก่อนรันทั้งชุด: ตรวจความพร้อม → ล้างข้อมูลทดสอบที่ค้างจากรอบก่อน → สร้างอุปกรณ์ทดสอบที่ใช้ร่วมกัน
// (ชุดทดสอบไม่ใช้อุปกรณ์จริงในคลัง จึงไม่กระทบตัวเลขสต็อกจริง)
export default async function globalSetup() {
  process.env.E2E_RUN = Date.now().toString().slice(-6);

  const emails = Object.values(STAFF).map((s) => s.email);
  const missing = await staffAccountsExist(emails);
  if (missing.length) throw new Error(`ไม่พบบัญชีพนักงาน ${missing.join(", ")} — รัน npm run seed:users ก่อน`);

  const leftover = await cleanupTestData();
  if (Object.values(leftover).some((n) => n > 0)) console.log("[e2e] ล้างข้อมูลทดสอบที่ค้างจากรอบก่อน:", leftover);
  await resetStaffAccounts(emails);

  const api = await request.newContext({ baseURL: BASE_URL });
  const login = await api.post("/api/auth/login", { data: { identifier: STAFF.manager.email, password: STAFF.manager.password } });
  if (login.status() !== 200) throw new Error(`login ผู้จัดการไม่ผ่าน (${login.status()}) — ตรวจ SEED_MANAGER_PASSWORD ใน .env`);

  // อุปกรณ์ทดสอบ 20 ชิ้น สำหรับวงจรอีเวนต์/เบิก/คืน/ความเสียหาย
  const stock: Array<{ id: string }> = await (await api.get("/api/stock")).json();
  const max = Math.max(0, ...stock.map((s) => Number(s.id.replace("-", "").match(/^EQ(\d+)$/)?.[1] ?? 0)));
  const id = `EQ-${String(max + 1).padStart(3, "0")}`;
  const name = testName("อุปกรณ์ทดสอบ");
  const put = await api.put("/api/stock", {
    data: {
      items: [{ id, code: `E2E-${process.env.E2E_RUN}`, name, brand: "E2E", category: "ไฟฟ้า", system: "ระบบแสง", zone: "โซน A", warehouseAddress: "", status: "พร้อมใช้", qty: 20, available: 20, pricePerDay: 100, cost: 1000, repairing: 0 }],
      createdIds: [id],
      deletedIds: [],
    },
  });
  if (put.status() !== 200) throw new Error(`สร้างอุปกรณ์ทดสอบไม่สำเร็จ (${put.status()}) ${await put.text()}`);
  process.env.E2E_ITEM_ID = id;
  process.env.E2E_ITEM_NAME = name;

  await api.post("/api/auth/logout");
  await api.dispose();
}

import { STAFF } from "./support/env";
import { cleanupTestData, resetStaffAccounts } from "./support/db";

// หลังรันทั้งชุด: ลบข้อมูลทดสอบทั้งหมด (ตั้ง E2E_KEEP_DATA=1 ถ้าต้องการเก็บไว้ดูหลังรัน)
export default async function globalTeardown() {
  if (process.env.E2E_KEEP_DATA === "1") {
    console.log("[e2e] E2E_KEEP_DATA=1 — ไม่ลบข้อมูลทดสอบ");
    return;
  }
  const removed = await cleanupTestData();
  await resetStaffAccounts(Object.values(STAFF).map((s) => s.email));
  console.log("[e2e] ลบข้อมูลทดสอบแล้ว:", removed);
}

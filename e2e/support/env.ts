import fs from "node:fs";
import path from "node:path";

// โหลด .env ของโปรเจกต์ (DATABASE_URL, SEED_*_PASSWORD) — ไม่ hardcode รหัสผ่านในชุดทดสอบ
const envFile = path.resolve(__dirname, "..", "..", ".env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

export const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `ต้องตั้ง ${name} ใน .env ก่อนรัน e2e (เป็นรหัสผ่านเดียวกับที่ใช้ npm run seed:users)`
    );
  }
  return v;
}

export type StaffKey = "manager" | "stockkeeper";

export const STAFF: Record<StaffKey, { email: string; username: string; password: string; label: string }> = {
  manager: {
    email: process.env.SEED_MANAGER_EMAIL || "manager@example.com",
    username: process.env.SEED_MANAGER_USERNAME || "manager",
    password: required("SEED_MANAGER_PASSWORD"),
    label: "ผู้จัดการ",
  },
  stockkeeper: {
    email: process.env.SEED_STOCKKEEPER_EMAIL || "stockkeeper@example.com",
    username: process.env.SEED_STOCKKEEPER_USERNAME || "stockkeeper",
    password: required("SEED_STOCKKEEPER_PASSWORD"),
    label: "เจ้าหน้าที่คลัง",
  },
};

// ข้อมูลที่ชุดทดสอบสร้างขึ้นทั้งหมดใช้ prefix นี้ — global setup/teardown ลบทิ้งตาม prefix
export const TEST_PREFIX = "[E2E]";
export const TEST_EMAIL_PREFIX = "e2e-";
export const CUSTOMER_PASSWORD = "Passw0rd!e2e";

// เลขรอบการรัน (ตั้งใน global setup แล้วส่งต่อให้ worker ผ่าน env)
export const RUN = () => process.env.E2E_RUN || "local";
export const customerEmail = (tag: string) => `${TEST_EMAIL_PREFIX}${tag}-${RUN()}@example.com`;
export const testName = (tag: string) => `${TEST_PREFIX} ${tag} ${RUN()}`;

// สร้างบัญชีพนักงานชุดแรก: ผู้จัดการ 1 + เจ้าหน้าที่คลัง 1
// รัน: npm run seed:users
//
// - รันซ้ำได้: ถ้าอีเมลนั้นมีบัญชีอยู่แล้วจะข้าม (ไม่เขียนทับรหัสผ่าน)
// - ไม่ hardcode รหัสผ่าน: อ่านจาก env ถ้าไม่ได้ตั้งจะสุ่มให้และพิมพ์ออกจอครั้งเดียว
//     SEED_MANAGER_EMAIL / SEED_MANAGER_PASSWORD
//     SEED_STOCKKEEPER_EMAIL / SEED_STOCKKEEPER_PASSWORD
// - ใช้ hash และ schema ชุดเดียวกับแอป (lib/password.ts, lib/authSchema.ts) ผ่าน --experimental-strip-types
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { hashPassword } from "../lib/password.ts";
import { ensureAuthTables } from "../lib/authSchema.ts";

const accounts = [
  {
    role: "Manager",
    displayName: "ผู้จัดการ (บัญชีทดสอบ)",
    email: process.env.SEED_MANAGER_EMAIL || "manager@example.com",
    password: process.env.SEED_MANAGER_PASSWORD,
  },
  {
    role: "Stockkeeper",
    displayName: "เจ้าหน้าที่คลัง (บัญชีทดสอบ)",
    email: process.env.SEED_STOCKKEEPER_EMAIL || "stockkeeper@example.com",
    password: process.env.SEED_STOCKKEEPER_PASSWORD,
  },
];

// ตั้งค่า SSL แบบเดียวกับ lib/db.ts
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
  ssl:
    process.env.PGSSLMODE === "disable"
      ? false
      : process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
});

await client.connect();
try {
  await ensureAuthTables(client);

  for (const acc of accounts) {
    const email = acc.email.trim().toLowerCase();
    const generated = !acc.password;
    const password = acc.password || randomBytes(12).toString("base64url");
    if (password.length < 8) {
      throw new Error(`รหัสผ่านของ ${email} ต้องยาวอย่างน้อย 8 ตัวอักษร`);
    }

    const res = await client.query(
      `INSERT INTO users (id, email, password_hash, role, display_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ((LOWER(email))) DO NOTHING
       RETURNING id`,
      [randomUUID(), email, await hashPassword(password), acc.role, acc.displayName]
    );

    if (res.rowCount === 0) {
      console.log(`- ข้าม  ${acc.role.padEnd(11)} ${email} (มีบัญชีอยู่แล้ว)`);
    } else if (generated) {
      console.log(`+ สร้าง ${acc.role.padEnd(11)} ${email}  รหัสผ่าน: ${password}  ← จดไว้ จะไม่แสดงอีก`);
    } else {
      console.log(`+ สร้าง ${acc.role.padEnd(11)} ${email}  (รหัสผ่านจาก env)`);
    }
  }
} finally {
  await client.end();
}

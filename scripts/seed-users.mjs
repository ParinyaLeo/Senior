// สร้างบัญชีพนักงานชุดแรก: ผู้จัดการ 1 + เจ้าหน้าที่คลัง 1
// รัน: npm run seed:users
//
// - รันซ้ำได้: ถ้าอีเมลนั้นมีบัญชีอยู่แล้วจะข้าม (ไม่เขียนทับรหัสผ่าน)
// - ไม่ hardcode รหัสผ่าน: อ่านจาก env ถ้าไม่ได้ตั้งจะสุ่มให้และพิมพ์ออกจอครั้งเดียว
//     SEED_MANAGER_EMAIL / SEED_MANAGER_PASSWORD
//     SEED_STOCKKEEPER_EMAIL / SEED_STOCKKEEPER_PASSWORD
// - ชื่อผู้ใช้สำหรับ login แทนอีเมล: SEED_MANAGER_USERNAME / SEED_STOCKKEEPER_USERNAME (ค่าเริ่มต้น manager / stockkeeper)
//   บัญชีที่มีอยู่แล้วแต่ยังไม่มีชื่อผู้ใช้จะถูกเติมให้ (ไม่เขียนทับชื่อผู้ใช้ที่ตั้งไว้แล้ว)
// - ใช้ hash และ schema ชุดเดียวกับแอป (lib/password.ts, lib/authSchema.ts) ผ่าน --experimental-strip-types
//
// เปลี่ยนรหัสผ่านบัญชีที่มีอยู่แล้ว: npm run seed:users -- --reset-password
// - เปลี่ยนเฉพาะบัญชีที่ตั้ง SEED_*_PASSWORD ไว้ใน env (ไม่สุ่มรหัสให้ในโหมดนี้)
// - ปลดล็อกบัญชี และลบ session เดิมของบัญชีนั้นทั้งหมด (ต้อง login ใหม่ด้วยรหัสใหม่)
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { hashPassword } from "../lib/password.ts";
import { ensureAuthTables, USERNAME_PATTERN } from "../lib/authSchema.ts";

const resetPassword = process.argv.includes("--reset-password");

const accounts = [
  {
    role: "Manager",
    displayName: "ผู้จัดการ (บัญชีทดสอบ)",
    email: process.env.SEED_MANAGER_EMAIL || "manager@example.com",
    username: process.env.SEED_MANAGER_USERNAME || "manager",
    password: process.env.SEED_MANAGER_PASSWORD,
  },
  {
    role: "Stockkeeper",
    displayName: "เจ้าหน้าที่คลัง (บัญชีทดสอบ)",
    email: process.env.SEED_STOCKKEEPER_EMAIL || "stockkeeper@example.com",
    username: process.env.SEED_STOCKKEEPER_USERNAME || "stockkeeper",
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
    const username = acc.username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(username)) {
      throw new Error(`ชื่อผู้ใช้ "${username}" ไม่ถูกต้อง (3-32 ตัว ใช้ได้ a-z 0-9 . _ - และห้ามมี @)`);
    }

    if (resetPassword) {
      if (!acc.password) {
        console.log(`- ข้าม  ${acc.role.padEnd(11)} ${email} (ไม่ได้ตั้งรหัสผ่านใน env)`);
        continue;
      }
      if (acc.password.length < 8) {
        throw new Error(`รหัสผ่านของ ${email} ต้องยาวอย่างน้อย 8 ตัวอักษร`);
      }
      await client.query("BEGIN");
      const upd = await client.query(
        `UPDATE users
         SET password_hash = $3, failed_login_count = 0, locked_until = NULL
         WHERE LOWER(email) = $1 AND role = $2
         RETURNING id`,
        [email, acc.role, await hashPassword(acc.password)]
      );
      if (upd.rowCount === 0) {
        await client.query("ROLLBACK");
        console.log(`! ไม่พบ  ${acc.role.padEnd(11)} ${email} (รันโดยไม่ใส่ --reset-password เพื่อสร้างบัญชีก่อน)`);
        continue;
      }
      const del = await client.query(`DELETE FROM sessions WHERE user_id = $1`, [upd.rows[0].id]);
      await client.query("COMMIT");
      console.log(`* เปลี่ยนรหัส ${acc.role.padEnd(11)} ${email}  (รหัสผ่านจาก env, ลบ session เดิม ${del.rowCount} รายการ)`);
      continue;
    }

    const generated = !acc.password;
    const password = acc.password || randomBytes(12).toString("base64url");
    if (password.length < 8) {
      throw new Error(`รหัสผ่านของ ${email} ต้องยาวอย่างน้อย 8 ตัวอักษร`);
    }

    const res = await client.query(
      `INSERT INTO users (id, email, username, password_hash, role, display_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ((LOWER(email))) DO NOTHING
       RETURNING id`,
      [randomUUID(), email, username, await hashPassword(password), acc.role, acc.displayName]
    );

    if (res.rowCount === 0) {
      // บัญชีมีอยู่แล้ว: เติมชื่อผู้ใช้ให้ถ้ายังไม่มี
      const filled = await client.query(
        `UPDATE users SET username = $2 WHERE LOWER(email) = $1 AND username IS NULL RETURNING id`,
        [email, username]
      );
      console.log(`- ข้าม  ${acc.role.padEnd(11)} ${email} (มีบัญชีอยู่แล้ว${filled.rowCount ? `, ตั้งชื่อผู้ใช้ "${username}"` : ""})`);
    } else if (generated) {
      console.log(`+ สร้าง ${acc.role.padEnd(11)} ${email} (ชื่อผู้ใช้ ${username})  รหัสผ่าน: ${password}  ← จดไว้ จะไม่แสดงอีก`);
    } else {
      console.log(`+ สร้าง ${acc.role.padEnd(11)} ${email} (ชื่อผู้ใช้ ${username})  (รหัสผ่านจาก env)`);
    }
  }
} finally {
  await client.end();
}

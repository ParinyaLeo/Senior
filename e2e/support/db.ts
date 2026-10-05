import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import "./env";

// ใช้เฉพาะ setup/teardown: ลบข้อมูลที่ชุดทดสอบสร้าง (ขึ้นต้น [E2E] / บัญชี e2e-*) และปลดล็อกบัญชีพนักงาน
// ห้ามแตะข้อมูลจริง: ทุก DELETE มีเงื่อนไข prefix เสมอ
const ROOT = path.resolve(__dirname, "..", "..");
const UPLOAD_ROOT = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(ROOT, "storage", "uploads");

async function withClient<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

function removeUpload(urlPath: string | null) {
  if (!urlPath || !urlPath.startsWith("/uploads/")) return;
  const file = path.join(UPLOAD_ROOT, urlPath.replace(/^\/uploads\//, ""));
  if (fs.existsSync(file)) fs.rmSync(file);
}

export async function cleanupTestData(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  const files: string[] = [];
  await withClient(async (c) => {
    const run = async (label: string, sql: string, params: unknown[] = []) => {
      counts[label] = (await c.query(sql, params)).rowCount ?? 0;
    };
    await c.query("BEGIN");
    const users = (await c.query(`SELECT id FROM users WHERE email LIKE 'e2e-%@example.com'`)).rows.map((r) => r.id);
    const events = (await c.query(`SELECT id, receipt_file_path FROM events WHERE title LIKE '[E2E]%'`)).rows;
    const eventIds = events.map((e) => e.id);
    const items = (await c.query(`SELECT id FROM stock_items WHERE name LIKE '[E2E]%'`)).rows.map((r) => r.id);
    const damage = (await c.query(`SELECT photo_paths FROM damage_items WHERE event_id = ANY($1::text[])`, [eventIds])).rows;
    files.push(...events.map((e) => e.receipt_file_path), ...damage.flatMap((d) => d.photo_paths ?? []));

    await run("damage_items", `DELETE FROM damage_items WHERE event_id = ANY($1::text[])`, [eventIds]);
    await run("notifications", `DELETE FROM notifications WHERE recipient_user_id = ANY($1::text[]) OR title LIKE '%[E2E]%' OR message LIKE '%[E2E]%'`, [users]);
    await run("equipment_history", `DELETE FROM equipment_history WHERE event_id = ANY($1::text[])`, [eventIds]);
    await run("events", `DELETE FROM events WHERE title LIKE '[E2E]%'`);
    await run("stock_receipts", `DELETE FROM stock_receipts WHERE stock_id = ANY($1::text[])`, [items]);
    await run("stock_history", `DELETE FROM stock_history WHERE stock_id = ANY($1::text[])`, [items]);
    await run("stock_items", `DELETE FROM stock_items WHERE name LIKE '[E2E]%'`);
    await run("users", `DELETE FROM users WHERE email LIKE 'e2e-%@example.com'`);
    await c.query("COMMIT");
  });
  for (const f of files) removeUpload(f);
  counts.files = files.filter(Boolean).length;
  return counts;
}

// ปลดล็อก + ลบ session ของบัญชีพนักงาน (ชุดทดสอบ login หลายรอบ)
export async function resetStaffAccounts(emails: string[]) {
  await withClient(async (c) => {
    await c.query(`UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE LOWER(email) = ANY($1::text[])`, [emails.map((e) => e.toLowerCase())]);
    await c.query(`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE LOWER(email) = ANY($1::text[]))`, [emails.map((e) => e.toLowerCase())]);
  });
}

export async function staffAccountsExist(emails: string[]): Promise<string[]> {
  return withClient(async (c) => {
    const rows = (await c.query(`SELECT LOWER(email) e FROM users WHERE LOWER(email) = ANY($1::text[])`, [emails.map((e) => e.toLowerCase())])).rows;
    return emails.filter((e) => !rows.some((r) => r.e === e.toLowerCase()));
  });
}

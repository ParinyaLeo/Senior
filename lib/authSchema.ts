// DDL ของตาราง users / sessions ใช้ร่วมกันระหว่าง lib/auth.ts และ scripts/seed-users.mjs
// ไฟล์นี้ห้าม import อะไรที่เป็น runtime (มีได้แค่ import type) เพราะ seed script โหลดตรงด้วย Node

export type AuthRole = "SA" | "Manager" | "Stockkeeper";

export const AUTH_ROLES: AuthRole[] = ["SA", "Manager", "Stockkeeper"];

// ต้องตรงกับ users_username_format_check ใน DDL ด้านล่าง
export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;

// ทั้งก้อนส่งเป็น query เดียว → Postgres รันใน transaction เดียว advisory lock จึงคุมได้ทั้งก้อน
// (กัน deadlock เมื่อหลาย request/process รัน DDL ชุดนี้พร้อมกัน — ALTER TABLE ขอ lock แบบ exclusive แม้คอลัมน์มีอยู่แล้ว)
export const AUTH_TABLES_DDL = `
  SELECT pg_advisory_xact_lock(724100501);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SA', 'Manager', 'Stockkeeper')),
    display_name TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

  -- ชื่อผู้ใช้สำหรับ login แทนอีเมลได้ (ไม่บังคับ — บัญชีเก่า/ลูกค้าเป็น NULL)
  -- ห้ามมี "@" เพื่อไม่ให้ชนกับอีเมลของบัญชีอื่น: ค่าที่กรอกตอน login จึงตรงได้แค่อย่างใดอย่างหนึ่ง
  ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
  CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username)) WHERE username IS NOT NULL;
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_format_check') THEN
      ALTER TABLE users ADD CONSTRAINT users_username_format_check
        CHECK (username IS NULL OR username ~ '^[A-Za-z0-9._-]{3,32}$');
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
`;

type Queryable = { query: (sql: string) => Promise<unknown> };

export async function ensureAuthTables(client: Queryable) {
  await client.query(AUTH_TABLES_DDL);
}

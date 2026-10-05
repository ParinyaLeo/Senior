// DDL ของตาราง users / sessions ใช้ร่วมกันระหว่าง lib/auth.ts และ scripts/seed-users.mjs
// ไฟล์นี้ห้าม import อะไรที่เป็น runtime (มีได้แค่ import type) เพราะ seed script โหลดตรงด้วย Node

export type AuthRole = "SA" | "Manager" | "Stockkeeper";

export const AUTH_ROLES: AuthRole[] = ["SA", "Manager", "Stockkeeper"];

export const AUTH_TABLES_DDL = `
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

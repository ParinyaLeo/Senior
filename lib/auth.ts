// ระบบบัญชีผู้ใช้ + session แบบ cookie (httpOnly) — เก็บ session ใน DB ไม่ใช้ JWT
// ตั้งใจไม่ใส่ "use server" ที่ไฟล์นี้: ถ้าใส่ ฟังก์ชันที่ export ทั้งหมด (เช่น createSession)
// จะกลายเป็น server action ที่ฝั่ง client เรียกได้ ไฟล์นี้ต้อง import จาก route handler / server component เท่านั้น
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "./db";
import { ensureAuthTables, type AuthRole } from "./authSchema";
import { hashPassword, verifyPassword } from "./password";

export type { AuthRole } from "./authSchema";

export const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// ต่ออายุ session ใน DB เมื่อเหลือไม่ถึงครึ่ง (sliding expiration)
const SESSION_RENEW_THRESHOLD_MS = SESSION_TTL_MS / 2;
// cookie อยู่นานกว่า session ใน DB ได้ เพราะ DB เป็นตัวตัดสินว่า session หมดอายุหรือยัง
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type SessionUser = {
  id: string;
  email: string;
  username: string | null;
  role: AuthRole;
  displayName: string;
  phone: string | null;
  company: string | null;
};

type UserRow = {
  id: string;
  email: string;
  username: string | null;
  password_hash: string;
  role: AuthRole;
  display_name: string;
  phone: string | null;
  company: string | null;
  is_active: boolean;
  failed_login_count: number;
  locked_until: Date | null;
};

export class EmailTakenError extends Error {
  constructor() {
    super("email already registered");
  }
}

let authTablesReady: Promise<void> | null = null;

async function getAuthPool() {
  const pool = await getPool();
  if (!authTablesReady) {
    authTablesReady = ensureAuthTables(pool).catch((err) => {
      authTablesReady = null;
      throw err;
    });
  }
  await authTablesReady;
  return pool;
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    displayName: row.display_name,
    phone: row.phone,
    company: row.company,
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}

// ─── users ──────────────────────────────────────────────────────────────────

export async function createUser(payload: {
  email: string;
  password: string;
  role: AuthRole;
  displayName: string;
  phone?: string | null;
  company?: string | null;
}): Promise<SessionUser> {
  const pool = await getAuthPool();
  const passwordHash = await hashPassword(payload.password);
  try {
    const res = await pool.query<UserRow>(
      `INSERT INTO users (id, email, password_hash, role, display_name, phone, company)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        randomUUID(),
        normalizeEmail(payload.email),
        passwordHash,
        payload.role,
        payload.displayName.trim(),
        payload.phone?.trim() || null,
        payload.company?.trim() || null,
      ]
    );
    return toSessionUser(res.rows[0]);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      throw new EmailTakenError();
    }
    throw err;
  }
}

// hash ของรหัสผ่านสุ่มที่ไม่มีใครรู้ ใช้ตรวจเทียบเมื่อไม่พบอีเมล เพื่อให้เวลาตอบใกล้เคียงกรณีพบอีเมล
// (กันการเดาว่าอีเมลไหนมีบัญชีจากเวลาที่ใช้)
let dummyHash: Promise<string> | null = null;

// identifier = อีเมล หรือ ชื่อผู้ใช้ (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
// username ห้ามมี "@" (constraint ใน DB) จึงไม่มีทางที่ค่าเดียวตรงกับอีเมลของคนหนึ่งและ username ของอีกคน
export async function authenticate(
  identifier: string,
  password: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; reason: "invalid" | "locked" }> {
  const pool = await getAuthPool();
  const res = await pool.query<UserRow>(
    `SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1 LIMIT 1`,
    [normalizeEmail(identifier)]
  );
  const row = res.rows[0];

  if (!row || !row.is_active) {
    dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
    await verifyPassword(password, await dummyHash);
    return { ok: false, reason: "invalid" };
  }

  if (row.locked_until && row.locked_until.getTime() > Date.now()) {
    return { ok: false, reason: "locked" };
  }

  if (!(await verifyPassword(password, row.password_hash))) {
    // ผิดครบ MAX_FAILED_LOGINS ครั้ง → ล็อก LOCK_MINUTES นาที แล้วเริ่มนับใหม่
    await pool.query(
      `UPDATE users
       SET failed_login_count = CASE WHEN failed_login_count + 1 >= $2 THEN 0 ELSE failed_login_count + 1 END,
           locked_until = CASE WHEN failed_login_count + 1 >= $2 THEN NOW() + ($3 || ' minutes')::interval ELSE locked_until END
       WHERE id = $1`,
      [row.id, MAX_FAILED_LOGINS, String(LOCK_MINUTES)]
    );
    return { ok: false, reason: "invalid" };
  }

  await pool.query(
    `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1`,
    [row.id]
  );
  return { ok: true, user: toSessionUser(row) };
}

// ─── sessions ───────────────────────────────────────────────────────────────

// คืน token ดิบ (ไปเก็บใน cookie) — ใน DB เก็บแค่ sha256(token) ถ้า DB รั่ว token ก็ใช้ต่อไม่ได้
export async function createSession(userId: string): Promise<string> {
  const pool = await getAuthPool();
  const token = randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [hashToken(token), userId, new Date(Date.now() + SESSION_TTL_MS)]
  );
  return token;
}

export async function getUserBySessionToken(token: string): Promise<SessionUser | null> {
  const pool = await getAuthPool();
  const id = hashToken(token);
  const res = await pool.query<UserRow & { expires_at: Date }>(
    `SELECT u.*, s.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW() AND u.is_active`,
    [id]
  );
  const row = res.rows[0];
  if (!row) return null;

  if (row.expires_at.getTime() - Date.now() < SESSION_RENEW_THRESHOLD_MS) {
    await pool.query(`UPDATE sessions SET expires_at = $2 WHERE id = $1`, [
      id,
      new Date(Date.now() + SESSION_TTL_MS),
    ]);
  }
  return toSessionUser(row);
}

export async function deleteSession(token: string) {
  const pool = await getAuthPool();
  await pool.query(`DELETE FROM sessions WHERE id = $1`, [hashToken(token)]);
}

export async function deleteExpiredSessions(): Promise<number> {
  const pool = await getAuthPool();
  const res = await pool.query(`DELETE FROM sessions WHERE expires_at <= NOW()`);
  return res.rowCount ?? 0;
}

// ─── cookie / request helpers ───────────────────────────────────────────────

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// ใช้ได้ทั้งใน server component และ route handler
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserBySessionToken(token);
}

// ใช้ใน route handler: const auth = await requireUser("Manager"); if ("response" in auth) return auth.response;
// ไม่ระบุ role = ขอแค่ login แล้ว
export async function requireUser(
  ...roles: AuthRole[]
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return { response: NextResponse.json({ error: "ไม่มีสิทธิ์ใช้งานส่วนนี้" }, { status: 403 }) };
  }
  return { user };
}

// กัน CSRF สำหรับ request ที่เขียนข้อมูล: เบราว์เซอร์ส่ง Origin มากับ POST เสมอ ถ้ามีแล้วไม่ตรง host ให้ปฏิเสธ
// (ไม่มี Origin = ไม่ได้มาจากเบราว์เซอร์ เช่น curl ซึ่ง cookie ของผู้ใช้ไม่ติดไปด้วยอยู่แล้ว)
export function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

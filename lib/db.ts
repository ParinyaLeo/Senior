"use server";

import { Pool, PoolClient, QueryResult } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/postgres";

const pool = new Pool({
  connectionString,
  ssl:
    process.env.PGSSLMODE === "disable"
      ? false
      : process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
});

export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  audience: string[];
  unread_for: string[];
  created_at: string;
};

async function ensureTable(client?: PoolClient) {
  const c = client ?? (await pool.connect());
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        audience TEXT[] NOT NULL,
        unread_for TEXT[] NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    if (!client) c.release();
  }
}

export async function insertNotification(payload: {
  id: string;
  title: string;
  message: string;
  audience: string[];
  unread: string[];
  createdAt: string;
}) {
  const client = await pool.connect();
  try {
    await ensureTable(client);
    await client.query(
      `INSERT INTO notifications (id, title, message, audience, unread_for, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        payload.id,
        payload.title,
        payload.message,
        payload.audience,
        payload.unread,
        payload.createdAt,
      ]
    );
  } finally {
    client.release();
  }
}

export async function listNotificationsForRole(role: string): Promise<NotificationRow[]> {
  const client = await pool.connect();
  try {
    await ensureTable(client);
    const res: QueryResult<NotificationRow> = await client.query(
      `SELECT id, title, message, audience, unread_for, created_at
       FROM notifications
       WHERE $1 = ANY(audience)
       ORDER BY created_at DESC`,
      [role]
    );
    return res.rows;
  } finally {
    client.release();
  }
}

export async function countUnread(role: string): Promise<number> {
  const client = await pool.connect();
  try {
    await ensureTable(client);
    const res = await client.query<{ count: string }>(
      `SELECT COUNT(*)::int as count
       FROM notifications
       WHERE $1 = ANY(audience) AND $1 = ANY(unread_for)`,
      [role]
    );
    return Number(res.rows[0]?.count ?? 0);
  } finally {
    client.release();
  }
}

export async function markRead(role: string, ids?: string[]) {
  const client = await pool.connect();
  try {
    await ensureTable(client);
    if (ids && ids.length > 0) {
      await client.query(
        `UPDATE notifications
         SET unread_for = array_remove(unread_for, $1)
         WHERE id = ANY($2::text[]) AND $1 = ANY(unread_for)`,
        [role, ids]
      );
    } else {
      await client.query(
        `UPDATE notifications
         SET unread_for = array_remove(unread_for, $1)
         WHERE $1 = ANY(unread_for)`,
        [role]
      );
    }
  } finally {
    client.release();
  }
}

export async function getPool() {
  await ensureTable();
  return pool;
}

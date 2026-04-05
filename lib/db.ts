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

export type EventStatusTone = "success" | "pending" | "progress" | "rejected";

export type EventEquipmentRow = {
  name: string;
  qty: number;
  available: number;
  category: string;
  pricePerDayTHB: number;
};

export type EventRow = {
  id: string;
  title: string;
  status_text: string;
  status_tone: EventStatusTone;
  created_at: string;
  description: string;
  company: string;
  place: string;
  start_date: string;
  end_date: string;
  items_count: number;
  organizer: string | null;
  branch_code: string | null;
  budget_thb: number | null;
  attendees: number | null;
  equipment: EventEquipmentRow[];
};

export type StockRowDb = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  system: string;
  zone: string;
  status: string;
  qty: number;
  available: number;
  price_per_day: number;
  cost: number;
};

async function ensureNotificationsTable(client?: PoolClient) {
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

async function ensureEventsTable(client?: PoolClient) {
  const c = client ?? (await pool.connect());
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status_text TEXT NOT NULL,
        status_tone TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        description TEXT NOT NULL DEFAULT '',
        company TEXT NOT NULL,
        place TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        items_count INTEGER NOT NULL DEFAULT 0,
        organizer TEXT,
        branch_code TEXT,
        budget_thb INTEGER,
        attendees INTEGER,
        equipment JSONB NOT NULL DEFAULT '[]'::jsonb
      );
    `);
  } finally {
    if (!client) c.release();
  }
}

async function ensureStockTable(client?: PoolClient) {
  const c = client ?? (await pool.connect());
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS stock_items (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        system TEXT NOT NULL,
        zone TEXT NOT NULL,
        status TEXT NOT NULL,
        qty INTEGER NOT NULL,
        available INTEGER NOT NULL,
        price_per_day INTEGER NOT NULL,
        cost INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    if (!client) c.release();
  }
}

async function ensureTables(client?: PoolClient) {
  await ensureNotificationsTable(client);
  await ensureEventsTable(client);
  await ensureStockTable(client);
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
    await ensureNotificationsTable(client);
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
    await ensureNotificationsTable(client);
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
    await ensureNotificationsTable(client);
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
    await ensureNotificationsTable(client);
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
  await ensureTables();
  return pool;
}

export async function listEvents(): Promise<EventRow[]> {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    const res: QueryResult<EventRow> = await client.query(
      `SELECT
         id,
         title,
         status_text,
         status_tone,
         created_at,
         description,
         company,
         place,
         start_date,
         end_date,
         items_count,
         organizer,
         branch_code,
         budget_thb,
         attendees,
         equipment
       FROM events
       ORDER BY created_at DESC, id DESC`
    );
    return res.rows;
  } finally {
    client.release();
  }
}

export async function insertEvent(payload: {
  id: string;
  title: string;
  statusText: string;
  statusTone: EventStatusTone;
  createdAt: string;
  description: string;
  company: string;
  place: string;
  startDate: string;
  endDate: string;
  itemsCount: number;
  organizer?: string;
  branchCode?: string;
  budgetTHB?: number;
  attendees?: number;
  equipment?: EventEquipmentRow[];
}) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    await client.query(
      `INSERT INTO events (
        id, title, status_text, status_tone, created_at, description, company, place,
        start_date, end_date, items_count, organizer, branch_code, budget_thb, attendees, equipment
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16::jsonb
      )`,
      [
        payload.id,
        payload.title,
        payload.statusText,
        payload.statusTone,
        payload.createdAt,
        payload.description,
        payload.company,
        payload.place,
        payload.startDate,
        payload.endDate,
        payload.itemsCount,
        payload.organizer ?? null,
        payload.branchCode ?? null,
        payload.budgetTHB ?? null,
        payload.attendees ?? null,
        JSON.stringify(payload.equipment ?? []),
      ]
    );
  } finally {
    client.release();
  }
}

export async function updateEventDecision(payload: {
  id: string;
  startDate: string;
  endDate: string;
  itemsCount: number;
  statusText: string;
  statusTone: EventStatusTone;
  equipment: EventEquipmentRow[];
}) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    const res = await client.query(
      `UPDATE events
       SET
         start_date = $2,
         end_date = $3,
         items_count = $4,
         status_text = $5,
         status_tone = $6,
         equipment = $7::jsonb
       WHERE id = $1`,
      [
        payload.id,
        payload.startDate,
        payload.endDate,
        payload.itemsCount,
        payload.statusText,
        payload.statusTone,
        JSON.stringify(payload.equipment),
      ]
    );
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

export async function deleteEventById(id: string) {
  const client = await pool.connect();
  try {
    await ensureEventsTable(client);
    const res = await client.query(`DELETE FROM events WHERE id = $1`, [id]);
    return res.rowCount ?? 0;
  } finally {
    client.release();
  }
}

export async function listStockItems(): Promise<StockRowDb[]> {
  const client = await pool.connect();
  try {
    await ensureStockTable(client);
    const res: QueryResult<StockRowDb> = await client.query(
      `SELECT id, code, name, brand, category, system, zone, status, qty, available, price_per_day, cost
       FROM stock_items
       ORDER BY id ASC`
    );
    return res.rows;
  } finally {
    client.release();
  }
}

export async function replaceStockItems(items: Array<{
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  system: string;
  zone: string;
  status: string;
  qty: number;
  available: number;
  pricePerDay: number;
  cost: number;
}>) {
  const client = await pool.connect();
  try {
    await ensureStockTable(client);
    await client.query("BEGIN");
    await client.query(`DELETE FROM stock_items`);
    for (const item of items) {
      await client.query(
        `INSERT INTO stock_items (
          id, code, name, brand, category, system, zone, status, qty, available, price_per_day, cost
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )`,
        [
          item.id,
          item.code,
          item.name,
          item.brand,
          item.category,
          item.system,
          item.zone,
          item.status,
          item.qty,
          item.available,
          item.pricePerDay,
          item.cost,
        ]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

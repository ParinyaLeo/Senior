"use server";

import { NextRequest, NextResponse } from "next/server";
import { countUnread, insertNotification, listNotificationsForRole } from "@/lib/db";

type Role = "SA" | "Manager" | "Stockkeeper";

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") as Role | null;
  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";
  if (!role) {
    return NextResponse.json({ error: "role is required" }, { status: 400 });
  }
  const rows = await listNotificationsForRole(role);
  const list = rows.map((r) => ({
    id: r.id,
    title: r.title,
    message: r.message,
    createdAt: r.created_at,
    unreadFor: r.unread_for,
    audience: r.audience,
    unread: r.unread_for.includes(role),
  }));
  return NextResponse.json(unreadOnly ? list.filter((n) => n.unread) : list);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.message || !Array.isArray(body?.audience)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const id = `NTF-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const createdAt = new Date().toISOString();
  await insertNotification({
    id,
    title: body.title,
    message: body.message,
    audience: body.audience,
    unread: body.audience,
    createdAt,
  });
  return NextResponse.json({ ok: true, id, createdAt });
}

export async function HEAD(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  if (!role) return new NextResponse(null, { status: 400 });
  const total = await countUnread(role);
  return new NextResponse(null, { status: 200, headers: { "x-unread-count": String(total) } });
}

"use server";

import { NextRequest, NextResponse } from "next/server";
import {
  countUnread,
  deleteNotificationForRole,
  deleteNotificationsForRole,
  deleteOldNotifications,
  getEventById,
  insertNotification,
  listNotificationsForRole,
} from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";
import { requireUser, type AuthRole, type SessionUser } from "@/lib/auth";
import { AUTH_ROLES } from "@/lib/authSchema";

// ลูกค้าเห็น/แก้ได้เฉพาะแจ้งเตือนที่ส่งถึงตัวเอง ส่วนพนักงานยังแชร์แจ้งเตือนกันตาม role เหมือนเดิม
function recipientOf(user: SessionUser) {
  return user.role === "SA" ? user.id : null;
}

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  // role มาจาก session เท่านั้น (ไม่รับ ?role= จาก client แล้ว)
  const role = auth.user.role;
  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";
  await deleteOldNotifications(30);
  const rows = await listNotificationsForRole(role, recipientOf(auth.user));
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
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  await deleteOldNotifications(30);
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.message || !Array.isArray(body?.audience)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  if (containsNullByte(body)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }
  if (!body.audience.every((r: unknown) => AUTH_ROLES.includes(r as AuthRole))) {
    return NextResponse.json({ error: "invalid audience" }, { status: 400 });
  }

  let audience = Array.from(new Set(body.audience as AuthRole[]));
  let recipientUserId: string | null = null;
  if (audience.includes("SA")) {
    // แจ้งเตือนถึงลูกค้าส่งได้เฉพาะพนักงาน และส่งถึงเจ้าของอีเวนต์ที่ระบุเท่านั้น
    // (กันลูกค้าใช้ eventId ของคนอื่นยิงข้อความไปหาเจ้าของอีเวนต์นั้น)
    if (auth.user.role === "SA") {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ส่งแจ้งเตือนถึงลูกค้า" }, { status: 403 });
    }
    const eventId = typeof body.eventId === "string" ? body.eventId : "";
    const event = eventId ? await getEventById(eventId) : null;
    if (event?.created_by) {
      recipientUserId = event.created_by;
    } else {
      // อีเวนต์เก่าที่ไม่มีเจ้าของ (สร้างก่อนมีระบบบัญชี) → ไม่มีลูกค้าให้แจ้ง
      audience = audience.filter((r) => r !== "SA");
    }
  }

  const id = `NTF-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const createdAt = new Date().toISOString();
  if (audience.length === 0) {
    return NextResponse.json({ ok: true, id, createdAt, skipped: true });
  }
  await insertNotification({
    id,
    title: body.title,
    message: body.message,
    audience,
    unread: audience,
    createdAt,
    recipientUserId,
  });
  return NextResponse.json({ ok: true, id, createdAt });
}

export async function HEAD() {
  const auth = await requireUser();
  if ("response" in auth) return new NextResponse(null, { status: auth.response.status });
  const role = auth.user.role;
  await deleteOldNotifications(30);
  const total = await countUnread(role, recipientOf(auth.user));
  return new NextResponse(null, { status: 200, headers: { "x-unread-count": String(total) } });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const role = auth.user.role;
  const recipient = recipientOf(auth.user);
  const id = req.nextUrl.searchParams.get("id");

  await deleteOldNotifications(30);

  if (id) {
    await deleteNotificationForRole(role, id, recipient);
  } else {
    await deleteNotificationsForRole(role, recipient);
  }

  const unread = await countUnread(role, recipient);
  return NextResponse.json({ ok: true, unread });
}

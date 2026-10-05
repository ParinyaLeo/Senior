"use server";

import { NextRequest, NextResponse } from "next/server";
import { markRead } from "@/lib/db";
import { containsNullByte } from "@/lib/sanitize";
import { requireUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await req.json().catch(() => null);
  const role = auth.user.role;
  if (containsNullByte(body)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }
  const ids = Array.isArray(body?.ids) ? body.ids : undefined;
  // ลูกค้า mark ได้เฉพาะแจ้งเตือนของตัวเอง ไม่งั้นจะไปลบสถานะ "ยังไม่อ่าน" ของลูกค้าคนอื่นด้วย
  await markRead(role, ids, role === "SA" ? auth.user.id : null);
  return NextResponse.json({ ok: true });
}

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
  await markRead(role, ids);
  return NextResponse.json({ ok: true });
}

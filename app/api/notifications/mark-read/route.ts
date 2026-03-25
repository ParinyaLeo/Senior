"use server";

import { NextRequest, NextResponse } from "next/server";
import { markRead } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const role = body?.role as string | undefined;
  if (!role) return NextResponse.json({ error: "role required" }, { status: 400 });
  const ids = Array.isArray(body?.ids) ? body.ids : undefined;
  await markRead(role, ids);
  return NextResponse.json({ ok: true });
}

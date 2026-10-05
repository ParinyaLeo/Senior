import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, clearSessionCookie, deleteSession, isSameOrigin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}

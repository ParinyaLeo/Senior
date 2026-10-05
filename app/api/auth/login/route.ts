import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, isSameOrigin, setSessionCookie } from "@/lib/auth";
import { containsNullByte } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 });
  }
  if (containsNullByte(email) || containsNullByte(password)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  const result = await authenticate(email, password);
  if (!result.ok) {
    const error =
      result.reason === "locked"
        ? "เข้าสู่ระบบผิดหลายครั้งเกินไป กรุณาลองใหม่ในอีก 15 นาที"
        : "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    return NextResponse.json({ error }, { status: 401 });
  }

  const token = await createSession(result.user.id);
  const res = NextResponse.json({ user: result.user });
  setSessionCookie(res, token);
  return res;
}

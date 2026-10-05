import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, isSameOrigin, setSessionCookie } from "@/lib/auth";
import { containsNullByte } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  // identifier = อีเมล หรือ ชื่อผู้ใช้ (ยังรับ field "email" แบบเดิมได้)
  const raw = body?.identifier ?? body?.email;
  const identifier = typeof raw === "string" ? raw.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!identifier || !password) {
    return NextResponse.json({ error: "กรุณากรอกอีเมลหรือชื่อผู้ใช้ และรหัสผ่าน" }, { status: 400 });
  }
  if (containsNullByte(identifier) || containsNullByte(password)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  const result = await authenticate(identifier, password);
  if (!result.ok) {
    const error =
      result.reason === "locked"
        ? "เข้าสู่ระบบผิดหลายครั้งเกินไป กรุณาลองใหม่ในอีก 15 นาที"
        : "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง";
    return NextResponse.json({ error }, { status: 401 });
  }

  const token = await createSession(result.user.id);
  const res = NextResponse.json({ user: result.user });
  setSessionCookie(res, token);
  return res;
}

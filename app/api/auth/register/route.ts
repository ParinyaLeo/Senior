import { NextRequest, NextResponse } from "next/server";
import {
  EmailTakenError,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  createSession,
  createUser,
  isSameOrigin,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  setSessionCookie,
} from "@/lib/auth";
import { containsNullByte } from "@/lib/sanitize";

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_COMPANY_LENGTH = 150;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// สมัครสมาชิกสาธารณะ: สร้างได้เฉพาะบัญชีลูกค้า (role SA) เท่านั้น
// บัญชีผู้จัดการ/เจ้าหน้าที่คลังสร้างผ่าน scripts/seed-users.mjs (ภายหลังจะมีหน้าให้ผู้จัดการสร้าง)
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (containsNullByte(body)) {
    return NextResponse.json({ error: "ข้อความมีอักขระที่ไม่รองรับ กรุณาลบแล้วลองใหม่" }, { status: 400 });
  }

  const email = normalizeEmail(str(body?.email));
  const password = typeof body?.password === "string" ? body.password : "";
  const displayName = str(body?.displayName);
  const phone = str(body?.phone);
  const company = str(body?.company);

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: `รหัสผ่านต้องยาว ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} ตัวอักษร` },
      { status: 400 }
    );
  }
  if (!displayName || displayName.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `กรุณากรอกชื่อ (ไม่เกิน ${MAX_NAME_LENGTH} ตัวอักษร)` }, { status: 400 });
  }
  if (phone.length > MAX_PHONE_LENGTH || company.length > MAX_COMPANY_LENGTH) {
    return NextResponse.json({ error: "ข้อมูลยาวเกินกำหนด" }, { status: 400 });
  }

  try {
    const user = await createUser({ email, password, role: "SA", displayName, phone, company });
    const token = await createSession(user.id);
    const res = NextResponse.json({ user }, { status: 201 });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    if (err instanceof EmailTakenError) {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้สมัครแล้ว" }, { status: 409 });
    }
    throw err;
  }
}

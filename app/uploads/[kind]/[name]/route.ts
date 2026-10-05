import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getEventByReceiptPath } from "@/lib/db";
import { contentTypeFor, resolveUploadFile, uploadUrl } from "@/lib/uploads";

const notFound = () => NextResponse.json({ error: "not found" }, { status: 404 });

// เสิร์ฟไฟล์อัปโหลดที่ URL เดิม /uploads/<kind>/<name> (ไฟล์อยู่นอก public/ แล้ว) พร้อมเช็คสิทธิ์
// - สลิป (receipts): ผู้จัดการ/เจ้าหน้าที่คลังเปิดได้ทุกไฟล์, ลูกค้าเปิดได้เฉพาะสลิปของอีเวนต์ตัวเอง
// - รูปความเสียหาย (damage): เฉพาะผู้จัดการ/เจ้าหน้าที่คลัง (ลูกค้าไม่มีหน้าที่แสดงรูปเหล่านี้)
export async function GET(_req: NextRequest, context: { params: Promise<{ kind: string; name: string }> }) {
  const { kind, name } = await context.params;
  const resolved = resolveUploadFile(kind, name);
  if (!resolved) return notFound();

  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  if (user.role === "SA") {
    if (resolved.kind !== "receipts") return notFound();
    const event = await getEventByReceiptPath(uploadUrl("receipts", name));
    // ตอบ 404 แทน 403 เพื่อไม่บอกว่าไฟล์ของลูกค้าคนอื่นมีอยู่จริง
    if (!event || event.created_by !== user.id) return notFound();
  }

  let data: Buffer;
  try {
    data = await readFile(resolved.filePath);
  } catch {
    return notFound();
  }

  // นามสกุลที่ไม่อยู่ใน whitelist ให้ดาวน์โหลดเป็นไฟล์ ไม่ให้เบราว์เซอร์เปิด/รัน (กัน HTML/SVG ที่อัปโหลดมาก่อนหน้านี้)
  const contentType = contentTypeFor(name);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType ?? "application/octet-stream",
      "Content-Disposition": contentType ? "inline" : `attachment; filename="${name}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

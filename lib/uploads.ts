import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";

// ไฟล์ที่ผู้ใช้อัปโหลด (สลิป, รูปความเสียหาย) เก็บนอก public/ เพื่อไม่ให้ใครเปิดได้โดยไม่ผ่านการเช็คสิทธิ์
// เสิร์ฟผ่าน app/uploads/[kind]/[name]/route.ts ที่ URL เดิม (/uploads/<kind>/<name>) จึงไม่ต้องแก้ path ที่เก็บใน DB
// ตั้ง UPLOAD_DIR ใน .env ได้ถ้าต้องการเก็บที่อื่น (เช่น volume ของ server)
export const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "storage", "uploads");

export const UPLOAD_KINDS = ["receipts", "damage"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export function uploadDir(kind: UploadKind) {
  return path.join(UPLOAD_ROOT, kind);
}

// URL ที่เก็บลง DB และใช้แสดงผลฝั่ง client
export function uploadUrl(kind: UploadKind, fileName: string) {
  return `/uploads/${kind}/${fileName}`;
}

// นามสกุลไฟล์ต้องมาจาก MIME ที่ผ่านการตรวจแล้ว ไม่ใช่จากชื่อไฟล์ที่ผู้ใช้ส่งมา
// (ชื่อไฟล์ปลอมได้ เช่น evil.html + type image/png แล้วถูกเสิร์ฟเป็น HTML)
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

export function extensionForMime(mime: string): string | null {
  return EXT_BY_MIME[mime] ?? null;
}

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

export function contentTypeFor(fileName: string): string | null {
  return CONTENT_TYPE_BY_EXT[path.extname(fileName).toLowerCase()] ?? null;
}

// แปลง (kind, name) จาก URL เป็น path บนดิสก์ — คืน null ถ้า kind ไม่รู้จัก หรือชื่อไฟล์มีอักขระที่พาออกนอกโฟลเดอร์ได้
export function resolveUploadFile(kind: string, name: string): { kind: UploadKind; filePath: string } | null {
  if (!(UPLOAD_KINDS as readonly string[]).includes(kind)) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name.includes("..")) return null;
  return { kind: kind as UploadKind, filePath: path.join(UPLOAD_ROOT, kind, name) };
}

// บน Vercel ดิสก์เขียนถาวรไม่ได้ → ถ้ามี token ของ Vercel Blob ให้เก็บไฟล์ใน Blob store แบบ private
// (เปิดตรงจาก URL ของ Blob ไม่ได้ ต้องผ่าน app/uploads/[kind]/[name]/route.ts ที่เช็คสิทธิ์เหมือนเดิม)
// ไม่มี token (รันในเครื่อง) → เก็บลงดิสก์ที่ UPLOAD_ROOT แบบเดิม
function blobStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveUpload(kind: UploadKind, fileName: string, data: Buffer, contentType: string) {
  if (blobStorageEnabled()) {
    await put(`${kind}/${fileName}`, data, { access: "private", contentType, addRandomSuffix: false });
    return;
  }
  await mkdir(uploadDir(kind), { recursive: true });
  await writeFile(path.join(uploadDir(kind), fileName), data);
}

// คืน null ถ้าไม่พบไฟล์
export async function readUpload(kind: UploadKind, fileName: string): Promise<Buffer | null> {
  if (blobStorageEnabled()) {
    const result = await get(`${kind}/${fileName}`, { access: "private" }).catch(() => null);
    if (!result || result.statusCode !== 200) return null;
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
  return readFile(path.join(uploadDir(kind), fileName)).catch(() => null);
}

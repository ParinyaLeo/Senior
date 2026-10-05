// ย้ายไฟล์อัปโหลดเดิมจาก public/uploads/<kind>/ ไปเก็บนอก public (ค่าเริ่มต้น storage/uploads/<kind>/)
// รัน: npm run migrate:uploads   (รันซ้ำได้ — ไฟล์ที่ย้ายไปแล้วจะถูกข้าม)
//
// URL ที่เก็บใน DB (/uploads/receipts/..., /uploads/damage/...) ไม่ต้องแก้ เพราะ app/uploads/[kind]/[name]/route.ts
// เสิร์ฟที่ URL เดิม — แต่ต้องย้ายไฟล์ออกจาก public/ ก่อน ไม่งั้น Next จะเสิร์ฟไฟล์ใน public ตรงๆ โดยไม่เช็คสิทธิ์
import { copyFile, mkdir, readdir, rename, rm, rmdir, stat } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_KINDS, UPLOAD_ROOT } from "../lib/uploads.ts";

const PUBLIC_UPLOADS = path.join(process.cwd(), "public", "uploads");

async function exists(p) {
  try {
    return await stat(p);
  } catch {
    return null;
  }
}

let moved = 0;
let skipped = 0;
console.log(`ปลายทาง: ${UPLOAD_ROOT}`);

for (const kind of UPLOAD_KINDS) {
  const src = path.join(PUBLIC_UPLOADS, kind);
  const dst = path.join(UPLOAD_ROOT, kind);
  if (!(await exists(src))) {
    console.log(`- ${kind}: ไม่มีโฟลเดอร์ใน public (ย้ายไปแล้วหรือยังไม่เคยมีไฟล์)`);
    continue;
  }
  await mkdir(dst, { recursive: true });

  for (const name of await readdir(src)) {
    const from = path.join(src, name);
    const to = path.join(dst, name);
    const fromStat = await stat(from);
    if (!fromStat.isFile()) continue;

    const toStat = await exists(to);
    if (toStat) {
      if (toStat.size !== fromStat.size) {
        throw new Error(`มีไฟล์ชื่อเดียวกันแต่ขนาดต่างกันอยู่แล้วที่ปลายทาง: ${to} — ตรวจสอบเองก่อนรันใหม่`);
      }
      await rm(from); // ย้ายไปแล้วในรอบก่อน เหลือแค่สำเนาใน public
      skipped++;
      continue;
    }
    try {
      await rename(from, to);
    } catch (err) {
      if (err.code !== "EXDEV") throw err; // คนละ drive/volume → copy แล้วค่อยลบต้นทาง
      await copyFile(from, to);
      await rm(from);
    }
    moved++;
  }
  console.log(`+ ${kind}: ${src} → ${dst}`);
  await rmdir(src).catch(() => {}); // ลบโฟลเดอร์เปล่า (ถ้ายังมีไฟล์อื่นค้างจะไม่ลบ)
}
await rmdir(PUBLIC_UPLOADS).catch(() => {});

console.log(`ย้าย ${moved} ไฟล์, ข้าม ${skipped} ไฟล์ที่ย้ายไปแล้ว`);

# ชุดทดสอบ E2E (Playwright Test)

```bash
npm run test:e2e          # รันทั้งชุด
npm run test:e2e:report   # เปิด HTML report ของรอบล่าสุด
```

## ต้องมีก่อนรัน
1. `.env` มี `DATABASE_URL`, `SEED_MANAGER_PASSWORD`, `SEED_STOCKKEEPER_PASSWORD`
2. บัญชีพนักงานถูกสร้างแล้ว: `npm run seed:users` (ถ้าเปลี่ยนรหัสใน `.env` ให้รัน `npm run seed:users -- --reset-password`)
3. dev server เปิดอยู่ที่ `http://localhost:3000` — ถ้ายังไม่เปิด ชุดทดสอบจะสั่ง `npm run dev` ให้เอง
   (เปลี่ยน URL ได้ด้วย `E2E_BASE_URL`)

## ข้อมูลทดสอบ
- ทุกอย่างที่ชุดทดสอบสร้างขึ้นต้นด้วย `[E2E]` (อีเวนต์/อุปกรณ์) หรือ `e2e-*@example.com` (บัญชีลูกค้า)
- ใช้อุปกรณ์ทดสอบของตัวเอง ไม่แตะอุปกรณ์จริงในคลัง
- global setup ล้างข้อมูลทดสอบที่ค้างจากรอบก่อน, global teardown ลบทิ้งหลังรันเสร็จ
  (ตั้ง `E2E_KEEP_DATA=1` ถ้าต้องการเก็บไว้ดู)
- ควรรันกับ DB สำหรับพัฒนา/ทดสอบ ไม่ใช่ DB ที่ใช้งานจริง

## โครงสร้าง
| ไฟล์ | หมวด |
|---|---|
| `tests/01-auth.spec.ts` | login/logout, รหัสผิด, ล็อกบัญชี, redirect, สมัครสมาชิก |
| `tests/02-access-control.spec.ts` | เมนู/ปุ่มตาม role, ทุก API × ทุก role, ปลอม role |
| `tests/03-event-lifecycle.spec.ts` | สร้าง → อนุมัติ/ไม่อนุมัติ → เบิก → คืน → สลิป → ยืนยันชำระ + แจ้งเตือน |
| `tests/04-stock.spec.ts` | เพิ่ม/แก้/รับเข้า/ลบ, เพิ่มรหัสซ้ำพร้อมกัน |
| `tests/05-damage.spec.ts` | คืนแบบเสียหาย + รูป → รายงาน → ใบแจ้งหนี้ → จำหน่าย |
| `tests/06-documents.spec.ts` | ใบเสนอราคา/ใบแจ้งหนี้/ใบสั่งงาน + PDF, เอกสารแนบ |
| `tests/07-file-security.spec.ts` | สิทธิ์เปิดไฟล์แนบ, path traversal, นามสกุลจาก MIME |
| `tests/08-customer-isolation.spec.ts` | ลูกค้าเห็นเฉพาะของตัวเอง, ใช้งานพร้อมกันหลายคน |

แต่ละเทสต์มี tag role (`@customer` `@manager` `@stockkeeper` `@guest` `@all-roles`)
— รันเฉพาะ role ได้ เช่น `npm run test:e2e -- --grep @manager`

ผลสรุปแยกตาม role/หมวด อยู่ที่ `e2e-report/summary.md` และ HTML report ที่ `e2e-report/html/`

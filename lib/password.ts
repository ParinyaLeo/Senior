import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// hash รหัสผ่านด้วย scrypt ที่มากับ Node (memory-hard ไม่ต้องลง dependency เพิ่ม)
// รูปแบบที่เก็บใน DB: scrypt$N$r$p$<salt base64>$<hash base64>
// เก็บพารามิเตอร์ไว้ในค่าที่ hash เอง เพื่อให้ปรับความแรงภายหลังได้โดย hash เก่ายังตรวจได้
// ไฟล์นี้ import แค่ node:crypto เท่านั้น เพราะ scripts/seed-users.mjs เรียกใช้ตรงๆ ด้วย
const N = 32768; // 2^15
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
// scrypt ใช้หน่วยความจำ ~128 * N * r = 32MB ซึ่งชนเพดาน default (32MB) พอดี จึงต้องขยาย maxmem
const MAX_MEM = 64 * 1024 * 1024;

function scryptAsync(password: string, salt: Buffer, keylen: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scryptAsync(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: MAX_MEM });
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, "base64");
  const key = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAX_MEM,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

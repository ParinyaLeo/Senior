import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // เปิดผ่าน Cloudflare (tunnel/proxy): no-transform กัน Cloudflare แก้ HTML เช่น Email Obfuscation
  // ที่แปลงอีเมลในหน้าเป็น [email protected] ทำให้ React hydrate ไม่ตรงแล้วปุ่มในหน้ากดไม่ได้
  async headers() {
    return [
      {
        // เฉพาะหน้า HTML (Cloudflare แก้แค่ HTML) — ไม่รวมไฟล์ static ของ Next (ต้องคง cache ยาวเดิม)
        // และ /api, /uploads ที่ route ตั้ง Cache-Control ของตัวเอง (เช่นไฟล์แนบ private, no-store)
        source: "/((?!_next/static|_next/image|api/|uploads/).*)",
        headers: [{ key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate, no-transform" }],
      },
    ];
  },
};

export default nextConfig;

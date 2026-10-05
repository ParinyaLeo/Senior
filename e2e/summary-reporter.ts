import fs from "node:fs";
import path from "node:path";
import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";

// สรุปผลเป็นตาราง แยกตาม role (จาก tag) และหมวด (จากชื่อไฟล์) — พิมพ์ออกจอและเขียนเป็น markdown
const ROLE_LABEL: Record<string, string> = {
  "@guest": "ไม่ login",
  "@customer": "ลูกค้า",
  "@manager": "ผู้จัดการ",
  "@stockkeeper": "เจ้าหน้าที่คลัง",
  "@all-roles": "ทุก role",
};
const CATEGORY_LABEL: Record<string, string> = {
  "01-auth": "Auth / Login",
  "02-access-control": "สิทธิ์การเข้าถึง",
  "03-event-lifecycle": "อีเวนต์ / เบิก-คืน / สลิป / แจ้งเตือน",
  "04-stock": "สต็อก",
  "05-damage": "รายงานความเสียหาย",
  "06-documents": "เอกสาร + PDF",
  "07-file-security": "ความปลอดภัยไฟล์แนบ",
  "08-customer-isolation": "แยกข้อมูลลูกค้า + concurrency",
};

type Row = { category: string; roles: string[]; title: string; status: TestResult["status"]; error: string; ms: number };

export default class SummaryReporter implements Reporter {
  private rows: Row[] = [];
  constructor(private options: { outputFile?: string } = {}) {}

  onTestEnd(test: TestCase, result: TestResult) {
    // เก็บผลครั้งสุดท้ายของแต่ละเทสต์ (กรณีมี retry)
    this.rows = this.rows.filter((r) => r.title !== test.titlePath().slice(2).join(" › "));
    const file = path.basename(test.location.file).replace(/\.spec\.ts$/, "");
    const roles = test.tags.filter((t) => ROLE_LABEL[t]).map((t) => ROLE_LABEL[t]);
    this.rows.push({
      category: CATEGORY_LABEL[file] ?? file,
      roles: roles.length ? roles : ["(ไม่ระบุ)"],
      title: test.titlePath().slice(2).join(" › "),
      status: result.status,
      error: (result.error?.message ?? "").replace(/\u001b\[[0-9;]*m/g, "").split("\n").filter(Boolean).slice(0, 2).join(" "),
      ms: result.duration,
    });
  }

  onEnd(result: FullResult) {
    const ok = (r: Row) => r.status === "passed";
    const group = (key: (r: Row) => string[]) => {
      const m = new Map<string, { pass: number; fail: number; skip: number }>();
      for (const r of this.rows) for (const k of key(r)) {
        const g = m.get(k) ?? { pass: 0, fail: 0, skip: 0 };
        if (ok(r)) g.pass++;
        else if (r.status === "skipped") g.skip++;
        else g.fail++;
        m.set(k, g);
      }
      return [...m.entries()];
    };
    const table = (title: string, entries: [string, { pass: number; fail: number; skip: number }][]) =>
      [`### ${title}`, "", "| | ผ่าน | ไม่ผ่าน | ข้าม |", "|---|---|---|---|",
        ...entries.map(([k, g]) => `| ${k} | ${g.pass} | ${g.fail} | ${g.skip} |`), ""].join("\n");

    const total = this.rows.length;
    const passed = this.rows.filter(ok).length;
    const failed = this.rows.filter((r) => !ok(r) && r.status !== "skipped");
    const lines = [
      `# ผลทดสอบ E2E — ${new Date().toLocaleString("th-TH")}`,
      "",
      `**รวม ${total} ข้อ · ผ่าน ${passed} · ไม่ผ่าน ${failed.length} · สถานะรวม: ${result.status}**`,
      "",
      table("แยกตาม role", group((r) => r.roles)),
      table("แยกตามหมวด", group((r) => [r.category])),
      "### ข้อที่ไม่ผ่าน",
      "",
      ...(failed.length ? failed.map((r) => `- **[${r.category}] ${r.title}** — ${r.error || r.status}`) : ["- ไม่มี"]),
      "",
    ];
    const md = lines.join("\n");
    console.log("\n" + md);
    if (this.options.outputFile) {
      fs.mkdirSync(path.dirname(this.options.outputFile), { recursive: true });
      fs.writeFileSync(this.options.outputFile, md);
    }
  }
}

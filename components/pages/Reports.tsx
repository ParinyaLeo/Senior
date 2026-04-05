"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  DollarSign,
  Boxes,
  CalendarDays,
  AlertTriangle,
  FileText,
  Download,
  FilePlus,
  CheckCircle2,
  Eye,
  Trash2,
} from "lucide-react";
import type { StockRow as AppStockRow } from "../AppShell";

type ReportTab = "finance" | "stock" | "events" | "damage" | "docs";

type DocCategory = "invoice" | "quotation" | "workorder" | "report" | "contract" | "other";
const categoryLabel: Record<DocCategory, string> = {
  invoice: "ใบแจ้งหนี้",
  quotation: "ใบเสนอราคา",
  workorder: "ใบสั่งงาน",
  report: "รายงาน",
  contract: "สัญญา",
  other: "อื่นๆ",
};

function SegTab({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={["flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition", active ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200" : "text-zinc-500 hover:text-zinc-700"].join(" ")}>
      {icon}{label}
    </button>
  );
}

function StatMini({ title, value, unit, tone }: { title: string; value: string | number; unit?: string; tone: "emerald" | "sky" | "violet" }) {
  const toneCls = tone === "emerald" ? "bg-emerald-50" : tone === "sky" ? "bg-sky-50" : "bg-violet-50";
  const valueCls = tone === "emerald" ? "text-emerald-700" : tone === "sky" ? "text-sky-700" : "text-violet-700";
  return (
    <div className={`rounded-2xl border border-zinc-200 ${toneCls} p-5`}>
      <div className="text-sm font-semibold text-zinc-800">{title}</div>
      <div className={`mt-2 text-2xl font-bold ${valueCls}`}>{value} {unit ?? ""}</div>
    </div>
  );
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" }) {
  const cls = tone === "blue" ? "bg-blue-50 text-blue-700 ring-blue-100" : "bg-white text-zinc-700 ring-zinc-200";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${cls}`}>{children}</span>;
}

function CategoryPill({ cat }: { cat: DocCategory }) {
  const cls =
    cat === "invoice" ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
    : cat === "quotation" ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
    : cat === "workorder" ? "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
    : cat === "report" ? "bg-orange-100 text-orange-800 ring-1 ring-orange-200"
    : cat === "contract" ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200"
    : "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{categoryLabel[cat]}</span>;
}

function StatusPill({ tone, text }: { tone: "success" | "pending"; text: string }) {
  const cls = tone === "success" ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200" : "bg-orange-100 text-orange-800 ring-1 ring-orange-200";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{text}</span>;
}

function ActionDocButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50">
      <FilePlus className="h-4 w-4 text-zinc-500" />{label}
    </button>
  );
}

// ✅ ExportButton รับ onClick จากภายนอก
function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50">
      <Download className="h-4 w-4" />ส่งออก Excel
    </button>
  );
}

function SummaryCard({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: "blue" | "emerald" | "violet" | "amber" | "orange" }) {
  const toneMap = { blue: "bg-blue-50 text-blue-700 ring-blue-100", emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100", violet: "bg-violet-50 text-violet-700 ring-violet-100", amber: "bg-amber-50 text-amber-800 ring-amber-100", orange: "bg-orange-50 text-orange-700 ring-orange-100" } as const;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ring-1 ${toneMap[tone]}`}>{icon}</div>
        <div><div className="text-xl font-semibold text-zinc-900">{value}</div><div className="text-sm text-zinc-500">{label}</div></div>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type EventReportRow = { id: string; title: string; company: string; date: string; revenue: number; equipmentCount: number; status: { text: string; tone: "success" | "pending" }; };
type DocRow = { id: string; title: string; owner: string; category: DocCategory; eventOrCompany: string; description: string; uploadedAt: string; uploadedAtISO: string; sizeLabel: string; };

// ─── Helper: ส่งออก Excel ─────────────────────────────────────────────────────
function exportToExcel(sheetName: string, filename: string, data: (string | number)[][]) {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    // ปรับความกว้าง column อัตโนมัติตามข้อมูล
    const colWidths = data[0].map((_, colIdx) =>
      Math.min(40, Math.max(10, ...data.map(row => String(row[colIdx] ?? "").length)))
    );
    ws["!cols"] = colWidths.map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `${filename}-${today}.xlsx`);
  }).catch(() => {
    alert("กรุณาติดตั้ง xlsx ก่อน:\nnpm install xlsx");
  });
}

export default function Reports({ stockData }: { stockData: AppStockRow[] }) {
  const [tab, setTab] = useState<ReportTab>("finance");
  const [query, setQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocRow | null>(null);
  const [docCategory, setDocCategory] = useState<"all" | DocCategory>("all");
  const [docSort, setDocSort] = useState<"newest" | "oldest">("newest");

  const finance = useMemo(() => ({ totalRevenue: 0, totalEvents: 0, avgPerEvent: 0, topEvents: [] as { id: string; name: string; amount: number }[] }), []);

  const stockRows = useMemo(() => stockData.map((r) => ({
    name: r.name,
    code: `${r.brand} - ${r.code}`,
    type: r.system,
    warehouse: r.zone,
    qty: r.qty,
    ready: r.available,
    pricePerDay: r.pricePerDay,
    cost: r.cost,
  })), [stockData]);

  const [eventReportRows, setEventReportRows] = useState<EventReportRow[]>([]);

  React.useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("failed to fetch events");
        const rows = (await res.json()) as Array<{
          id: string;
          title: string;
          company: string;
          date: string;
          items: string;
          status: { text: string; tone: "success" | "pending" | "progress" | "rejected" };
          equipment?: Array<{ qty: number; pricePerDayTHB: number }>;
        }>;

        setEventReportRows(rows.map((r) => {
          const revenue = Array.isArray(r.equipment)
            ? r.equipment.reduce((sum, eq) => sum + (eq.qty * eq.pricePerDayTHB), 0)
            : 0;
          return {
            id: r.id,
            title: r.title,
            company: r.company,
            date: r.date,
            revenue,
            equipmentCount: Array.isArray(r.equipment) ? r.equipment.length : 0,
            status: { text: r.status.text, tone: r.status.tone === "success" ? "success" : "pending" },
          };
        }));
      } catch {
        setEventReportRows([]);
      }
    };

    loadEvents();
  }, []);

  const damageRows = useMemo(() => [] as { id: string; itemName: string; code: string; eventId?: string; date: string; cost: number; status: "reported" | "fixed" }[], []);

  const docsRows: DocRow[] = useMemo(() => [
    { id: "DOC001", title: "ใบสั่งงาน - งานเลี้ยงปีใหม่", owner: "Stockkeeper Team", category: "workorder", eventOrCompany: "งานเลี้ยงปีใหม่ 2025\nบริษัท ตัวอย่าง จำกัด\n31 ธ.ค. - 1 ม.ค.", description: "ใบสั่งงานเตรียมอุปกรณ์งานเลี้ยงฉลองปีใหม่", uploadedAt: "20 พ.ย. 2567", uploadedAtISO: "2024-11-20", sizeLabel: "22 MB" },
    { id: "DOC002", title: "รายงานตรวจสอบอุปกรณ์ประจำเดือน", owner: "Stockkeeper Team", category: "report", eventOrCompany: "-", description: "รายงานการตรวจสอบสภาพอุปกรณ์ทั้งหมดประจำเดือนมิถุนายน", uploadedAt: "30 มิ.ย. 2567", uploadedAtISO: "2024-06-30", sizeLabel: "19 MB" },
    { id: "DOC003", title: "สัญญาเช่าอุปกรณ์ระยะยาว", owner: "Manager Team", category: "contract", eventOrCompany: "โครงการพัฒนาพนักงาน\nบริษัท HR Solutions จำกัด\n1 ต.ค. - 31 ธ.ค.", description: "สัญญาเช่าอุปกรณ์สำหรับงานต่อเนื่อง 6 เดือน", uploadedAt: "1 มี.ค. 2567", uploadedAtISO: "2024-03-01", sizeLabel: "3.5 MB" },
    { id: "DOC004", title: "ใบเสนอราคา - งานแสดงสินค้า Trade Show", owner: "Manager Team", category: "quotation", eventOrCompany: "Trade Show International 2024\nบริษัท เทคอินโนเวชั่นส์ จำกัด\n5 ก.ค. - 8 ก.ค.", description: "ใบเสนอราคาอุปกรณ์สำหรับงานแสดงสินค้านานาชาติ", uploadedAt: "15 พ.ค. 2567", uploadedAtISO: "2024-05-15", sizeLabel: "4.8 MB" },
    { id: "DOC005", title: "ใบแจ้งหนี้ - งานสัมมนาผู้บริหาร", owner: "SA Team", category: "invoice", eventOrCompany: "งานสัมมนาผู้บริหาร 2024\nบริษัท ไมน์ครุต จำกัด\n10 มิ.ย. - 12 มิ.ย.", description: "ใบแจ้งหนี้งานจัดสัมมนาผู้บริหารระดับสูง", uploadedAt: "5 เม.ย. 2567", uploadedAtISO: "2024-04-05", sizeLabel: "3.1 MB" },
    { id: "DOC006", title: "ใบแจ้งหนี้ - Annual Meeting 2025", owner: "SA Team", category: "invoice", eventOrCompany: "Annual Meeting 2025\nABC Corporation\n20 พ.ย.", description: "ใบแจ้งหนี้ค่าอุปกรณ์และบริการ", uploadedAt: "21 พ.ย. 2567", uploadedAtISO: "2024-11-21", sizeLabel: "2.4 MB" },
    { id: "DOC007", title: "ใบเสนอราคา - Product Launch Event", owner: "Manager Team", category: "quotation", eventOrCompany: "Product Launch Event\nTech Innovations Ltd\n25 พ.ย.", description: "ใบเสนอราคาอุปกรณ์เวทีและระบบแสง", uploadedAt: "18 พ.ย. 2567", uploadedAtISO: "2024-11-18", sizeLabel: "5.2 MB" },
    { id: "DOC008", title: "เอกสารอื่นๆ - แนบรูปตัวอย่างงาน", owner: "Manager Team", category: "other", eventOrCompany: "-", description: "ไฟล์แนบสำหรับอ้างอิงงานและตัวอย่างการติดตั้ง", uploadedAt: "2 ก.พ. 2567", uploadedAtISO: "2024-02-02", sizeLabel: "12 MB" },
  ], []);

  // ─── Export functions แยกตาม tab ──────────────────────────────────────────
  const handleExportStock = () => {
    exportToExcel("Stock Report", "stock-report", [
      ["ชื่ออุปกรณ์", "รหัส", "ประเภท", "โกดัง", "จำนวนรวม", "พร้อมใช้", "ใช้งานอยู่", "ราคา/วัน (฿)", "ราคาต้นทุน (฿)"],
      ...filteredStock.map(r => [r.name, r.code, r.type, r.warehouse, r.qty, r.ready, r.qty - r.ready, r.pricePerDay, r.cost]),
    ]);
  };

  const handleExportEvents = () => {
    exportToExcel("Events Report", "events-report", [
      ["ID", "ชื่อ Event", "บริษัท", "วันที่", "สถานะ", "รายได้ (฿)", "อุปกรณ์ (รายการ)"],
      ...filteredEvents.map(e => [e.id, e.title, e.company, e.date, e.status.text, e.revenue, e.equipmentCount]),
    ]);
  };

  const handleExportDocs = () => {
    exportToExcel("Documents", "documents-report", [
      ["ID", "ชื่อเอกสาร", "ทีม", "หมวดหมู่", "Event / บริษัท", "คำอธิบาย", "วันที่อัปโหลด"],
      ...filteredDocs.map(d => [d.id, d.title, d.owner, categoryLabel[d.category], d.eventOrCompany.replace(/\n/g, " | "), d.description, d.uploadedAt]),
    ]);
  };

  // (finance/damage ยังไม่มีข้อมูลจริง)
  const handleExportFinance = () => alert("ยังไม่มีข้อมูลการเงินให้ส่งออก");
  const handleExportDamage = () => alert("ยังไม่มีรายการความเสียหายให้ส่งออก");

  // เลือก export function ตาม tab ปัจจุบัน
  const handleExport = () => {
    if (tab === "stock") return handleExportStock();
    if (tab === "events") return handleExportEvents();
    if (tab === "docs") return handleExportDocs();
    if (tab === "finance") return handleExportFinance();
    if (tab === "damage") return handleExportDamage();
  };

  // ─── Filter data ───────────────────────────────────────────────────────────
  const filteredStock = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return stockRows;
    return stockRows.filter(r => [r.name, r.code, r.type, r.warehouse].some(v => v.toLowerCase().includes(s)));
  }, [query, stockRows]);

  const filteredEvents = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return eventReportRows;
    return eventReportRows.filter(e => [e.title, e.company, e.id].some(v => v.toLowerCase().includes(s)));
  }, [query, eventReportRows]);

  const filteredDamage = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return damageRows;
    return damageRows.filter(d => [d.itemName, d.code, d.eventId ?? ""].some(v => v.toLowerCase().includes(s)));
  }, [query, damageRows]);

  const docStats = useMemo(() => ({
    total: docsRows.length,
    invoice: docsRows.filter(d => d.category === "invoice").length,
    quotation: docsRows.filter(d => d.category === "quotation").length,
    workorder: docsRows.filter(d => d.category === "workorder").length,
    other: docsRows.filter(d => !["invoice","quotation","workorder"].includes(d.category)).length,
  }), [docsRows]);

  const filteredDocs = useMemo(() => {
    let rows = docsRows;
    if (docCategory !== "all") rows = rows.filter(r => r.category === docCategory);
    const s = query.trim().toLowerCase();
    if (s) rows = rows.filter(r => [r.title, r.owner, r.eventOrCompany, r.description].some(v => v.toLowerCase().includes(s)));
    return [...rows].sort((a, b) => docSort === "newest" ? b.uploadedAtISO.localeCompare(a.uploadedAtISO) : a.uploadedAtISO.localeCompare(b.uploadedAtISO));
  }, [docsRows, query, docCategory, docSort]);

  const searchPlaceholder = tab === "stock" ? "ค้นหาอุปกรณ์ ชื่อ, รหัส, ชนิด, หมวดหมู่..."
    : tab === "events" ? "ค้นหา Event, บริษัท..."
    : tab === "damage" ? "ค้นหาอุปกรณ์ที่เสียหาย, รหัส, Event..."
    : "ค้นหาเอกสาร, Event, บริษัท...";

  const onAddDoc = () => alert("เพิ่มเอกสาร (ต่อไปค่อยทำ modal/upload)");
  const onViewDoc = (id: string) => { const doc = docsRows.find(r => r.id === id); if (doc) setSelectedDoc(doc); };
  const onDownloadDoc = (id: string) => alert(`ดาวน์โหลด: ${id}`);
  const onDeleteDoc = (id: string) => alert(`ลบเอกสาร: ${id}`);
  const onOpenInvoice = (id: string) => alert(`ใบแจ้งหนี้: ${id}`);
  const onOpenQuotation = (id: string) => alert(`ใบเสนอราคา: ${id}`);
  const onOpenWorkOrder = (id: string) => alert(`ใบสั่งงาน: ${id}`);

  return (
    <div className="px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">รายงาน</h1>
        <p className="mt-1 text-sm text-zinc-500">รายงานและสรุปการใช้งานอุปกรณ์และ Events</p>
      </div>

      {/* Tabs */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-100/60 p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <SegTab active={tab === "finance"} onClick={() => setTab("finance")} icon={<DollarSign className="h-4 w-4" />} label="การเงิน" />
          <SegTab active={tab === "stock"} onClick={() => setTab("stock")} icon={<Boxes className="h-4 w-4" />} label="สต็อก" />
          <SegTab active={tab === "events"} onClick={() => setTab("events")} icon={<CalendarDays className="h-4 w-4" />} label="อีเวนต์" />
          <SegTab active={tab === "damage"} onClick={() => setTab("damage")} icon={<AlertTriangle className="h-4 w-4" />} label="ความเสียหาย" />
          <SegTab active={tab === "docs"} onClick={() => setTab("docs")} icon={<FileText className="h-4 w-4" />} label="เอกสาร" />
        </div>
      </div>

      {/* Docs summary */}
      {tab === "docs" && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard icon={<FileText className="h-5 w-5" />} value={docStats.total} label="ทั้งหมด" tone="blue" />
          <SummaryCard icon={<FileText className="h-5 w-5" />} value={docStats.invoice} label="ใบแจ้งหนี้" tone="emerald" />
          <SummaryCard icon={<FileText className="h-5 w-5" />} value={docStats.quotation} label="ใบเสนอราคา" tone="blue" />
          <SummaryCard icon={<FileText className="h-5 w-5" />} value={docStats.workorder} label="ใบสั่งงาน" tone="violet" />
          <SummaryCard icon={<FileText className="h-5 w-5" />} value={docStats.other} label="อื่นๆ" tone="orange" />
        </div>
      )}

      {/* Search + filter */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" placeholder={searchPlaceholder} />
          </div>
          {tab === "docs" && (
            <div className="flex items-center gap-3">
              <select value={docCategory} onChange={e => setDocCategory(e.target.value as any)} className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50">
                <option value="all">หมวดหมู่ทั้งหมด</option>
                <option value="invoice">ใบแจ้งหนี้</option>
                <option value="quotation">ใบเสนอราคา</option>
                <option value="workorder">ใบสั่งงาน</option>
                <option value="report">รายงาน</option>
                <option value="contract">สัญญา</option>
                <option value="other">อื่นๆ</option>
              </select>
              <select value={docSort} onChange={e => setDocSort(e.target.value as any)} className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50">
                <option value="newest">วันที่อัปโหลด</option>
                <option value="oldest">เก่ากว่า → ใหม่กว่า</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">

        {/* Finance */}
        {tab === "finance" && (
          <Card title="รายงานการเงิน" right={<ExportButton onClick={handleExport} />}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatMini title="รายได้รวม" value={finance.totalRevenue} unit="฿" tone="emerald" />
              <StatMini title="Events ทั้งหมด" value={finance.totalEvents} tone="sky" />
              <StatMini title="ค่าเฉลี่ย/Event" value={finance.avgPerEvent} unit="฿" tone="violet" />
            </div>
            <div className="mt-6">
              <div className="text-sm font-semibold text-zinc-900">Top 5 Events รายได้สูงสุด</div>
              <div className="mt-1 text-sm text-zinc-500">แสดง {finance.topEvents.length} จาก {finance.totalEvents} Events</div>
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white">
                {finance.topEvents.length === 0 ? (
                  <div className="p-5 text-sm text-zinc-500">ยังไม่มีข้อมูล (0 ฿)</div>
                ) : finance.topEvents.map((e, idx) => (
                  <div key={e.id} className="flex items-center justify-between gap-4 border-b border-zinc-100 p-5 last:border-0">
                    <div><div className="text-sm font-semibold text-zinc-900">{idx + 1}. {e.name}</div><div className="mt-1 text-xs text-zinc-500">{e.id}</div></div>
                    <div className="text-sm font-bold text-zinc-900">{e.amount.toLocaleString()} ฿</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ✅ Stock + Export Excel จริง */}
        {tab === "stock" && (
          <>
            <div className="mb-4 text-sm text-zinc-500">แสดง {filteredStock.length} จาก {stockRows.length} รายการ</div>
            <Card title="รายงาน Stock" right={<ExportButton onClick={handleExport} />}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-zinc-500">
                      <th className="border-b border-zinc-200 py-3 pr-4">ชื่ออุปกรณ์</th>
                      <th className="border-b border-zinc-200 py-3 pr-4">ประเภท</th>
                      <th className="border-b border-zinc-200 py-3 pr-4">โกดัง</th>
                      <th className="border-b border-zinc-200 py-3 pr-4">จำนวน</th>
                      <th className="border-b border-zinc-200 py-3 pr-4">ราคา/วัน</th>
                      <th className="border-b border-zinc-200 py-3 text-right">ราคาต้นทุน</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-zinc-900">
                    {filteredStock.map((r, idx) => (
                      <tr key={`${r.code}-${idx}`} className="hover:bg-zinc-50/60">
                        <td className="border-b border-zinc-100 py-4 pr-4 align-top"><div className="font-semibold">{r.name}</div><div className="mt-1 text-xs text-zinc-500">{r.code}</div></td>
                        <td className="border-b border-zinc-100 py-4 pr-4 align-top"><Chip>{r.type}</Chip></td>
                        <td className="border-b border-zinc-100 py-4 pr-4 align-top"><Chip tone="blue">{r.warehouse}</Chip></td>
                        <td className="border-b border-zinc-100 py-4 pr-4 align-top"><div className="font-semibold">{r.qty}</div><div className="mt-1 text-xs text-zinc-500">({r.ready} พร้อมใช้)</div></td>
                        <td className="border-b border-zinc-100 py-4 pr-4 align-top">{r.pricePerDay.toLocaleString()} ฿</td>
                        <td className="border-b border-zinc-100 py-4 text-right align-top">{r.cost.toLocaleString()} ฿</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* ✅ Events + Export Excel จริง */}
        {tab === "events" && (
          <>
            <div className="mb-4 text-sm text-zinc-500">แสดง {filteredEvents.length} จาก {eventReportRows.length} Events</div>
            <Card title="รายงาน Events" right={<ExportButton onClick={handleExport} />}>
              <div className="rounded-2xl border border-zinc-200 bg-white divide-y divide-zinc-200">
                {filteredEvents.map(e => (
                  <div key={e.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0"><div className="text-sm font-semibold text-zinc-900">{e.title}</div><div className="mt-1 text-xs text-zinc-500">{e.company}</div></div>
                      <StatusPill tone={e.status.tone} text={e.status.text} />
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="text-sm text-zinc-700"><div className="text-xs text-zinc-400">วันที่:</div><div className="mt-1 font-medium">{e.date}</div></div>
                      <div className="text-sm text-zinc-700"><div className="text-xs text-zinc-400">รายได้:</div><div className="mt-1 font-semibold">{e.revenue.toLocaleString()} ฿</div></div>
                      <div className="text-sm text-zinc-700 md:text-right"><div className="text-xs text-zinc-400">อุปกรณ์:</div><div className="mt-1 font-medium">{e.equipmentCount} รายการ</div></div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <ActionDocButton label="ใบแจ้งหนี้" onClick={() => onOpenInvoice(e.id)} />
                      <ActionDocButton label="ใบเสนอราคา" onClick={() => onOpenQuotation(e.id)} />
                      <ActionDocButton label="ใบสั่งงาน" onClick={() => onOpenWorkOrder(e.id)} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Damage */}
        {tab === "damage" && (
          <Card title="รายงานความเสียหาย" right={<ExportButton onClick={handleExport} />}>
            {filteredDamage.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-100"><CheckCircle2 className="h-7 w-7 text-emerald-600" /></div>
                  <div className="mt-4 text-sm font-semibold text-zinc-900">ไม่พบรายงานความเสียหาย</div>
                  <div className="mt-1 text-sm text-zinc-500">อุปกรณ์ทั้งหมดอยู่ในสภาพดี</div>
                </div>
              </div>
            ) : <div className="text-sm text-zinc-500">มีรายการความเสียหาย</div>}
          </Card>
        )}

        {/* ✅ Docs + Export Excel จริง */}
        {tab === "docs" && (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm text-zinc-500">แสดง {filteredDocs.length} จาก {docsRows.length} เอกสาร</div>
              <button onClick={onAddDoc} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700">
                <FilePlus className="h-4 w-4" />เพิ่มเอกสาร
              </button>
            </div>
            <Card title="เอกสาร" right={<ExportButton onClick={handleExport} />}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-zinc-500">
                      <th className="border-b border-zinc-200 py-3 pr-4">เอกสาร</th>
                      <th className="border-b border-zinc-200 py-3 pr-4">หมวดหมู่</th>
                      <th className="border-b border-zinc-200 py-3 pr-4">Event / บริษัท</th>
                      <th className="border-b border-zinc-200 py-3 pr-4">คำอธิบาย</th>
                      <th className="border-b border-zinc-200 py-3 pr-4">วันที่อัปโหลด</th>
                      <th className="border-b border-zinc-200 py-3 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-zinc-900">
                    {filteredDocs.map(d => (
                      <tr key={d.id} className="hover:bg-zinc-50/60">
                        <td className="border-b border-zinc-100 py-4 pr-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><FileText className="h-4 w-4" /></div>
                            <div className="min-w-0"><div className="font-semibold">{d.title}</div><div className="mt-1 text-xs text-zinc-500">{d.owner}</div></div>
                          </div>
                        </td>
                        <td className="border-b border-zinc-100 py-4 pr-4 align-top"><CategoryPill cat={d.category} /></td>
                        <td className="border-b border-zinc-100 py-4 pr-4 align-top"><div className="whitespace-pre-line text-sm text-zinc-800">{d.eventOrCompany}</div></td>
                        <td className="border-b border-zinc-100 py-4 pr-4 align-top"><div className="text-sm text-zinc-700">{d.description}</div></td>
                        <td className="border-b border-zinc-100 py-4 pr-4 align-top"><div className="text-sm text-zinc-700">{d.uploadedAt}</div></td>
                        <td className="border-b border-zinc-100 py-4 text-right align-top">
                          <div className="inline-flex items-center gap-2">
                            <button onClick={() => onViewDoc(d.id)} className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50" title="ดู"><Eye className="h-4 w-4" /></button>
                            <button onClick={() => onDownloadDoc(d.id)} className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50" title="ดาวน์โหลด"><Download className="h-4 w-4" /></button>
                            <button onClick={() => onDeleteDoc(d.id)} className="grid h-9 w-9 place-items-center rounded-2xl border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50" title="ลบ"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDocs.length === 0 && (
                      <tr><td colSpan={6} className="py-10 text-center text-sm text-zinc-500">ไม่พบเอกสารที่ค้นหา</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="h-10" />

      {/* View Doc Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/45 p-4" onClick={() => setSelectedDoc(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">รายละเอียดเอกสาร</div>
                <h3 className="mt-1 text-lg font-semibold text-zinc-900">{selectedDoc.title}</h3>
                <div className="mt-2 text-sm text-zinc-500">รหัสเอกสาร: {selectedDoc.id}</div>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ปิด</button>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-zinc-50 p-4"><div className="text-xs font-semibold text-zinc-500">หมวดหมู่</div><div className="mt-2"><CategoryPill cat={selectedDoc.category} /></div></div>
              <div className="rounded-xl bg-zinc-50 p-4"><div className="text-xs font-semibold text-zinc-500">ทีมผู้รับผิดชอบ</div><div className="mt-2 text-sm font-medium text-zinc-900">{selectedDoc.owner}</div></div>
              <div className="rounded-xl bg-zinc-50 p-4"><div className="text-xs font-semibold text-zinc-500">วันที่อัปโหลด</div><div className="mt-2 text-sm font-medium text-zinc-900">{selectedDoc.uploadedAt}</div></div>
              <div className="rounded-xl bg-zinc-50 p-4"><div className="text-xs font-semibold text-zinc-500">ขนาดไฟล์</div><div className="mt-2 text-sm font-medium text-zinc-900">{selectedDoc.sizeLabel}</div></div>
            </div>
            <div className="mt-4 rounded-xl bg-zinc-50 p-4"><div className="text-xs font-semibold text-zinc-500">Event / บริษัท</div><div className="mt-2 whitespace-pre-line text-sm text-zinc-900">{selectedDoc.eventOrCompany}</div></div>
            <div className="mt-4 rounded-xl bg-zinc-50 p-4"><div className="text-xs font-semibold text-zinc-500">คำอธิบาย</div><div className="mt-2 text-sm text-zinc-900">{selectedDoc.description}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

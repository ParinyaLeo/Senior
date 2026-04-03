"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Package,
  CheckCircle2,
  Clock3,
  Wrench,
  Search,
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  X,
} from "lucide-react";
import type { Role } from "../AppShell";
import type { StockRow, ItemStatus, Category } from "../AppShell";

// ─── Master Data: หมวดหมู่ ────────────────────────────────────────────────────
const SYSTEM_OPTIONS = [
  "ระบบแสง",
  "ระบบเสียง",
  "ภาพ/โปรเจคเตอร์",
  "เวที",
  "เฟอร์นิเจอร์",
  "ตกแต่ง",
  "ไฟฟ้า/พลังงาน",
  "ระบบ AV",
  "อุปกรณ์สื่อสาร",
  "อุปกรณ์ความปลอดภัย",
  "อื่นๆ",
];

// ─── Searchable Dropdown: หมวดหมู่ ───────────────────────────────────────────
function SystemDropdown({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(""); // query สำหรับกรอง — ว่างเมื่อปิด
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ปิด dropdown เมื่อคลิกนอก
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) closeDropdown();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdown();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const openDropdown = () => {
    setQuery(""); // reset คำค้นหาทุกครั้งที่เปิด
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeDropdown = () => {
    setOpen(false);
    setQuery("");
  };

  // เลือกแล้วปิดทันที
  const select = (opt: string) => {
    onChange(opt);
    closeDropdown();
  };

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) return SYSTEM_OPTIONS;
    return SYSTEM_OPTIONS.filter((o) => o.toLowerCase().includes(kw));
  }, [query]);

  return (
    <div ref={ref} className="relative">
      {/* แสดงค่าที่เลือกอยู่ + ปุ่มเปิด dropdown */}
      <button
        type="button"
        onClick={() => open ? closeDropdown() : openDropdown()}
        className={[
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-zinc-50 px-3 text-left",
          error
            ? "border-red-300 ring-2 ring-red-100"
            : open
            ? "border-zinc-400 ring-2 ring-zinc-200"
            : "border-zinc-200 hover:border-zinc-300",
        ].join(" ")}
      >
        <span className={value ? "text-sm text-zinc-900" : "text-sm text-zinc-400"}>
          {value || "เลือกหมวดหมู่..."}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[200] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
          {/* Search input อยู่ใน dropdown */}
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาหมวดหมู่..."
              className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-zinc-300 hover:text-zinc-500">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-5 text-center">
              <span className="text-sm text-zinc-400">ไม่พบหมวดหมู่ที่ค้นหา</span>
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => select(query.trim())}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  + เพิ่ม "{query.trim()}" เป็นหมวดหมู่ใหม่
                </button>
              )}
            </div>
          ) : (
            <ul className="max-h-52 overflow-auto py-1">
              {filtered.map((opt) => {
                const active = opt === value;
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => select(opt)}
                      className={[
                        "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition",
                        active ? "bg-blue-50 font-semibold text-blue-700" : "text-zinc-700 hover:bg-zinc-50",
                      ].join(" ")}
                    >
                      {/* dot แทน checkbox — กดเลือกแล้วปิดทันที ไม่มี toggle */}
                      <span className={[
                        "flex h-2 w-2 shrink-0 rounded-full",
                        active ? "bg-blue-500" : "bg-transparent",
                      ].join(" ")} />
                      {opt}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
}

// ─── Modal: Confirm Delete ────────────────────────────────────────────────────
function ConfirmDeleteModal({
  open,
  itemName,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="p-6">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>

            {/* Text */}
            <div className="mt-4 text-center">
              <div className="text-base font-semibold text-zinc-900">ยืนยันการลบอุปกรณ์</div>
              <div className="mt-2 text-sm text-zinc-500">
                คุณต้องการลบ{" "}
                <span className="font-semibold text-zinc-800">"{itemName}"</span>{" "}
                ใช่หรือไม่?
              </div>
              <div className="mt-1 text-xs text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 h-10 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 h-10 rounded-xl bg-red-600 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Pill({ children, tone }: { children: React.ReactNode; tone: "blue" | "green" | "amber" | "zinc" }) {
  const map = { blue: "bg-blue-100 text-blue-700 ring-1 ring-blue-200", green: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200", amber: "bg-amber-100 text-amber-700 ring-1 ring-amber-200", zinc: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200" } as const;
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

function StatCard({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: "neutral" | "emerald" | "violet" | "red" }) {
  const toneMap = { neutral: "bg-zinc-100 text-zinc-700", emerald: "bg-emerald-100 text-emerald-700", violet: "bg-violet-100 text-violet-700", red: "bg-red-100 text-red-700" } as const;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneMap[tone]}`}>{icon}</div>
        <div><div className="text-xl font-semibold text-zinc-900">{value}</div><div className="text-sm text-zinc-500">{label}</div></div>
      </div>
    </div>
  );
}

function fmt(n: number) { return new Intl.NumberFormat("th-TH").format(n); }

function Field({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">{label} {required ? <span className="text-red-600">*</span> : null}</div>
      {children}
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}

// ─── Modal: Stock Detail ──────────────────────────────────────────────────────
function StockDetailModal({ item, onClose }: { item: StockRow | null; onClose: () => void }) {
  if (!item) return null;
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const statusTone = item.status === "พร้อมใช้" ? "green" : item.status === "ใช้งานอยู่" ? "blue" : "amber";
  const catTone = item.category === "ไฟฟ้า" ? "amber" : "zinc";
  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div><div className="text-lg font-semibold text-zinc-900">รายละเอียดอุปกรณ์</div><div className="mt-1 text-sm text-zinc-500">{item.name}</div></div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"><X className="h-4 w-4" /></button>
          </div>
          <div className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><div className="mb-2 text-xs font-semibold text-zinc-500">รหัสอุปกรณ์</div><div className="flex gap-2"><Pill tone="blue">{item.id}</Pill><Pill tone="blue">{item.code}</Pill></div></div>
              <div><div className="mb-2 text-xs font-semibold text-zinc-500">สถานะ</div><Pill tone={statusTone as any}>{item.status}</Pill></div>
              <div><div className="mb-2 text-xs font-semibold text-zinc-500">ชื่ออุปกรณ์</div><div className="font-semibold text-zinc-900">{item.name}</div></div>
              <div><div className="mb-2 text-xs font-semibold text-zinc-500">ยี่ห้อ</div><div className="text-zinc-800">{item.brand}</div></div>
              <div><div className="mb-2 text-xs font-semibold text-zinc-500">ประเภท</div><div className="flex gap-2 items-center"><Pill tone={catTone as any}>{item.category}</Pill><span className="text-zinc-500">{item.system}</span></div></div>
              <div><div className="mb-2 text-xs font-semibold text-zinc-500">โซนจัดเก็บ</div><Pill tone="blue">{item.zone}</Pill></div>
              <div><div className="mb-2 text-xs font-semibold text-zinc-500">จำนวนรวม</div><div className="text-lg font-semibold text-zinc-900">{fmt(item.qty)} ยูนิต</div></div>
              <div><div className="mb-2 text-xs font-semibold text-zinc-500">จำนวนพร้อมใช้</div><div className="text-lg font-semibold text-emerald-600">{fmt(item.available)} ยูนิต</div></div>
              <div><div className="mb-2 text-xs font-semibold text-zinc-500">ค่าเช่า/วัน</div><div className="text-lg font-semibold text-zinc-900">{fmt(item.pricePerDay)} ฿</div></div>
              <div><div className="mb-2 text-xs font-semibold text-zinc-500">ราคาต้นทุน</div><div className="text-lg font-semibold text-zinc-900">{fmt(item.cost)} ฿</div></div>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <div className="mb-3 text-xs font-semibold text-zinc-700">สรุปการใช้งาน</div>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-2xl font-bold text-zinc-900">{fmt(item.available)}</div><div className="text-xs text-zinc-500">พร้อมใช้</div></div>
                <div><div className="text-2xl font-bold text-violet-600">{fmt(item.qty - item.available)}</div><div className="text-xs text-zinc-500">ใช้งานอยู่</div></div>
                <div><div className="text-2xl font-bold text-zinc-900">{fmt(item.qty)}</div><div className="text-xs text-zinc-500">รวมทั้งหมด</div></div>
              </div>
            </div>
            <div className="flex justify-end"><button onClick={onClose} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ปิด</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Add New Stock ─────────────────────────────────────────────────────
type AddForm = { id: string; status: ItemStatus; name: string; brand: string; category: Category; typeLabel: string; zone: string; qty: string; pricePerDay: string; cost: string; };

function AddStockModal({ open, onClose, onAdd, nextId }: { open: boolean; onClose: () => void; onAdd: (row: StockRow) => void; nextId: string }) {
  const [form, setForm] = useState<AddForm>({ id: nextId, status: "พร้อมใช้", name: "", brand: "", category: "ไฟฟ้า", typeLabel: "ระบบแสง", zone: "โซน A", qty: "", pricePerDay: "", cost: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => { if (!open) return; setForm((s) => ({ ...s, id: nextId })); setErrors({}); }, [open, nextId]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.id.trim()) e.id = "กรุณากรอกรหัส";
    if (!form.name.trim()) e.name = "กรุณากรอกชื่ออุปกรณ์";
    if (!form.brand.trim()) e.brand = "กรุณากรอกยี่ห้อ";
    if (!form.zone.trim()) e.zone = "กรุณาเลือกโซน";
    if (!form.qty.trim()) e.qty = "กรุณาระบุจำนวน";
    if (form.qty.trim() && (Number.isNaN(Number(form.qty)) || Number(form.qty) <= 0)) e.qty = "จำนวนต้องเป็นตัวเลขมากกว่า 0";
    if (!form.pricePerDay.trim()) e.pricePerDay = "กรุณาระบุค่าเช่า/วัน";
    if (form.pricePerDay.trim() && (Number.isNaN(Number(form.pricePerDay)) || Number(form.pricePerDay) < 0)) e.pricePerDay = "ค่าเช่าต้องเป็นตัวเลข";
    if (!form.cost.trim()) e.cost = "กรุณาระบุราคาต้นทุน";
    if (form.cost.trim() && (Number.isNaN(Number(form.cost)) || Number(form.cost) < 0)) e.cost = "ราคาต้นทุนต้องเป็นตัวเลข";
    if (!form.typeLabel.trim()) e.typeLabel = "กรุณาเลือกหมวดหมู่";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const qty = Number(form.qty);
    const codePrefix = form.category === "ไฟฟ้า" ? "LT" : form.category === "ผ้าใบ" ? "ST" : "GR";
    onAdd({ id: form.id.trim(), code: `${codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`, name: form.name.trim(), brand: form.brand.trim(), category: form.category, system: form.typeLabel.trim(), zone: form.zone, status: form.status, qty, available: qty, pricePerDay: Number(form.pricePerDay), cost: Number(form.cost) });
    onClose();
  };

  if (!open) return null;
  const inp = (err?: string) => ["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", err ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ");

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div><div className="text-lg font-semibold text-zinc-900">เพิ่มอุปกรณ์ใหม่</div><div className="mt-1 text-sm text-zinc-500">กรอกข้อมูลอุปกรณ์</div></div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"><X className="h-4 w-4" /></button>
          </div>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="รหัส" required error={errors.id}><input value={form.id} onChange={(e) => setForm((s) => ({ ...s, id: e.target.value }))} placeholder="EQ-001" className={inp(errors.id)} /></Field>
              <Field label="สถานะ" required>
                <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as ItemStatus }))} className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="พร้อมใช้">พร้อมใช้</option><option value="ใช้งานอยู่">ใช้งานอยู่</option><option value="ซ่อมแซม">ซ่อมแซม</option>
                </select>
              </Field>
              <Field label="ชื่ออุปกรณ์" required error={errors.name}><input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="ชื่ออุปกรณ์" className={inp(errors.name)} /></Field>
              <Field label="ยี่ห้อ" required error={errors.brand}><input value={form.brand} onChange={(e) => setForm((s) => ({ ...s, brand: e.target.value }))} placeholder="ยี่ห้อ" className={inp(errors.brand)} /></Field>
              <Field label="โซน" required error={errors.zone}>
                <select value={form.zone} onChange={(e) => setForm((s) => ({ ...s, zone: e.target.value }))} className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="โซน A">โซน A</option><option value="โซน B">โซน B</option><option value="โซน C">โซน C</option>
                </select>
              </Field>
              <Field label="ประเภท" required>
                <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as Category }))} className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="ไฟฟ้า">ไฟฟ้า</option><option value="ผ้าใบ">ผ้าใบ</option><option value="ตกแต่ง">ตกแต่ง</option>
                </select>
              </Field>
              <Field label="จำนวน" required error={errors.qty}><input value={form.qty} onChange={(e) => setForm((s) => ({ ...s, qty: e.target.value }))} placeholder="ระบุจำนวน" className={inp(errors.qty)} /></Field>
              <Field label="ค่าเช่า/วัน (บาท)" required error={errors.pricePerDay}><input value={form.pricePerDay} onChange={(e) => setForm((s) => ({ ...s, pricePerDay: e.target.value }))} placeholder="ระบุค่าเช่าต่อวัน" className={inp(errors.pricePerDay)} /></Field>
              <Field label="ราคาต้นทุน (บาท)" required error={errors.cost}><input value={form.cost} onChange={(e) => setForm((s) => ({ ...s, cost: e.target.value }))} placeholder="ระบุราคาต้นทุน" className={inp(errors.cost)} /></Field>

              {/* ✅ หมวดหมู่ Searchable Dropdown */}
              <Field label="หมวดหมู่" required error={errors.typeLabel}>
                <SystemDropdown value={form.typeLabel} onChange={(v) => setForm((s) => ({ ...s, typeLabel: v }))} error={errors.typeLabel} />
              </Field>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={onClose} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ยกเลิก</button>
              <button onClick={submit} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">เพิ่ม</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Edit Stock ────────────────────────────────────────────────────────
type EditForm = { status: ItemStatus; name: string; brand: string; category: Category; typeLabel: string; zone: string; qty: string; available: string; pricePerDay: string; cost: string; };

function EditStockModal({ open, item, onClose, onUpdate }: { open: boolean; item: StockRow | null; onClose: () => void; onUpdate: (updatedItem: StockRow) => void }) {
  const [form, setForm] = useState<EditForm>({ status: "พร้อมใช้", name: "", brand: "", category: "ไฟฟ้า", typeLabel: "ระบบแสง", zone: "โซน A", qty: "", available: "", pricePerDay: "", cost: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open || !item) return;
    setForm({ status: item.status, name: item.name, brand: item.brand, category: item.category, typeLabel: item.system, zone: item.zone, qty: String(item.qty), available: String(item.available), pricePerDay: String(item.pricePerDay), cost: String(item.cost) });
    setErrors({});
  }, [open, item]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "กรุณากรอกชื่ออุปกรณ์";
    if (!form.brand.trim()) e.brand = "กรุณากรอกยี่ห้อ";
    if (!form.zone.trim()) e.zone = "กรุณาเลือกโซน";
    if (!form.qty.trim()) e.qty = "กรุณาระบุจำนวน";
    if (form.qty.trim() && (Number.isNaN(Number(form.qty)) || Number(form.qty) <= 0)) e.qty = "จำนวนต้องเป็นตัวเลขมากกว่า 0";
    if (!form.available.trim()) e.available = "กรุณาระบุจำนวนพร้อมใช้";
    if (form.available.trim() && (Number.isNaN(Number(form.available)) || Number(form.available) < 0)) e.available = "จำนวนพร้อมใช้ต้องเป็นตัวเลข";
    if (form.available.trim() && form.qty.trim() && Number(form.available) > Number(form.qty)) e.available = "จำนวนพร้อมใช้ต้องไม่เกินจำนวนรวม";
    if (!form.pricePerDay.trim()) e.pricePerDay = "กรุณาระบุค่าเช่า/วัน";
    if (form.pricePerDay.trim() && (Number.isNaN(Number(form.pricePerDay)) || Number(form.pricePerDay) < 0)) e.pricePerDay = "ค่าเช่าต้องเป็นตัวเลข";
    if (!form.cost.trim()) e.cost = "กรุณาระบุราคาต้นทุน";
    if (form.cost.trim() && (Number.isNaN(Number(form.cost)) || Number(form.cost) < 0)) e.cost = "ราคาต้นทุนต้องเป็นตัวเลข";
    if (!form.typeLabel.trim()) e.typeLabel = "กรุณาเลือกหมวดหมู่";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate() || !item) return;
    onUpdate({ ...item, name: form.name.trim(), brand: form.brand.trim(), category: form.category, system: form.typeLabel.trim(), zone: form.zone, status: form.status, qty: Number(form.qty), available: Number(form.available), pricePerDay: Number(form.pricePerDay), cost: Number(form.cost) });
    onClose();
  };

  if (!open || !item) return null;
  const inp = (err?: string) => ["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", err ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ");

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div><div className="text-lg font-semibold text-zinc-900">แก้ไขอุปกรณ์</div><div className="mt-1 text-sm text-zinc-500">{item.name}</div></div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"><X className="h-4 w-4" /></button>
          </div>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="รหัส" required>
                <input disabled value={item.id} className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-sm text-zinc-500 outline-none" />
              </Field>
              <Field label="สถานะ" required>
                <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as ItemStatus }))} className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="พร้อมใช้">พร้อมใช้</option><option value="ใช้งานอยู่">ใช้งานอยู่</option><option value="ซ่อมแซม">ซ่อมแซม</option>
                </select>
              </Field>
              <Field label="ชื่ออุปกรณ์" required error={errors.name}><input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="ชื่ออุปกรณ์" className={inp(errors.name)} /></Field>
              <Field label="ยี่ห้อ" required error={errors.brand}><input value={form.brand} onChange={(e) => setForm((s) => ({ ...s, brand: e.target.value }))} placeholder="ยี่ห้อ" className={inp(errors.brand)} /></Field>
              <Field label="โซน" required error={errors.zone}>
                <select value={form.zone} onChange={(e) => setForm((s) => ({ ...s, zone: e.target.value }))} className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="โซน A">โซน A</option><option value="โซน B">โซน B</option><option value="โซน C">โซน C</option>
                </select>
              </Field>
              <Field label="ประเภท" required>
                <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as Category }))} className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="ไฟฟ้า">ไฟฟ้า</option><option value="ผ้าใบ">ผ้าใบ</option><option value="ตกแต่ง">ตกแต่ง</option>
                </select>
              </Field>
              <Field label="จำนวนรวม" required error={errors.qty}><input value={form.qty} onChange={(e) => setForm((s) => ({ ...s, qty: e.target.value }))} placeholder="ระบุจำนวน" className={inp(errors.qty)} /></Field>
              <Field label="จำนวนพร้อมใช้" required error={errors.available}><input value={form.available} onChange={(e) => setForm((s) => ({ ...s, available: e.target.value }))} placeholder="ระบุจำนวนพร้อมใช้" className={inp(errors.available)} /></Field>
              <Field label="ค่าเช่า/วัน (บาท)" required error={errors.pricePerDay}><input value={form.pricePerDay} onChange={(e) => setForm((s) => ({ ...s, pricePerDay: e.target.value }))} placeholder="ระบุค่าเช่าต่อวัน" className={inp(errors.pricePerDay)} /></Field>
              <Field label="ราคาต้นทุน (บาท)" required error={errors.cost}><input value={form.cost} onChange={(e) => setForm((s) => ({ ...s, cost: e.target.value }))} placeholder="ระบุราคาต้นทุน" className={inp(errors.cost)} /></Field>

              {/* ✅ หมวดหมู่ Searchable Dropdown — เต็ม 2 คอลัมน์ */}
              <div className="md:col-span-2">
                <Field label="หมวดหมู่" required error={errors.typeLabel}>
                  <SystemDropdown value={form.typeLabel} onChange={(v) => setForm((s) => ({ ...s, typeLabel: v }))} error={errors.typeLabel} />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={onClose} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ยกเลิก</button>
              <button onClick={submit} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">บันทึก</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Stock({ role, stockData, onStockChange }: { role: Role; stockData: StockRow[]; onStockChange: (updater: StockRow[] | ((prev: StockRow[]) => StockRow[])) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ทั้งหมด" | ItemStatus>("ทั้งหมด");
  const [category, setCategory] = useState<"ทั้งหมด" | Category>("ทั้งหมด");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<StockRow | null>(null);
  const [editItem, setEditItem] = useState<StockRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<StockRow | null>(null);

  const rows = useMemo(() => stockData.filter((r) => {
    const hitQ = q.trim().length === 0 || [r.id, r.code, r.name, r.brand, r.system, r.zone].some((x) => x.toLowerCase().includes(q.toLowerCase()));
    return hitQ && (status === "ทั้งหมด" || r.status === status) && (category === "ทั้งหมด" || r.category === category);
  }), [q, status, category, stockData]);

  const stats = useMemo(() => ({
    total: stockData.reduce((s, r) => s + r.qty, 0),
    ready: stockData.reduce((s, r) => s + r.available, 0),
    inUse: stockData.reduce((s, r) => s + (r.qty - r.available), 0),
    repair: stockData.filter((r) => r.status === "ซ่อมแซม").length,
  }), [stockData]);

  const showEdit = role !== "SA";
  const showDelete = role === "Manager";

  const nextId = useMemo(() => {
    let max = 0;
    for (const r of stockData) { const m = r.id.match(/^EQ(\d+)$/); if (m) max = Math.max(max, Number(m[1])); }
    return `EQ-${String(max + 1).padStart(3, "0")}`;
  }, [stockData]);

  const handleAdd = (row: StockRow) => { onStockChange((prev) => [{ ...row, id: row.id.replace("-", "") }, ...prev]); };
  const handleDelete = (id: string) => { onStockChange((prev) => prev.filter((r) => r.id !== id)); setDeleteItem(null); };
  const handleUpdate = (updated: StockRow) => { onStockChange((prev) => prev.map((r) => r.id === updated.id ? updated : r)); setEditItem(null); };

  return (
    <div className="px-6 py-8">
      <AddStockModal open={isAddOpen} onClose={() => setIsAddOpen(false)} nextId={nextId} onAdd={handleAdd} />
      <StockDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      <EditStockModal open={editItem !== null} item={editItem} onClose={() => setEditItem(null)} onUpdate={handleUpdate} />
      <ConfirmDeleteModal
        open={deleteItem !== null}
        itemName={deleteItem?.name ?? ""}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        onCancel={() => setDeleteItem(null)}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><Package className="h-5 w-5" /></div>
          <div><h1 className="text-2xl font-semibold tracking-tight text-zinc-900">จัดการ Stock</h1><p className="mt-1 text-sm text-zinc-500">ระบบจัดการและค้นหาอุปกรณ์</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"><Download className="h-4 w-4" />ส่งออก Excel</button>
          <button onClick={() => setIsAddOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Plus className="h-4 w-4" />เพิ่มใหม่</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Package className="h-5 w-5" />} value={stats.total} label="รวมทั้งหมด" tone="neutral" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} value={stats.ready} label="พร้อมใช้" tone="emerald" />
        <StatCard icon={<Clock3 className="h-5 w-5" />} value={stats.inUse} label="ใช้งานอยู่" tone="violet" />
        <StatCard icon={<Wrench className="h-5 w-5" />} value={stats.repair} label="ซ่อมแซม" tone="red" />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" placeholder="ค้นหาอุปกรณ์ด้วย ชื่อ, รหัส..." />
          </div>
          <div className="relative md:w-[220px]">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="h-[52px] w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-800 shadow-sm outline-none hover:bg-zinc-50">
              <option value="ทั้งหมด">สถานะทั้งหมด</option><option value="พร้อมใช้">พร้อมใช้</option><option value="ใช้งานอยู่">ใช้งานอยู่</option><option value="ซ่อมแซม">ซ่อมแซม</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>
          <div className="relative md:w-[220px]">
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="h-[52px] w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-800 shadow-sm outline-none hover:bg-zinc-50">
              <option value="ทั้งหมด">ประเภททั้งหมด</option><option value="ไฟฟ้า">ไฟฟ้า</option><option value="ผ้าใบ">ผ้าใบ</option><option value="ตกแต่ง">ตกแต่ง</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>
      </div>

      <div className="mt-5 text-sm text-zinc-500">แสดง {rows.length} จาก {stockData.length} รายการ</div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-white">
              <tr className="border-b border-zinc-200 text-left text-xs font-semibold text-zinc-500">
                <th className="px-6 py-4">ID / รหัส</th><th className="px-6 py-4">ชื่ออุปกรณ์</th><th className="px-6 py-4">ยี่ห้อ</th>
                <th className="px-6 py-4">ประเภท</th><th className="px-6 py-4">จัดเก็บ</th><th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-center">จำนวน</th><th className="px-6 py-4 text-center">ค่าเช่า/วัน</th>
                <th className="px-6 py-4 text-center">ราคาต้นทุน</th><th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm text-zinc-800">
              {rows.map((r, idx) => {
                const catTone = r.category === "ไฟฟ้า" ? "amber" : "zinc";
                const statusTone = r.status === "พร้อมใช้" ? "green" : r.status === "ใช้งานอยู่" ? "blue" : "amber";
                return (
                  <tr key={`${r.id}-${idx}`} className={idx % 2 ? "bg-zinc-50/30" : "bg-white"}>
                    <td className="px-6 py-5"><div className="flex items-center gap-2"><Pill tone="blue">{r.id}</Pill><Pill tone="blue">{r.code}</Pill></div></td>
                    <td className="px-6 py-5"><div className="font-semibold text-zinc-900">{r.name}</div></td>
                    <td className="px-6 py-5">{r.brand}</td>
                    <td className="px-6 py-5"><div className="flex items-center gap-2"><Pill tone={catTone as any}>{r.category}</Pill><span className="text-zinc-500">{r.system}</span></div></td>
                    <td className="px-6 py-5"><Pill tone="blue">{r.zone}</Pill></td>
                    <td className="px-6 py-5"><Pill tone={statusTone as any}>{r.status}</Pill></td>
                    <td className="px-6 py-5 text-center"><div className="font-semibold">{fmt(r.qty)}</div><div className="text-xs text-zinc-500">({fmt(r.available)} พร้อมใช้)</div></td>
                    <td className="px-6 py-5 text-center">{fmt(r.pricePerDay)} ฿</td>
                    <td className="px-6 py-5 text-center">{fmt(r.cost)} ฿</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setDetailItem(r)} className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50" title="ดู"><Eye className="h-4 w-4" /></button>
                        {showEdit && <button onClick={() => setEditItem(r)} className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50" title="แก้ไข"><Pencil className="h-4 w-4" /></button>}
                        {showDelete && <button onClick={() => setDeleteItem(r)} className="grid h-9 w-9 place-items-center rounded-2xl border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50" title="ลบ"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="h-10" />
    </div>
  );
}

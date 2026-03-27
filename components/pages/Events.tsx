"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Clock3,
  ThumbsUp,
  CheckCircle2,
  Search,
  Eye,
  Trash2,
  CalendarDays,
  List,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Boxes,
  ChevronDown,
  Building2,
  MapPin,
  User,
  Users,
  Wallet,
  CalendarRange,
  ClipboardList,
} from "lucide-react";
import type { StockRow } from "../AppShell";

type Role = "SA" | "Manager" | "Stockkeeper";
type StatusTone = "success" | "pending" | "progress" | "rejected";

type EventItem = {
  id: string;
  title: string;
  status: { text: string; tone: StatusTone };
  code: string;
  desc: string;
  company: string;
  place: string;
  date: string;
  items: string;
  organizer?: string;
  branchCode?: string;
  budgetTHB?: number;
  attendees?: number;
};

// ✅ ใช้ข้อมูลจาก StockRow แทน hardcode
type SelectedEquipment = {
  name: string;
  qty: number;
  available: number;
  category: string;
  pricePerDayTHB: number;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timeISO: string;
  createdAt?: string;
  audience: Role[];
  unreadFor: Role[];
};

function StatCard({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: "neutral" | "amber" | "emerald" | "sky" }) {
  const toneMap = { neutral: "bg-zinc-100 text-zinc-700", amber: "bg-amber-100 text-amber-700", emerald: "bg-emerald-100 text-emerald-700", sky: "bg-sky-100 text-sky-700" } as const;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneMap[tone]}`}>{icon}</div>
        <div>
          <div className="text-xl font-semibold text-zinc-900">{value}</div>
          <div className="text-sm text-zinc-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ tone, text }: { tone: StatusTone; text: string }) {
  const cls = tone === "success" ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
    : tone === "pending" ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
    : tone === "progress" ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
    : "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{text}</span>;
}

function formatMonthThai(d: Date) {
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  return `${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function pad2(n: number) { return n.toString().padStart(2, "0"); }
function toYMD(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function toDateLocal(ymd: string) { const [y, m, d] = ymd.split("-").map(Number); return new Date(y, m - 1, d); }
function parseDateRange(range: string) { const [startStr, endStr] = range.split(" - ").map((s) => s.trim()); return { startStr, endStr }; }
function DayLegendDot({ cls, label }: { cls: string; label: string }) {
  return <div className="flex items-center gap-2 text-sm text-zinc-600"><span className={`h-2.5 w-2.5 rounded-full ${cls}`} /><span>{label}</span></div>;
}
function formatTHB(n: number) { return new Intl.NumberFormat("th-TH").format(n); }
function getCalendarEventToneClass(tone: StatusTone) {
  if (tone === "pending") return "border-l-amber-500 bg-amber-50 text-amber-700";
  if (tone === "success") return "border-l-emerald-500 bg-emerald-50 text-emerald-700";
  if (tone === "progress") return "border-l-violet-500 bg-violet-50 text-violet-700";
  return "border-l-rose-500 bg-rose-50 text-rose-700";
}

/** ========= Modal: Create New Event ========= */
type CreateForm = { eventName: string; companyName: string; organizerName: string; branchCode: string; budgetTHB: string; description: string; attendees: string; venue: string; startDate: string; endDate: string; };

function Input({ label, required, value, onChange, placeholder, type = "text", error }: { label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string; }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">{label} {required ? <span className="text-red-600">*</span> : null}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder}
        className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", error ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}

function CompanyDropdown({ label, required, value, onChange, placeholder, options, error }: { label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; options: string[]; error?: string; }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!open || !ref.current) return; if (!ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", onDown); window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);
  const filtered = useMemo(() => { const needle = value.trim().toLowerCase(); if (!needle) return options; return options.filter((opt) => opt.toLowerCase().includes(needle)); }, [options, value]);
  return (
    <div ref={ref} className="relative">
      <div className="mb-1 text-xs font-semibold text-zinc-700">{label} {required ? <span className="text-red-600">*</span> : null}</div>
      <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} type="text" placeholder={placeholder}
        className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 pr-9 text-sm text-zinc-900 outline-none", error ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
      <button type="button" onClick={() => setOpen((v) => !v)} className="absolute inset-y-0 right-2 grid place-items-center text-zinc-400 hover:text-zinc-600" aria-label="Toggle">
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="max-h-56 overflow-auto py-1">
            {filtered.length === 0 ? <div className="px-3 py-2 text-sm text-zinc-500">No companies found</div>
              : filtered.map((opt) => (
                <button type="button" key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50">
                  <span className="truncate">{opt}</span>
                  {opt === value ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
                </button>
              ))}
          </div>
        </div>
      )}
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">{label}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-20 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200" />
    </div>
  );
}

function CreateEventModal({ open, onClose, onCreate, companyOptions }: {
  open: boolean; onClose: () => void;
  onCreate: (payload: { title: string; company: string; organizer: string; branchCode?: string; budgetTHB?: number; desc?: string; attendees?: number; place: string; startDate: string; endDate: string; }) => void;
  companyOptions: string[];
}) {
  const [form, setForm] = useState<CreateForm>({ eventName: "", companyName: "", organizerName: "", branchCode: "", budgetTHB: "", description: "", attendees: "", venue: "", startDate: "", endDate: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reset = () => { setForm({ eventName: "", companyName: "", organizerName: "", branchCode: "", budgetTHB: "", description: "", attendees: "", venue: "", startDate: "", endDate: "" }); setErrors({}); };
  const close = () => { reset(); onClose(); };
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.eventName.trim()) e.eventName = "กรุณากรอกชื่อ Event";
    if (!form.companyName.trim()) e.companyName = "กรุณากรอกชื่อบริษัท";
    if (!form.organizerName.trim()) e.organizerName = "กรุณากรอกชื่อผู้จัด";
    if (!form.budgetTHB.trim()) e.budgetTHB = "กรุณากรอกงบประมาณ";
    if (form.budgetTHB.trim() && Number.isNaN(Number(form.budgetTHB))) e.budgetTHB = "งบประมาณต้องเป็นตัวเลข";
    if (!form.venue.trim()) e.venue = "กรุณากรอกสถานที่";
    if (!form.startDate) e.startDate = "กรุณาเลือกวันเริ่ม";
    if (!form.endDate) e.endDate = "กรุณาเลือกวันจบ";
    if (form.startDate && form.endDate && toDateLocal(form.startDate) > toDateLocal(form.endDate)) e.endDate = "วันจบต้องไม่ก่อนวันเริ่ม";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const submit = () => {
    if (!validate()) return;
    onCreate({ title: form.eventName.trim(), company: form.companyName.trim(), organizer: form.organizerName.trim(), branchCode: form.branchCode.trim() || undefined, budgetTHB: form.budgetTHB.trim() ? Number(form.budgetTHB) : undefined, desc: form.description.trim() || undefined, attendees: form.attendees.trim() ? Number(form.attendees) : undefined, place: form.venue.trim(), startDate: form.startDate, endDate: form.endDate });
    close();
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div><div className="text-lg font-semibold text-zinc-900">Create New Event</div><div className="mt-1 text-sm text-zinc-500">Fill in Event details and select required equipment</div></div>
            <button onClick={close} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" title="Close"><X className="h-4 w-4" /></button>
          </div>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Event Name" required value={form.eventName} onChange={(v) => setForm((s) => ({ ...s, eventName: v }))} error={errors.eventName} />
              <CompanyDropdown label="Company Name" required value={form.companyName} onChange={(v) => setForm((s) => ({ ...s, companyName: v }))} placeholder="Select or type a company" options={companyOptions} error={errors.companyName} />
            </div>
            <div className="mt-4"><Input label="Organizer Name" required value={form.organizerName} onChange={(v) => setForm((s) => ({ ...s, organizerName: v }))} placeholder="Organizer's full name" error={errors.organizerName} /></div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Branch Code" value={form.branchCode} onChange={(v) => setForm((s) => ({ ...s, branchCode: v }))} placeholder="Branch code (optional)" />
              <Input label="Budget (THB)" required value={form.budgetTHB} onChange={(v) => setForm((s) => ({ ...s, budgetTHB: v }))} placeholder="Enter budget amount" error={errors.budgetTHB} />
            </div>
            <div className="mt-4"><TextArea label="Description" value={form.description} onChange={(v) => setForm((s) => ({ ...s, description: v }))} /></div>
            <div className="mt-4"><Input label="Number of Attendees" value={form.attendees} onChange={(v) => setForm((s) => ({ ...s, attendees: v }))} placeholder="Enter number of attendees" /></div>
            <div className="mt-4"><Input label="Venue/Location" required value={form.venue} onChange={(v) => setForm((s) => ({ ...s, venue: v }))} error={errors.venue} /></div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Event Start Date" required type="date" value={form.startDate} onChange={(v) => setForm((s) => ({ ...s, startDate: v }))} error={errors.startDate} />
              <Input label="Event End Date" required type="date" value={form.endDate} onChange={(v) => setForm((s) => ({ ...s, endDate: v }))} error={errors.endDate} />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={close} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Cancel</button>
              <button onClick={submit} className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700">Create Event</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ========= Modal: Manage Equipment ========= */
function ManageEquipmentModal({
  open, eventTitle, startDateInitial, endDateInitial, initialEquipment, stockData, onClose, onSubmitDecision,
}: {
  open: boolean; eventTitle: string; startDateInitial: string; endDateInitial: string;
  initialEquipment: SelectedEquipment[];
  stockData: StockRow[]; // ✅ รับ stockData จริงจาก AppShell
  onClose: () => void;
  onSubmitDecision: (payload: { startDate: string; endDate: string; equipment: SelectedEquipment[]; decision: "approved" | "rejected" }) => void;
}) {
  const [startDate, setStartDate] = useState(startDateInitial);
  const [endDate, setEndDate] = useState(endDateInitial);
  const [equipment, setEquipment] = useState<SelectedEquipment[]>(initialEquipment);
  const [errors, setErrors] = useState<{ startDate?: string; endDate?: string }>({});
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [qty, setQty] = useState("");
  const [selectErrors, setSelectErrors] = useState<{ name?: string; qty?: string }>({});
  const [isEquipOpen, setIsEquipOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const equipRef = useRef<HTMLDivElement | null>(null);

  // ✅ สร้าง equipmentOptions จาก stockData จริง (เฉพาะที่มี available > 0)
  const equipmentOptions = useMemo(() => {
    return stockData
      .filter((r) => r.available > 0)
      .map((r) => ({
        name: r.name,
        available: r.available,
        category: r.system,
        pricePerDayTHB: r.pricePerDay,
      }));
  }, [stockData]);

  const selectedOption = useMemo(() => equipmentOptions.find((o) => o.name === selectedName) ?? null, [equipmentOptions, selectedName]);

  useEffect(() => {
    if (!open) return;
    setStartDate(startDateInitial); setEndDate(endDateInitial); setEquipment(initialEquipment);
  }, [open, startDateInitial, endDateInitial, initialEquipment]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEquipOpen) setIsEquipOpen(false);
        else if (isSelectOpen) setIsSelectOpen(false);
        else if (isDecisionOpen) setIsDecisionOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, isSelectOpen, isEquipOpen, isDecisionOpen]);

  useEffect(() => {
    if (!isEquipOpen) return;
    const onDown = (e: MouseEvent) => { if (!equipRef.current) return; if (!equipRef.current.contains(e.target as Node)) setIsEquipOpen(false); };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [isEquipOpen]);

  const validate = () => {
    const e: { startDate?: string; endDate?: string } = {};
    if (!startDate) e.startDate = "กรุณาเลือกวันเบิกอุปกรณ์";
    if (!endDate) e.endDate = "กรุณาเลือกวันคืนอุปกรณ์";
    if (startDate && endDate && toDateLocal(startDate) > toDateLocal(endDate)) e.endDate = "วันคืนอุปกรณ์ต้องไม่ก่อนวันเบิกอุปกรณ์";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openSelect = () => { setSelectedName(""); setQty(""); setSelectErrors({}); setIsEquipOpen(false); setIsSelectOpen(true); };

  const validateSelect = () => {
    const e: { name?: string; qty?: string } = {};
    if (!selectedName) e.name = "กรุณาเลือกอุปกรณ์";
    if (!qty.trim()) e.qty = "กรุณากรอกจำนวน";
    if (qty.trim() && (Number.isNaN(Number(qty)) || Number(qty) <= 0)) e.qty = "จำนวนต้องเป็นตัวเลขมากกว่า 0";
    setSelectErrors(e);
    return Object.keys(e).length === 0;
  };

  const addSelected = () => {
    if (!validateSelect() || !selectedOption) return;
    const q = Number(qty);
    setEquipment((prev) => {
      const idx = prev.findIndex((x) => x.name === selectedOption.name);
      if (idx === -1) return [...prev, { name: selectedOption.name, qty: q, available: selectedOption.available, category: selectedOption.category, pricePerDayTHB: selectedOption.pricePerDayTHB }];
      const next = [...prev]; next[idx] = { ...next[idx], qty: next[idx].qty + q }; return next;
    });
    setIsSelectOpen(false);
  };

  const removeEquipmentAt = (idx: number) => setEquipment((prev) => prev.filter((_, i) => i !== idx));

  const totalQty = useMemo(() => equipment.reduce((sum, it) => sum + it.qty, 0), [equipment]);
  const uniqueTypes = useMemo(() => new Set(equipment.map((x) => x.name)).size, [equipment]);
  const totalCostPerDay = useMemo(() => equipment.reduce((sum, it) => sum + it.qty * it.pricePerDayTHB, 0), [equipment]);
  const insufficientItems = useMemo(() => equipment.filter((it) => it.qty > it.available), [equipment]);
  const hasInsufficient = insufficientItems.length > 0;

  const save = () => {
    if (!validate()) return;
    if (hasInsufficient) { alert(`มีอุปกรณ์ไม่เพียงพอ\n\n${insufficientItems.map((item) => `- ${item.name} (ต้องใช้ ${item.qty} / มี ${item.available})`).join("\n")}`); return; }
    setIsDecisionOpen(true);
  };

  const handleDecision = (decision: "approved" | "rejected") => {
    onSubmitDecision({ startDate, endDate, equipment, decision });
    setIsDecisionOpen(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[120]">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 p-5">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-zinc-900">{eventTitle}</div>
                <div className="mt-1 text-sm text-zinc-500">เลือกอุปกรณ์และกำหนดวันเบิก/คืนก่อนอนุมัติ Event</div>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" title="Close"><X className="h-4 w-4" /></button>
            </div>

            <div className="px-5 pb-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold text-zinc-700">วันเบิกอุปกรณ์ <span className="text-red-600">*</span></div>
                  <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date"
                    className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.startDate ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
                  {errors.startDate ? <div className="mt-1 text-xs text-red-600">{errors.startDate}</div> : null}
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-zinc-700">วันคืนอุปกรณ์ <span className="text-red-600">*</span></div>
                  <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date"
                    className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.endDate ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
                  {errors.endDate ? <div className="mt-1 text-xs text-red-600">{errors.endDate}</div> : null}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900">อุปกรณ์ที่เลือก ({equipment.length})</div>
                <button onClick={openSelect} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700">
                  <Plus className="h-4 w-4" />เพิ่มอุปกรณ์
                </button>
              </div>

              {hasInsufficient && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  มีอุปกรณ์ไม่เพียงพอ กรุณาตรวจสอบรายการที่ขึ้นสถานะ "ไม่พอ" ก่อนบันทึกและอนุมัติ
                </div>
              )}

              {equipment.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200"><Boxes className="h-6 w-6" /></div>
                  <div className="mt-3 text-sm font-semibold text-zinc-800">ยังไม่ได้เลือกอุปกรณ์</div>
                  <div className="mt-1 text-sm text-zinc-500">คลิกปุ่ม "เพิ่มอุปกรณ์" เพื่อเริ่มเลือกอุปกรณ์</div>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {equipment.map((it, idx) => {
                    const enough = it.qty <= it.available;
                    return (
                      <div key={`${it.name}-${idx}`} className={["rounded-2xl border bg-white p-4 shadow-sm", enough ? "border-zinc-200" : "border-rose-300 bg-rose-50/40"].join(" ")}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-50 text-red-600 ring-1 ring-zinc-200"><Package className="h-4 w-4" /></div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-zinc-900">{it.name}</div>
                                <div className="mt-0.5 text-xs text-zinc-500">{it.category}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={["rounded-full px-2.5 py-1 text-xs font-semibold ring-1", enough ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-rose-100 text-rose-700 ring-rose-200"].join(" ")}>
                              {enough ? "พอ" : "ไม่พอ"}
                            </span>
                            <button onClick={() => removeEquipmentAt(idx)} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-red-600 hover:bg-red-50" title="ลบ"><X className="h-4 w-4" /></button>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                          <div><div className="text-xs text-zinc-500">จำนวน / มีอยู่</div><div className="mt-1 text-sm font-semibold text-zinc-900">{it.qty} / {it.available}</div></div>
                          <div><div className="text-xs text-zinc-500">ค่าเช่า/วัน</div><div className="mt-1 text-sm font-semibold text-zinc-900">{formatTHB(it.pricePerDayTHB)} บาท</div></div>
                          <div><div className="text-xs text-zinc-500">รวม (1 วัน)</div><div className="mt-1 text-sm font-semibold text-blue-600">{formatTHB(it.qty * it.pricePerDayTHB)} บาท</div></div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="text-center"><div className="text-xs text-zinc-500">ประเภทอุปกรณ์</div><div className="mt-1 text-sm font-semibold text-zinc-900">{uniqueTypes}</div></div>
                      <div className="text-center"><div className="text-xs text-zinc-500">จำนวนทั้งหมด</div><div className="mt-1 text-sm font-semibold text-blue-600">{formatTHB(totalQty)} ชิ้น</div></div>
                      <div className="text-center"><div className="text-xs text-zinc-500">ค่าใช้จ่ายรวม (โดยประมาณ)</div><div className="mt-1 text-sm font-semibold text-red-600">{formatTHB(totalCostPerDay)} บาท</div></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button onClick={onClose} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ยกเลิก</button>
                <button onClick={save} disabled={hasInsufficient}
                  className={["h-10 rounded-xl px-4 text-sm font-semibold text-white shadow-sm", hasInsufficient ? "cursor-not-allowed bg-zinc-300" : "bg-red-600 hover:bg-red-700"].join(" ")}>
                  บันทึกและอนุมัติ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select Equipment Sub-modal */}
      {isSelectOpen && (
        <div className="fixed inset-0 z-[130]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsSelectOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-3 p-5">
                <div><div className="text-lg font-semibold text-zinc-900">Select Equipment</div><div className="mt-1 text-sm text-zinc-500">Choose equipment and specify quantity</div></div>
                <button onClick={() => setIsSelectOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" title="Close"><X className="h-4 w-4" /></button>
              </div>
              <div className="px-5 pb-5">
                <div ref={equipRef} className="relative">
                  <div className="mb-1 text-xs font-semibold text-zinc-700">Equipment</div>
                  <button onClick={() => setIsEquipOpen((v) => !v)} type="button"
                    className={["flex h-10 w-full items-center justify-between rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900", selectErrors.name ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200"].join(" ")}>
                    <span className={selectedName ? "text-zinc-900" : "text-zinc-500"}>
                      {selectedName ? `${selectedName} (Available: ${selectedOption?.available ?? "-"})` : "Select equipment"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  </button>
                  {selectErrors.name ? <div className="mt-1 text-xs text-red-600">{selectErrors.name}</div> : null}
                  {isEquipOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[140] rounded-xl border border-zinc-200 bg-white shadow-lg">
                      <div className="max-h-[260px] overflow-auto p-1">
                        {equipmentOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-zinc-500">ไม่มีอุปกรณ์ที่พร้อมใช้</div>
                        ) : equipmentOptions.map((opt) => (
                          <button key={opt.name} type="button" onClick={() => { setSelectedName(opt.name); setSelectErrors((s) => ({ ...s, name: undefined })); setIsEquipOpen(false); }}
                            className={["flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition", opt.name === selectedName ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"].join(" ")}>
                            {opt.name} (Available: {opt.available})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <div className="mb-1 text-xs font-semibold text-zinc-700">Quantity</div>
                  <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Enter quantity"
                    className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", selectErrors.qty ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200"].join(" ")} />
                  {selectErrors.qty ? <div className="mt-1 text-xs text-red-600">{selectErrors.qty}</div> : null}
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button onClick={() => setIsSelectOpen(false)} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Cancel</button>
                  <button onClick={addSelected} className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800">Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {isDecisionOpen && (
        <div className="fixed inset-0 z-[170]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDecisionOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
              <div className="text-lg font-semibold text-zinc-900">ยืนยันการบันทึกผล</div>
              <div className="mt-2 text-sm text-zinc-500">ต้องการบันทึก Event นี้เป็นแบบไหน</div>
              <div className="mt-5 grid grid-cols-1 gap-3">
                <button onClick={() => handleDecision("approved")} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">อนุมัติ</button>
                <button onClick={() => handleDecision("rejected")} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">ไม่อนุมัติ</button>
                <button onClick={() => setIsDecisionOpen(false)} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** ========= Modal: Calendar Day Events ========= */
function CalendarDayEventsModal({ open, dateLabel, events, onClose }: { open: boolean; dateLabel: string; events: EventItem[]; onClose: () => void; }) {
  useEffect(() => { if (!open) return; const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div><div className="text-lg font-semibold text-zinc-900">รายการ Event วันที่ {dateLabel}</div><div className="mt-1 text-sm text-zinc-500">ทั้งหมด {events.length} รายการ</div></div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" title="Close"><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-5 pb-5">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">ไม่มีรายการในวันนี้</div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><div className="truncate text-sm font-semibold text-zinc-900">{ev.title}</div><div className="mt-1 text-xs text-zinc-500">{ev.code}</div></div>
                      <StatusPill tone={ev.status.tone} text={ev.status.text} />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div><div className="text-xs text-zinc-400">บริษัท</div><div className="mt-1 text-sm font-medium text-zinc-900">{ev.company}</div></div>
                      <div><div className="text-xs text-zinc-400">สถานที่</div><div className="mt-1 text-sm font-medium text-zinc-900">{ev.place}</div></div>
                      <div><div className="text-xs text-zinc-400">วันจัดงาน</div><div className="mt-1 text-sm font-medium text-zinc-900">{ev.date}</div></div>
                      <div><div className="text-xs text-zinc-400">อุปกรณ์</div><div className="mt-1 text-sm font-medium text-zinc-900">{ev.items}</div></div>
                    </div>
                    <div className="mt-3"><div className="text-xs text-zinc-400">รายละเอียด</div><div className="mt-1 text-sm text-zinc-700">{ev.desc || "-"}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** ========= Modal: Event Detail ========= */
function EventDetailModal({ open, event, equipment, onClose }: { open: boolean; event: EventItem | null; equipment: SelectedEquipment[]; onClose: () => void; }) {
  useEffect(() => { if (!open) return; const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [open, onClose]);
  if (!open || !event) return null;
  const { startStr, endStr } = parseDateRange(event.date);
  const startDate = startStr ? toDateLocal(startStr) : null;
  const endDate = endStr ? toDateLocal(endStr) : null;
  const eventDays = startDate && endDate ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
  const totalQty = equipment.reduce((sum, it) => sum + it.qty, 0);
  const uniqueTypes = new Set(equipment.map((x) => x.name)).size;
  const totalCostPerDay = equipment.reduce((sum, it) => sum + it.qty * it.pricePerDayTHB, 0);
  const totalCost = eventDays > 0 ? totalCostPerDay * eventDays : totalCostPerDay;
  const fmtDate = (d: Date | null) => d ? d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "-";
  const dateRangeLabel = startDate && endDate ? `${fmtDate(startDate)} - ${fmtDate(endDate)}` : event.date;
  return (
    <div className="fixed inset-0 z-[160]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="min-w-0">
              <div className="text-lg font-semibold text-zinc-900">รายละเอียด Event</div>
              <div className="mt-1 text-sm text-zinc-500">ข้อมูลพื้นฐานของ Event</div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="truncate text-xl font-semibold text-zinc-900">{event.title}</div>
                <StatusPill tone={event.status.tone} text={event.status.text} />
                <span className="text-sm text-zinc-500">{event.code}</span>
              </div>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" title="Close"><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-[80vh] overflow-y-auto px-5 pb-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-zinc-600"><Wallet className="h-4 w-4 text-red-500" />งบประมาณ</div><div className="mt-2 text-lg font-semibold text-zinc-900">{event.budgetTHB != null ? `${formatTHB(event.budgetTHB)} บาท` : "-"}</div></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-zinc-600"><ClipboardList className="h-4 w-4 text-blue-500" />ค่าอุปกรณ์ต่อวัน</div><div className="mt-2 text-lg font-semibold text-zinc-900">{totalCostPerDay > 0 ? `${formatTHB(totalCostPerDay)} บาท/วัน` : "-"}</div></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-zinc-600"><CalendarRange className="h-4 w-4 text-emerald-500" />จำนวนวันจัดงาน</div><div className="mt-2 text-lg font-semibold text-zinc-900">{eventDays ? `${eventDays} วัน` : "-"}</div></div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-zinc-600"><Users className="h-4 w-4 text-violet-500" />ผู้เข้าร่วม</div><div className="mt-2 text-lg font-semibold text-zinc-900">{event.attendees != null ? new Intl.NumberFormat("th-TH").format(event.attendees) : "-"}</div></div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500"><Building2 className="h-4 w-4" />บริษัท</div><div className="mt-1 text-sm font-semibold text-zinc-900">{event.company || "-"}</div>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500"><User className="h-4 w-4" />ผู้จัด</div><div className="mt-1 text-sm font-semibold text-zinc-900">{event.organizer || "-"}</div>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500"><ClipboardList className="h-4 w-4" />สถานะ</div><div className="mt-1"><StatusPill tone={event.status.tone} text={event.status.text} /></div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500"><MapPin className="h-4 w-4" />สถานที่</div><div className="mt-1 text-sm font-semibold text-zinc-900">{event.place || "-"}</div>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500"><CalendarRange className="h-4 w-4" />วันจัดงาน</div><div className="mt-1 text-sm font-semibold text-zinc-900">{dateRangeLabel}</div>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500"><Archive className="h-4 w-4" />รหัสสาขา</div><div className="mt-1 text-sm font-semibold text-zinc-900">{event.branchCode || "-"}</div>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-xs font-semibold text-zinc-500"><ClipboardList className="h-4 w-4" />คำอธิบาย</div><div className="mt-2 text-sm text-zinc-700">{event.desc || "-"}</div></div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700">อุปกรณ์ {equipment.length} รายการ</div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">รวม {totalQty} ชิ้น / {uniqueTypes} ประเภท</div>
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">รวมค่าใช้จ่าย {totalCost > 0 ? `${formatTHB(totalCost)} บาท` : "-"}</div>
            </div>
            <div className="mt-4 space-y-3">
              {equipment.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-500">ยังไม่มีอุปกรณ์ที่เลือก</div>
              ) : equipment.map((item, idx) => {
                const enough = item.available >= item.qty;
                const totalPerItem = item.pricePerDayTHB * item.qty * (eventDays || 1);
                return (
                  <div key={`${item.name}-${idx}`} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><div className="truncate text-sm font-semibold text-zinc-900">{item.name}</div><div className="mt-1 text-xs text-zinc-500">{item.category}</div></div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enough ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"}`}>{enough ? "พอ" : "ไม่พอ"}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                      <div><div className="text-xs text-zinc-400">จำนวนที่ต้องใช้</div><div className="mt-1 font-semibold text-zinc-900">{item.qty} ชิ้น</div></div>
                      <div><div className="text-xs text-zinc-400">จำนวนที่มีอยู่</div><div className="mt-1 font-semibold text-zinc-900">{item.available} ชิ้น</div></div>
                      <div><div className="text-xs text-zinc-400">ค่าเช่า/วัน</div><div className="mt-1 font-semibold text-zinc-900">{formatTHB(item.pricePerDayTHB)} บาท</div></div>
                      <div><div className="text-xs text-zinc-400">จำนวนวัน</div><div className="mt-1 font-semibold text-zinc-900">{eventDays || 1} วัน</div></div>
                      <div><div className="text-xs text-zinc-400">รวมค่าใช้จ่าย</div><div className="mt-1 font-semibold text-red-600">{formatTHB(totalPerItem)} บาท</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ========= Main Page ========= */
// ✅ รับ stockData, onDeductStock, onReturnStock จาก AppShell
export default function Events({
  role,
  stockData,
  onDeductStock,
  onReturnStock,
}: {
  role: Role;
  stockData: StockRow[];
  onDeductStock: (equipmentList: { name: string; qty: number }[]) => void;
  onReturnStock: (equipmentList: { name: string; qty: number }[]) => void;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [monthCursor, setMonthCursor] = useState<Date>(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const statusOptions = useMemo(() => ["สถานะทั้งหมด","รออนุมัติ","อนุมัติแล้ว","ไม่อนุมัติ","เตรียมของ","กำลังใช้งาน","รอคืน","เสร็จสิ้น","ยกเลิก"], []);
  const [statusFilter, setStatusFilter] = useState<string>("สถานะทั้งหมด");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!isStatusOpen || !statusRef.current) return; if (!statusRef.current.contains(e.target as Node)) setIsStatusOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsStatusOpen(false); };
    window.addEventListener("mousedown", onDown); window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [isStatusOpen]);

  const [events, setEvents] = useState<EventItem[]>([
    { id: "EVT001", title: "Annual Meeting 2025", status: { text: "อนุมัติแล้ว", tone: "success" }, code: "#EVT001", desc: "Annual shareholder meeting with presentation", company: "ABC Corporation", place: "Grand Hotel Bangkok", date: "2026-03-20 - 2026-03-21", items: "5 รายการ", organizer: "John Smith", branchCode: "SA", budgetTHB: 50000, attendees: 250 },
    { id: "EVT002", title: "Product Launch Event", status: { text: "อนุมัติแล้ว", tone: "success" }, code: "#EVT002", desc: "New smartphone product launch with stage setup", company: "Tech Innovations Ltd", place: "Innovation Center", date: "2026-03-19 - 2026-03-19", items: "5 รายการ", organizer: "Emily Chen", branchCode: "HQ", budgetTHB: 120000, attendees: 500 },
    { id: "EVT003", title: "Corporate Training Workshop", status: { text: "รออนุมัติ", tone: "pending" }, code: "#EVT003", desc: "Employee training and team building workshop", company: "Business Solutions Inc", place: "Training Center Building A", date: "2026-03-18 - 2026-03-20", items: "0 รายการ", organizer: "David Lee", branchCode: "BKK-01", budgetTHB: 20000, attendees: 60 },
  ]);

  const companyOptions = useMemo(() => Array.from(new Set(events.map((e) => e.company))).sort((a, b) => a.localeCompare(b)), [events]);

  const pushNotification = (data: { title: string; message: string; audience: Role[] }) => {
    fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then(async (res) => {
        if (!res.ok) throw new Error("fail");
        const r = await res.json();
        const notif: NotificationItem = { id: r.id, createdAt: r.createdAt, title: data.title, message: data.message, audience: data.audience, unreadFor: data.audience, timeISO: r.createdAt };
        window.dispatchEvent(new CustomEvent("app:notification:new", { detail: notif }));
      }).catch(() => {});
  };

  const stats = useMemo(() => {
    const total = events.length;
    const pending = events.filter((e) => e.status.tone === "pending").length;
    const approved = events.filter((e) => e.status.tone === "success").length;
    const progress = events.filter((e) => e.status.tone === "progress").length;
    return [
      { label: "ทั้งหมด", value: total, tone: "neutral" as const, icon: <Archive className="h-5 w-5" /> },
      { label: "รออนุมัติ", value: pending, tone: "amber" as const, icon: <Clock3 className="h-5 w-5" /> },
      { label: "อนุมัติแล้ว", value: approved, tone: "emerald" as const, icon: <ThumbsUp className="h-5 w-5" /> },
      { label: "กำลังดำเนินการ", value: progress, tone: "sky" as const, icon: <CheckCircle2 className="h-5 w-5" /> },
    ];
  }, [events]);

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageEventId, setManageEventId] = useState<string | null>(null);
  const [equipmentByEvent, setEquipmentByEvent] = useState<Record<string, SelectedEquipment[]>>({});
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [calendarDetail, setCalendarDetail] = useState<{ dateKey: string; events: EventItem[] } | null>(null);

  const detailEvent = useMemo(() => { if (!detailEventId) return null; return events.find((e) => e.id === detailEventId) ?? null; }, [detailEventId, events]);
  const detailEquipment = useMemo(() => (detailEventId ? equipmentByEvent[detailEventId] ?? [] : []), [detailEventId, equipmentByEvent]);

  const onManageItems = (eventId: string) => { setManageEventId(eventId); setIsManageOpen(true); };

  const onDeleteEvent = (eventId: string) => {
    const target = events.find((ev) => ev.id === eventId);
    if (!target) return;
    if (!window.confirm(`ลบ Event "${target.title}" ใช่หรือไม่?`)) return;

    // ✅ คืน stock ถ้า event ที่ลบเคยถูกอนุมัติ
    if (target.status.tone === "success" && equipmentByEvent[eventId]) {
      onReturnStock(equipmentByEvent[eventId].map((eq) => ({ name: eq.name, qty: eq.qty })));
    }

    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    setEquipmentByEvent((prev) => { if (!(eventId in prev)) return prev; const next = { ...prev }; delete next[eventId]; return next; });
    if (manageEventId === eventId) { setIsManageOpen(false); setManageEventId(null); }
    setCalendarDetail((prev) => { if (!prev) return prev; const nextEvents = prev.events.filter((ev) => ev.id !== eventId); if (nextEvents.length === 0) return null; return { ...prev, events: nextEvents }; });
    if (detailEventId === eventId) setDetailEventId(null);
  };

  const activeEvent = useMemo(() => { if (!manageEventId) return null; return events.find((e) => e.id === manageEventId) ?? null; }, [manageEventId, events]);
  const activeEventRange = useMemo(() => { if (!activeEvent) return { startStr: "", endStr: "" }; return parseDateRange(activeEvent.date); }, [activeEvent]);

  const nextEventId = useMemo(() => {
    let max = 0;
    for (const e of events) { const m = e.id.match(/^EVT(\d+)$/); if (m) max = Math.max(max, Number(m[1])); }
    return max + 1;
  }, [events]);

  const handleCreate = (payload: { title: string; company: string; organizer: string; branchCode?: string; budgetTHB?: number; desc?: string; attendees?: number; place: string; startDate: string; endDate: string; }) => {
    const newId = `EVT${pad2(nextEventId).padStart(3, "0")}`;
    const newEvent: EventItem = { id: newId, code: `#${newId}`, title: payload.title, company: payload.company, place: payload.place, desc: payload.desc ?? "", date: `${payload.startDate} - ${payload.endDate}`, items: "0 รายการ", status: { text: "รออนุมัติ", tone: "pending" }, organizer: payload.organizer, branchCode: payload.branchCode, budgetTHB: payload.budgetTHB, attendees: payload.attendees };
    setEvents((prev) => [...prev, newEvent]);
    setView("list");
    setToast(`สร้าง Event เรียบร้อย: "${payload.title}"`);
    if (role === "SA") { fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Event ใหม่รออนุมัติ", message: `${payload.title} สร้างโดย SA รอการอนุมัติ`, audience: ["Manager"] }) }).catch(() => {}); }
  };

  const visibleEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = statusFilter === "สถานะทั้งหมด" ? events : events.filter((e) => e.status.text === statusFilter);
    if (!keyword) return filtered;
    return filtered.filter((e) => [e.title, e.company, e.place, e.desc, e.organizer ?? "", e.code].join(" ").toLowerCase().includes(keyword));
  }, [events, statusFilter, search]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const e of visibleEvents) {
      const { startStr, endStr } = parseDateRange(e.date);
      const start = toDateLocal(startStr); const end = toDateLocal(endStr);
      let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      while (cur <= end) { const key = toYMD(cur); if (!map[key]) map[key] = []; map[key].push(e); cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1); }
    }
    return map;
  }, [visibleEvents]);

  const calendarGrid = useMemo(() => {
    const y = monthCursor.getFullYear(); const m = monthCursor.getMonth();
    const first = new Date(y, m, 1); const last = new Date(y, m + 1, 0);
    const startOffset = first.getDay(); const totalDays = last.getDate();
    const cells: Array<{ date: Date; inMonth: boolean }> = [];
    for (let i = 0; i < startOffset; i++) cells.push({ date: new Date(y, m, 1 - (startOffset - i)), inMonth: false });
    for (let d = 1; d <= totalDays; d++) cells.push({ date: new Date(y, m, d), inMonth: true });
    while (cells.length % 7 !== 0) { const lastCell = cells[cells.length - 1].date; cells.push({ date: new Date(lastCell.getFullYear(), lastCell.getMonth(), lastCell.getDate() + 1), inMonth: false }); }
    return cells;
  }, [monthCursor]);

  const todayKey = useMemo(() => toYMD(new Date()), []);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  return (
    <div className="px-6 py-8">
      {toast && (
        <div className="fixed right-6 top-6 z-[120]">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></div>
            <div className="min-w-0"><div className="text-sm font-semibold text-zinc-900">แจ้งเตือน</div><div className="truncate text-xs text-zinc-600">{toast}</div></div>
            <button onClick={() => setToast(null)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label="ปิดแจ้งเตือน"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <CreateEventModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreate} companyOptions={companyOptions} />

      {isManageOpen && (
        <ManageEquipmentModal
          open={isManageOpen}
          eventTitle={activeEvent?.title ?? ""}
          startDateInitial={activeEventRange.startStr}
          endDateInitial={activeEventRange.endStr}
          initialEquipment={manageEventId ? equipmentByEvent[manageEventId] ?? [] : []}
          stockData={stockData} // ✅ ส่ง stockData จริงเข้าไป
          onClose={() => { setIsManageOpen(false); setManageEventId(null); }}
          onSubmitDecision={({ startDate, endDate, equipment, decision }) => {
            if (!manageEventId) return;
            const targetEvent = events.find((ev) => ev.id === manageEventId);

            // ✅ ถ้าเคยอนุมัติแล้วและ re-approve ให้คืนของเก่าก่อน
            const oldEquipment = equipmentByEvent[manageEventId];
            if (oldEquipment && targetEvent?.status.tone === "success") {
              onReturnStock(oldEquipment.map((eq) => ({ name: eq.name, qty: eq.qty })));
            }

            setEquipmentByEvent((prev) => ({ ...prev, [manageEventId]: equipment }));
            setEvents((prev) => prev.map((ev) => {
              if (ev.id !== manageEventId) return ev;
              return { ...ev, date: `${startDate} - ${endDate}`, items: `${equipment.length} รายการ`, status: decision === "approved" ? { text: "อนุมัติแล้ว", tone: "success" } : { text: "ไม่อนุมัติ", tone: "rejected" } };
            }));

            if (decision === "approved") {
              // ✅ หัก stock จริงเมื่ออนุมัติ
              onDeductStock(equipment.map((eq) => ({ name: eq.name, qty: eq.qty })));
              pushNotification({ title: "อนุมัติอุปกรณ์ Event", message: `${targetEvent?.title ?? "Event"} อนุมัติรายการอุปกรณ์แล้ว`, audience: ["SA", "Stockkeeper"] });
              setToast(`บันทึกแล้ว: "${targetEvent?.title ?? "Event"}" ถูกอนุมัติ`);
            } else {
              pushNotification({ title: "ไม่อนุมัติ Event", message: `${targetEvent?.title ?? "Event"} ถูกบันทึกเป็นไม่อนุมัติ`, audience: ["SA", "Stockkeeper"] });
              setToast(`บันทึกแล้ว: "${targetEvent?.title ?? "Event"}" ไม่อนุมัติ`);
            }
          }}
        />
      )}

      <CalendarDayEventsModal open={!!calendarDetail} dateLabel={calendarDetail ? toDateLocal(calendarDetail.dateKey).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : ""} events={calendarDetail?.events ?? []} onClose={() => setCalendarDetail(null)} />
      <EventDetailModal open={!!detailEventId} event={detailEvent} equipment={detailEquipment} onClose={() => setDetailEventId(null)} />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight text-zinc-900">จัดการ Event</h1><p className="mt-1 text-sm text-zinc-500">สร้างและจัดการงาน Event พร้อมตรวจสอบ Stock</p></div>
        {role === "SA" && <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-red-600/10 hover:bg-red-700 active:translate-y-[1px]"><span className="text-lg leading-none">+</span>Create New Event</button>}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} tone={s.tone} />)}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-600" placeholder="ค้นหา Event ด้วย ชื่อ, บริษัท, ผู้จัด, สถานที่..." />
          </div>
          <div ref={statusRef} className="relative md:w-[240px]">
            <button onClick={() => setIsStatusOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50">
              <span className={statusFilter === "สถานะทั้งหมด" ? "text-zinc-700" : "text-zinc-800"}>{statusFilter}</span>
              <span className="text-zinc-400">▾</span>
            </button>
            {isStatusOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-full rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                {statusOptions.map((opt) => (
                  <button key={opt} onClick={() => { setStatusFilter(opt); setIsStatusOpen(false); }}
                    className={["flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition", opt === statusFilter ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"].join(" ")}>
                    <span>{opt}</span>{opt === statusFilter ? <span className="text-zinc-500">✓</span> : <span />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 text-sm text-zinc-500">แสดง {visibleEvents.length} จาก {events.length} Events</div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setView("list")} className={["inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition", view === "list" ? "bg-red-600 text-white hover:bg-red-700" : "bg-white text-zinc-600 hover:bg-zinc-100"].join(" ")}><List className="h-4 w-4" />รายการ</button>
          <button onClick={() => setView("calendar")} className={["inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition", view === "calendar" ? "bg-red-600 text-white hover:bg-red-700" : "bg-white text-zinc-600 hover:bg-zinc-100"].join(" ")}><CalendarDays className="h-4 w-4" />ปฏิทิน</button>
        </div>
      </div>

      {view === "list" && (
        <div className="mt-5 space-y-4">
          {visibleEvents.map((e) => (
            <div key={e.code} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3"><h2 className="truncate text-base font-semibold text-zinc-900">{e.title}</h2><StatusPill tone={e.status.tone} text={e.status.text} /></div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500"><span className="text-zinc-400">{e.code}</span><span className="text-zinc-300">•</span><span className="min-w-0 truncate">{e.desc || "-"}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-2xl border border-zinc-200 bg-white p-2.5 text-zinc-700 shadow-sm hover:bg-zinc-50" onClick={() => setDetailEventId(e.id)} title="ดูรายละเอียด"><Eye className="h-4 w-4" /></button>
                  {role === "Manager" && e.status.tone === "pending" && (
                    <button onClick={() => onManageItems(e.id)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700" title="จัดการอุปกรณ์"><Package className="h-4 w-4" />จัดการอุปกรณ์</button>
                  )}
                  {role === "SA" && <button onClick={() => onDeleteEvent(e.id)} className="rounded-2xl border border-red-200 bg-white p-2.5 text-red-600 shadow-sm hover:bg-red-50" title="ลบ"><Trash2 className="h-4 w-4" /></button>}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div><div className="text-xs text-zinc-400">บริษัท</div><div className="mt-1 text-sm font-medium text-zinc-900">{e.company}</div></div>
                <div><div className="text-xs text-zinc-400">สถานที่</div><div className="mt-1 text-sm font-medium text-zinc-900">{e.place}</div></div>
                <div><div className="text-xs text-zinc-400">วันจัดงาน</div><div className="mt-1 text-sm font-medium text-zinc-900">{e.date}</div></div>
                <div><div className="text-xs text-zinc-400">อุปกรณ์</div><div className="mt-1 text-sm font-medium text-zinc-900">{e.items}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "calendar" && (
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-semibold text-zinc-900">{formatMonthThai(monthCursor)}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50" title="เดือนก่อน"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50" title="เดือนถัดไป"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <DayLegendDot cls="bg-rose-500" label="วันที่มี Event" />
            <DayLegendDot cls="bg-blue-500" label="วันนี้" />
            <DayLegendDot cls="bg-amber-500" label="รออนุมัติ" />
            <DayLegendDot cls="bg-emerald-500" label="อนุมัติแล้ว" />
            <DayLegendDot cls="bg-violet-500" label="กำลังใช้งาน" />
            <DayLegendDot cls="bg-rose-500" label="ไม่อนุมัติ" />
          </div>
          <div className="mt-4 grid grid-cols-7 gap-3 text-xs font-semibold text-zinc-500">
            {["อา","จ","อ","พ","พฤ","ศ","ส"].map((w) => <div key={w} className="px-1">{w}</div>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-3">
            {calendarGrid.map(({ date, inMonth }, idx) => {
              const key = toYMD(date);
              const isToday = key === todayKey;
              const dayEvents = eventsByDay[key] ?? [];
              const visibleDayEvents = dayEvents.slice(0, 2);
              const moreCount = Math.max(0, dayEvents.length - visibleDayEvents.length);
              const hasEvent = dayEvents.length > 0;
              return (
                <div key={`${key}-${idx}`} className={["min-h-[120px] rounded-2xl border p-3 transition", inMonth ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50", isToday ? "ring-2 ring-blue-500/30 bg-blue-50/40" : ""].join(" ")}>
                  <div className="flex items-start justify-between">
                    <div className={["text-sm font-semibold", inMonth ? "text-zinc-900" : "text-zinc-400", isToday ? "text-blue-700" : ""].join(" ")}>{date.getDate()}</div>
                    <div className="flex items-center gap-1">
                      {hasEvent && <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />}
                      {isToday && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {visibleDayEvents.map((ev) => (
                      <button key={`${key}-${ev.id}`} type="button" onClick={() => setCalendarDetail({ dateKey: key, events: dayEvents })}
                        className={["block w-full truncate rounded-lg border-l-4 px-2 py-1 text-left text-[11px] font-medium", getCalendarEventToneClass(ev.status.tone), !inMonth ? "opacity-60" : ""].join(" ")}
                        title={`${ev.title} • ${ev.status.text}`}>{ev.title}</button>
                    ))}
                    {moreCount > 0 && <button type="button" onClick={() => setCalendarDetail({ dateKey: key, events: dayEvents })} className="px-1 text-left text-[11px] font-medium text-zinc-500 hover:text-zinc-700 hover:underline">+{moreCount} รายการ</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="h-10" />
    </div>
  );
}

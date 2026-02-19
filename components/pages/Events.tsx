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
} from "lucide-react";

type Role = "SA" | "Manager" | "Stockkeeper";
type StatusTone = "success" | "pending" | "progress";

type EventItem = {
  id: string; // EVT001
  title: string; // Event Name
  status: { text: string; tone: StatusTone };
  code: string; // #EVT001
  desc: string; // Description
  company: string; // Company Name
  place: string; // Venue/Location
  date: string; // "YYYY-MM-DD - YYYY-MM-DD"
  items: string; // "0 รายการ" (mock)

  // extra fields (เก็บไว้ใช้ต่อ API/Reports)
  organizer?: string;
  branchCode?: string;
  budgetTHB?: number;
  attendees?: number;
};

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "neutral" | "amber" | "emerald" | "sky";
}) {
  const toneMap = {
    neutral: "bg-zinc-100 text-zinc-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
  } as const;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneMap[tone]}`}>
          {icon}
        </div>
        <div>
          <div className="text-xl font-semibold text-zinc-900">{value}</div>
          <div className="text-sm text-zinc-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ tone, text }: { tone: StatusTone; text: string }) {
  const cls =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
      : tone === "pending"
      ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
      : "bg-violet-100 text-violet-700 ring-1 ring-violet-200";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{text}</span>;
}

function formatMonthThai(d: Date) {
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toDateLocal(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function parseDateRange(range: string) {
  const [startStr, endStr] = range.split(" - ").map((s) => s.trim());
  return { startStr, endStr };
}

function DayLegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-600">
      <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
      <span>{label}</span>
    </div>
  );
}

/** ========= Modal: Create New Event ========= */
type CreateForm = {
  eventName: string;
  companyName: string;
  organizerName: string;
  branchCode: string;
  budgetTHB: string; // keep as string for input
  description: string;
  attendees: string;
  venue: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};

function Input({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className={[
          "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
          error ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
        ].join(" ")}
      />
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-20 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200"
      />
    </div>
  );
}

function CreateEventModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    title: string;
    company: string;
    organizer: string;
    branchCode?: string;
    budgetTHB?: number;
    desc?: string;
    attendees?: number;
    place: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  }) => void;
}) {
  const [form, setForm] = useState<CreateForm>({
    eventName: "",
    companyName: "",
    organizerName: "",
    branchCode: "",
    budgetTHB: "",
    description: "",
    attendees: "",
    venue: "",
    startDate: "",
    endDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setForm({
      eventName: "",
      companyName: "",
      organizerName: "",
      branchCode: "",
      budgetTHB: "",
      description: "",
      attendees: "",
      venue: "",
      startDate: "",
      endDate: "",
    });
    setErrors({});
  };

  const close = () => {
    reset();
    onClose();
  };

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
    if (form.startDate && form.endDate) {
      const s = toDateLocal(form.startDate);
      const t = toDateLocal(form.endDate);
      if (s > t) e.endDate = "วันจบต้องไม่ก่อนวันเริ่ม";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;

    onCreate({
      title: form.eventName.trim(),
      company: form.companyName.trim(),
      organizer: form.organizerName.trim(),
      branchCode: form.branchCode.trim() || undefined,
      budgetTHB: form.budgetTHB.trim() ? Number(form.budgetTHB) : undefined,
      desc: form.description.trim() || undefined,
      attendees: form.attendees.trim() ? Number(form.attendees) : undefined,
      place: form.venue.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    });

    close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={close} />

      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">Create New Event</div>
              <div className="mt-1 text-sm text-zinc-500">Fill in Event details and select required equipment</div>
            </div>
            <button
              onClick={close}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Event Name"
                required
                value={form.eventName}
                onChange={(v) => setForm((s) => ({ ...s, eventName: v }))}
                placeholder=""
                error={errors.eventName}
              />
              <Input
                label="Company Name"
                required
                value={form.companyName}
                onChange={(v) => setForm((s) => ({ ...s, companyName: v }))}
                placeholder=""
                error={errors.companyName}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Organizer Name"
                required
                value={form.organizerName}
                onChange={(v) => setForm((s) => ({ ...s, organizerName: v }))}
                placeholder="Organizer's full name"
                error={errors.organizerName}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Branch Code"
                value={form.branchCode}
                onChange={(v) => setForm((s) => ({ ...s, branchCode: v }))}
                placeholder="Branch code (optional)"
              />
              <Input
                label="Budget (THB)"
                required
                value={form.budgetTHB}
                onChange={(v) => setForm((s) => ({ ...s, budgetTHB: v }))}
                placeholder="Enter budget amount"
                error={errors.budgetTHB}
              />
            </div>

            <div className="mt-4">
              <TextArea
                label="Description"
                value={form.description}
                onChange={(v) => setForm((s) => ({ ...s, description: v }))}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Number of Attendees"
                value={form.attendees}
                onChange={(v) => setForm((s) => ({ ...s, attendees: v }))}
                placeholder="Enter number of attendees"
              />
            </div>

            <div className="mt-4">
              <Input
                label="Venue/Location"
                required
                value={form.venue}
                onChange={(v) => setForm((s) => ({ ...s, venue: v }))}
                placeholder=""
                error={errors.venue}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Event Start Date"
                required
                type="date"
                value={form.startDate}
                onChange={(v) => setForm((s) => ({ ...s, startDate: v }))}
                error={errors.startDate}
              />
              <Input
                label="Event End Date"
                required
                type="date"
                value={form.endDate}
                onChange={(v) => setForm((s) => ({ ...s, endDate: v }))}
                error={errors.endDate}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={close}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ========= Main Page ========= */
export default function Events({ role }: { role: Role }) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  /** ✅ เพิ่ม state สำหรับ dropdown สถานะ */
  const STATUS_OPTIONS = useMemo(
    () => [
      "สถานะทั้งหมด",
      "รออนุมัติ",
      "อนุมัติแล้ว",
      "เตรียมของ",
      "กำลังใช้งาน",
      "รอคืน",
      "เสร็จสิ้น",
      "ยกเลิก",
    ],
    []
  );

  const [statusFilter, setStatusFilter] = useState<string>("สถานะทั้งหมด");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!isStatusOpen) return;
      if (!statusRef.current) return;
      if (!statusRef.current.contains(e.target as Node)) setIsStatusOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsStatusOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [isStatusOpen]);

  /** ✅ เปลี่ยนจาก const เป็น state เพื่อ “เพิ่มได้จริง” */
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: "EVT001",
      title: "Annual Meeting 2025",
      status: { text: "อนุมัติแล้ว", tone: "success" },
      code: "#EVT001",
      desc: "Annual shareholder meeting with presentation",
      company: "ABC Corporation",
      place: "Grand Hotel Bangkok",
      date: "2025-11-20 - 2025-11-21",
      items: "5 รายการ",
    },
    {
      id: "EVT002",
      title: "Product Launch Event",
      status: { text: "อนุมัติแล้ว", tone: "success" },
      code: "#EVT002",
      desc: "New smartphone product launch with stage setup",
      company: "Tech Innovations Ltd",
      place: "Innovation Center",
      date: "2025-11-25 - 2025-11-25",
      items: "5 รายการ",
    },
    {
      id: "EVT003",
      title: "Corporate Training Workshop",
      status: { text: "รออนุมัติ", tone: "pending" },
      code: "#EVT003",
      desc: "Employee training and team building workshop",
      company: "Business Solutions Inc",
      place: "Training Center Building A",
      date: "2025-11-28 - 2025-11-29",
      items: "0 รายการ",
    },
  ]);

  /** ✅ stats ให้คำนวณจาก events จริง */
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

  const onManageItems = (eventId: string) => {
    alert(`Manage items for ${eventId}`);
  };

  /** ========= Create Event (จริงในฝั่ง UI) ========= */
  const nextEventId = useMemo(() => {
    // หาเลข EVT สูงสุดใน state ปัจจุบัน
    let max = 0;
    for (const e of events) {
      const m = e.id.match(/^EVT(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return max + 1;
  }, [events]);

  const handleCreate = (payload: {
    title: string;
    company: string;
    organizer: string;
    branchCode?: string;
    budgetTHB?: number;
    desc?: string;
    attendees?: number;
    place: string;
    startDate: string;
    endDate: string;
  }) => {
    const newId = `EVT${pad2(nextEventId).padStart(3, "0")}`; // EVT004 style
    const code = `#${newId}`;

    const dateRange = `${payload.startDate} - ${payload.endDate}`;

    const newEvent: EventItem = {
      id: newId,
      code,
      title: payload.title,
      company: payload.company,
      place: payload.place,
      desc: payload.desc ?? "",
      date: dateRange,
      items: "0 รายการ",
      status: { text: "รออนุมัติ", tone: "pending" }, // สร้างใหม่ให้เป็น pending ก่อน
      organizer: payload.organizer,
      branchCode: payload.branchCode,
      budgetTHB: payload.budgetTHB,
      attendees: payload.attendees,
    };

    setEvents((prev) => [newEvent, ...prev]);
    setView("list");
  };

  /** ✅ ตัวที่ “แสดงจริง” ตามตัวกรองสถานะ */
  const visibleEvents = useMemo(() => {
    if (statusFilter === "สถานะทั้งหมด") return events;
    return events.filter((e) => e.status.text === statusFilter);
  }, [events, statusFilter]);

  /** ========= Calendar data ========= */
  const dayMap = useMemo(() => {
    const map: Record<string, { hasEvent: boolean; isPending: boolean; isApproved: boolean; isProgress: boolean }> = {};

    for (const e of visibleEvents) {
      const { startStr, endStr } = parseDateRange(e.date);
      const start = toDateLocal(startStr);
      const end = toDateLocal(endStr);

      let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      while (cur <= end) {
        const key = toYMD(cur);
        map[key] ||= { hasEvent: false, isPending: false, isApproved: false, isProgress: false };
        map[key].hasEvent = true;

        if (e.status.tone === "pending") map[key].isPending = true;
        if (e.status.tone === "success") map[key].isApproved = true;
        if (e.status.tone === "progress") map[key].isProgress = true;

        cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      }
    }
    return map;
  }, [visibleEvents]);

  const calendarGrid = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();

    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);

    const startOffset = first.getDay(); // Sunday start
    const totalDays = last.getDate();
    const cells: Array<{ date: Date; inMonth: boolean }> = [];

    for (let i = 0; i < startOffset; i++) {
      const d = new Date(y, m, 1 - (startOffset - i));
      cells.push({ date: d, inMonth: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ date: new Date(y, m, d), inMonth: true });
    }
    while (cells.length < 42) {
      const lastCell = cells[cells.length - 1].date;
      const next = new Date(lastCell.getFullYear(), lastCell.getMonth(), lastCell.getDate() + 1);
      cells.push({ date: next, inMonth: false });
    }
    return cells;
  }, [monthCursor]);

  const todayKey = useMemo(() => toYMD(new Date()), []);
  const monthKey = (d: Date) => toYMD(d);

  const dotClassForDay = (key: string) => {
    const info = dayMap[key];
    if (!info?.hasEvent) return "";
    if (info.isPending) return "bg-amber-500";
    if (info.isApproved) return "bg-emerald-500";
    if (info.isProgress) return "bg-violet-500";
    return "bg-rose-500";
  };

  return (
    <div className="px-6 py-8">
      {/* Modal */}
      <CreateEventModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreate} />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">จัดการ Event</h1>
          <p className="mt-1 text-sm text-zinc-500">สร้างและจัดการงาน Event พร้อมตรวจสอบ Stock</p>
        </div>

        {/* ✅ โชว์เฉพาะ SA */}
        {role === "SA" && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-red-600/10 hover:bg-red-700 active:translate-y-[1px]"
          >
            <span className="text-lg leading-none">+</span>
            Create New Event
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} tone={s.tone} />
        ))}
      </div>

      {/* Search + Filter (ยังเป็น UI เฉย ๆ เหมือนเดิม) */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="ค้นหา Event ด้วย ชื่อ, บริษัท, ผู้จัด, สถานที่..."
            />
          </div>

          {/* ✅ Status Dropdown */}
          <div ref={statusRef} className="relative md:w-[240px]">
            <button
              onClick={() => setIsStatusOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              <span className={statusFilter === "สถานะทั้งหมด" ? "text-zinc-500" : "text-zinc-800"}>
                {statusFilter}
              </span>
              <span className="text-zinc-400">▾</span>
            </button>

            {isStatusOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-full rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                {STATUS_OPTIONS.map((opt) => {
                  const active = opt === statusFilter;
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        setStatusFilter(opt);
                        setIsStatusOpen(false);
                      }}
                      className={[
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                        active ? "bg-zinc-100 text-zinc-900" : "hover:bg-zinc-50 text-zinc-700",
                      ].join(" ")}
                    >
                      <span>{opt}</span>
                      {active ? <span className="text-zinc-500">✓</span> : <span />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Count + View switch */}
      <div className="mt-5 text-sm text-zinc-500">
        แสดง {visibleEvents.length} จาก {events.length} Events
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("list")}
            className={[
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition",
              view === "list" ? "bg-red-600 text-white hover:bg-red-700" : "bg-white text-zinc-600 hover:bg-zinc-100",
            ].join(" ")}
          >
            <List className="h-4 w-4" />
            รายการ
          </button>

          <button
            onClick={() => setView("calendar")}
            className={[
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition",
              view === "calendar"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white text-zinc-600 hover:bg-zinc-100",
            ].join(" ")}
          >
            <CalendarDays className="h-4 w-4" />
            ปฏิทิน
          </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="mt-5 space-y-4">
          {visibleEvents.map((e) => (
            <div
              key={e.code}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate text-base font-semibold text-zinc-900">{e.title}</h2>
                    <StatusPill tone={e.status.tone} text={e.status.text} />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                    <span className="text-zinc-400">{e.code}</span>
                    <span className="text-zinc-300">•</span>
                    <span className="min-w-0 truncate">{e.desc || "-"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="rounded-2xl border border-zinc-200 bg-white p-2.5 text-zinc-700 shadow-sm hover:bg-zinc-50"
                    title="ดู"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {role === "Manager" && e.status.tone === "pending" && (
                    <button
                      onClick={() => onManageItems(e.id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                      title="จัดการอุปกรณ์"
                    >
                      <Package className="h-4 w-4" />
                      จัดการอุปกรณ์
                    </button>
                  )}

                  {role === "SA" && (
                    <button
                      className="rounded-2xl border border-red-200 bg-white p-2.5 text-red-600 shadow-sm hover:bg-red-50"
                      title="ลบ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <div className="text-xs text-zinc-400">บริษัท</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">{e.company}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">สถานที่</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">{e.place}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">วันจัดงาน</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">{e.date}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">อุปกรณ์</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">{e.items}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === "calendar" && (
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-semibold text-zinc-900">{formatMonthThai(monthCursor)}</div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                title="เดือนก่อน"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                title="เดือนถัดไป"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <DayLegendDot cls="bg-rose-500" label="วันที่มี Event" />
            <DayLegendDot cls="bg-blue-500" label="วันนี้" />
            <DayLegendDot cls="bg-amber-500" label="รออนุมัติ" />
            <DayLegendDot cls="bg-emerald-500" label="อนุมัติแล้ว" />
            <DayLegendDot cls="bg-violet-500" label="กำลังใช้งาน" />
          </div>

          <div className="mt-4 grid grid-cols-7 gap-3 text-xs font-semibold text-zinc-500">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((w) => (
              <div key={w} className="px-1">
                {w}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-3">
            {calendarGrid.map(({ date, inMonth }, idx) => {
              const key = monthKey(date);
              const isToday = key === todayKey;
              const dot = dotClassForDay(key);

              const cellCls = [
                "min-h-[84px] rounded-2xl border p-3 transition",
                inMonth ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50",
                isToday ? "ring-2 ring-blue-500/30 bg-blue-50/40" : "",
              ].join(" ");

              return (
                <div key={`${key}-${idx}`} className={cellCls}>
                  <div className="flex items-start justify-between">
                    <div
                      className={[
                        "text-sm font-semibold",
                        inMonth ? "text-zinc-900" : "text-zinc-400",
                        isToday ? "text-blue-700" : "",
                      ].join(" ")}
                    >
                      {date.getDate()}
                    </div>

                    <div className="flex items-center gap-1">
                      {isToday && <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
                      {dot && <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />}
                    </div>
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

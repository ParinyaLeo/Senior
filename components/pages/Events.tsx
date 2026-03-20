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
} from "lucide-react";

type Role = "SA" | "Manager" | "Stockkeeper";
type StatusTone = "success" | "pending" | "progress";

type EventItem = {
  id: string;
  title: string;
  status: { text: string; tone: StatusTone };
  code: string;
  desc: string;
  company: string;
  place: string;
  date: string; // "YYYY-MM-DD - YYYY-MM-DD"
  items: string;

  organizer?: string;
  branchCode?: string;
  budgetTHB?: number;
  attendees?: number;
};

type EquipmentOption = {
  name: string;
  available: number;
  category: string;
  pricePerDayTHB: number;
};

type SelectedEquipment = {
  name: string;
  qty: number;
  available: number;
  category: string;
  pricePerDayTHB: number;
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
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneMap[tone]}`}
        >
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

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
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

function formatTHB(n: number) {
  return new Intl.NumberFormat("th-TH").format(n);
}

function getCalendarEventToneClass(tone: StatusTone) {
  if (tone === "pending") {
    return "border-l-amber-500 bg-amber-50 text-amber-700";
  }
  if (tone === "success") {
    return "border-l-emerald-500 bg-emerald-50 text-emerald-700";
  }
  return "border-l-violet-500 bg-violet-50 text-violet-700";
}

/** ========= Modal: Create New Event ========= */
type CreateForm = {
  eventName: string;
  companyName: string;
  organizerName: string;
  branchCode: string;
  budgetTHB: string;
  description: string;
  attendees: string;
  venue: string;
  startDate: string;
  endDate: string;
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
          error
            ? "border-red-300 ring-2 ring-red-100"
            : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
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
    startDate: string;
    endDate: string;
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
    if (form.budgetTHB.trim() && Number.isNaN(Number(form.budgetTHB))) {
      e.budgetTHB = "งบประมาณต้องเป็นตัวเลข";
    }
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
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                Create New Event
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                Fill in Event details and select required equipment
              </div>
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
                error={errors.eventName}
              />
              <Input
                label="Company Name"
                required
                value={form.companyName}
                onChange={(v) => setForm((s) => ({ ...s, companyName: v }))}
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

/** ========= Modal: Manage Equipment + Select Equipment ========= */
function ManageEquipmentModal({
  open,
  eventTitle,
  startDateInitial,
  endDateInitial,
  initialEquipment,
  onClose,
  onSaveApprove,
}: {
  open: boolean;
  eventTitle: string;
  startDateInitial: string;
  endDateInitial: string;
  initialEquipment: SelectedEquipment[];
  onClose: () => void;
  onSaveApprove: (payload: {
    startDate: string;
    endDate: string;
    equipment: SelectedEquipment[];
  }) => void;
}) {
  const [startDate, setStartDate] = useState(startDateInitial);
  const [endDate, setEndDate] = useState(endDateInitial);
  const [equipment, setEquipment] = useState<SelectedEquipment[]>(
    initialEquipment
  );
  const [errors, setErrors] = useState<{ startDate?: string; endDate?: string }>(
    {}
  );

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [qty, setQty] = useState("");
  const [selectErrors, setSelectErrors] = useState<{
    name?: string;
    qty?: string;
  }>({});

  const [isEquipOpen, setIsEquipOpen] = useState(false);
  const equipRef = useRef<HTMLDivElement | null>(null);

  const EQUIPMENT_OPTIONS: EquipmentOption[] = useMemo(
    () => [
      {
        name: "ชุดไฟ LED พาร์ 200W",
        available: 50,
        category: "ระบบแสง",
        pricePerDayTHB: 1500,
      },
      {
        name: "ชุดไฟ Moving Head 300W",
        available: 28,
        category: "ระบบแสง",
        pricePerDayTHB: 1500,
      },
      {
        name: "ชุดไฟ Par Light LED RGB",
        available: 35,
        category: "ระบบแสง",
        pricePerDayTHB: 900,
      },
      {
        name: "เวทีขนาดเล็ก 2x2 เมตร",
        available: 20,
        category: "เวที",
        pricePerDayTHB: 800,
      },
      {
        name: "เวทีขนาดกลาง 4x4 เมตร",
        available: 12,
        category: "เวที",
        pricePerDayTHB: 1200,
      },
      {
        name: "เวทีขนาดใหญ่ 6x8 เมตร",
        available: 8,
        category: "เวที",
        pricePerDayTHB: 2500,
      },
      {
        name: "หญ้าเทียม (ม้วน 2x10 เมตร)",
        available: 85,
        category: "ตกแต่ง",
        pricePerDayTHB: 150,
      },
      {
        name: "โต๊ะพับหน้าไม้ 180cm",
        available: 180,
        category: "เฟอร์นิเจอร์",
        pricePerDayTHB: 80,
      },
      {
        name: "เก้าอี้พลาสติก มีพนักพิง",
        available: 420,
        category: "เฟอร์นิเจอร์",
        pricePerDayTHB: 20,
      },
      {
        name: "เครื่องเสียง PA System 2000W",
        available: 18,
        category: "ระบบเสียง",
        pricePerDayTHB: 2000,
      },
      {
        name: "ไมโครโฟนไร้สายคู่",
        available: 35,
        category: "ระบบเสียง",
        pricePerDayTHB: 600,
      },
      {
        name: "โปรเจคเตอร์ 5000 Lumens",
        available: 22,
        category: "ภาพ/โปรเจคเตอร์",
        pricePerDayTHB: 1200,
      },
    ],
    []
  );

  const selectedOption = useMemo(
    () => EQUIPMENT_OPTIONS.find((o) => o.name === selectedName) ?? null,
    [EQUIPMENT_OPTIONS, selectedName]
  );

  useEffect(() => {
    if (!open) return;
    setStartDate(startDateInitial);
    setEndDate(endDateInitial);
    setEquipment(initialEquipment);
    setErrors({});

    setIsSelectOpen(false);
    setSelectedName("");
    setQty("");
    setSelectErrors({});
    setIsEquipOpen(false);
  }, [open, startDateInitial, endDateInitial, initialEquipment]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEquipOpen) setIsEquipOpen(false);
        else if (isSelectOpen) setIsSelectOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isSelectOpen, isEquipOpen]);

  useEffect(() => {
    if (!isEquipOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!equipRef.current) return;
      if (!equipRef.current.contains(e.target as Node)) setIsEquipOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [isEquipOpen]);

  const validate = () => {
    const e: { startDate?: string; endDate?: string } = {};
    if (!startDate) e.startDate = "กรุณาเลือกวันเบิกอุปกรณ์";
    if (!endDate) e.endDate = "กรุณาเลือกวันคืนอุปกรณ์";
    if (startDate && endDate) {
      const s = toDateLocal(startDate);
      const t = toDateLocal(endDate);
      if (s > t) e.endDate = "วันคืนอุปกรณ์ต้องไม่ก่อนวันเบิกอุปกรณ์";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openSelect = () => {
    setSelectedName("");
    setQty("");
    setSelectErrors({});
    setIsEquipOpen(false);
    setIsSelectOpen(true);
  };

  const validateSelect = () => {
    const e: { name?: string; qty?: string } = {};
    if (!selectedName) e.name = "กรุณาเลือกอุปกรณ์";
    if (!qty.trim()) e.qty = "กรุณากรอกจำนวน";
    if (qty.trim() && (Number.isNaN(Number(qty)) || Number(qty) <= 0)) {
      e.qty = "จำนวนต้องเป็นตัวเลขมากกว่า 0";
    }
    setSelectErrors(e);
    return Object.keys(e).length === 0;
  };

  const addSelected = () => {
    if (!validateSelect()) return;
    if (!selectedOption) {
      setSelectErrors((s) => ({ ...s, name: "กรุณาเลือกอุปกรณ์" }));
      return;
    }

    const q = Number(qty);

    setEquipment((prev) => {
      const idx = prev.findIndex((x) => x.name === selectedOption.name);
      if (idx === -1) {
        return [
          ...prev,
          {
            name: selectedOption.name,
            qty: q,
            available: selectedOption.available,
            category: selectedOption.category,
            pricePerDayTHB: selectedOption.pricePerDayTHB,
          },
        ];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + q };
      return next;
    });

    setIsSelectOpen(false);
  };

  const removeEquipmentAt = (idx: number) => {
    setEquipment((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalQty = useMemo(
    () => equipment.reduce((sum, it) => sum + it.qty, 0),
    [equipment]
  );
  const uniqueTypes = useMemo(
    () => new Set(equipment.map((x) => x.name)).size,
    [equipment]
  );
  const totalCostPerDay = useMemo(
    () => equipment.reduce((sum, it) => sum + it.qty * it.pricePerDayTHB, 0),
    [equipment]
  );

  const save = () => {
    if (!validate()) return;
    onSaveApprove({ startDate, endDate, equipment });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-zinc-900">
                {eventTitle}
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                เลือกอุปกรณ์และกำหนดวันเบิก/คืนก่อนอนุมัติ Event
              </div>
            </div>

            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold text-zinc-700">
                  วันเบิกอุปกรณ์ <span className="text-red-600">*</span>
                </div>
                <input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  type="date"
                  className={[
                    "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
                    errors.startDate
                      ? "border-red-300 ring-2 ring-red-100"
                      : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
                  ].join(" ")}
                />
                {errors.startDate ? (
                  <div className="mt-1 text-xs text-red-600">
                    {errors.startDate}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-zinc-700">
                  วันคืนอุปกรณ์ <span className="text-red-600">*</span>
                </div>
                <input
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  type="date"
                  className={[
                    "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
                    errors.endDate
                      ? "border-red-300 ring-2 ring-red-100"
                      : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
                  ].join(" ")}
                />
                {errors.endDate ? (
                  <div className="mt-1 text-xs text-red-600">
                    {errors.endDate}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-zinc-900">
                อุปกรณ์ที่เลือก ({equipment.length})
              </div>

              <button
                onClick={openSelect}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                title="เพิ่มอุปกรณ์"
              >
                <Plus className="h-4 w-4" />
                เพิ่มอุปกรณ์
              </button>
            </div>

            {equipment.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200">
                  <Boxes className="h-6 w-6" />
                </div>
                <div className="mt-3 text-sm font-semibold text-zinc-800">
                  ยังไม่ได้เลือกอุปกรณ์
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  คลิกปุ่ม “เพิ่มอุปกรณ์” เพื่อเริ่มเลือกอุปกรณ์
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {equipment.map((it, idx) => {
                  const enough = it.qty <= it.available;
                  const total1Day = it.qty * it.pricePerDayTHB;

                  return (
                    <div
                      key={`${it.name}-${idx}`}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-50 text-red-600 ring-1 ring-zinc-200">
                              <Package className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-zinc-900">
                                {it.name}
                              </div>
                              <div className="mt-0.5 text-xs text-zinc-500">
                                {it.category}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                              enough
                                ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                                : "bg-rose-100 text-rose-700 ring-rose-200",
                            ].join(" ")}
                          >
                            {enough ? "พอ" : "ไม่พอ"}
                          </span>

                          <button
                            onClick={() => removeEquipmentAt(idx)}
                            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-red-600 hover:bg-red-50"
                            title="ลบ"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                        <div>
                          <div className="text-xs text-zinc-500">
                            จำนวน / มีอยู่
                          </div>
                          <div className="mt-1 text-sm font-semibold text-zinc-900">
                            {it.qty} / {it.available}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500">
                            ค่าเช่า/วัน
                          </div>
                          <div className="mt-1 text-sm font-semibold text-zinc-900">
                            {formatTHB(it.pricePerDayTHB)} บาท
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500">รวม (1 วัน)</div>
                          <div className="mt-1 text-sm font-semibold text-blue-600">
                            {formatTHB(total1Day)} บาท
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-xs text-zinc-500">
                        ประเภทอุปกรณ์
                      </div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {uniqueTypes}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500">
                        จำนวนทั้งหมด
                      </div>
                      <div className="mt-1 text-sm font-semibold text-blue-600">
                        {formatTHB(totalQty)} ชิ้น
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500">
                        ค่าใช้จ่ายรวม (โดยประมาณ)
                      </div>
                      <div className="mt-1 text-sm font-semibold text-red-600">
                        {formatTHB(totalCostPerDay)} บาท
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={save}
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              >
                บันทึกและอนุมัติ
              </button>
            </div>
          </div>
        </div>
      </div>

      {isSelectOpen && (
        <div className="fixed inset-0 z-[130]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSelectOpen(false)}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-3 p-5">
                <div>
                  <div className="text-lg font-semibold text-zinc-900">
                    Select Equipment
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">
                    Choose equipment and specify quantity
                  </div>
                </div>

                <button
                  onClick={() => setIsSelectOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 pb-5">
                <div ref={equipRef} className="relative">
                  <div className="mb-1 text-xs font-semibold text-zinc-700">
                    Equipment
                  </div>

                  <button
                    onClick={() => setIsEquipOpen((v) => !v)}
                    className={[
                      "flex h-10 w-full items-center justify-between rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900",
                      selectErrors.name
                        ? "border-red-300 ring-2 ring-red-100"
                        : "border-zinc-200",
                    ].join(" ")}
                    type="button"
                  >
                    <span
                      className={selectedName ? "text-zinc-900" : "text-zinc-500"}
                    >
                      {selectedName
                        ? `${selectedName} (Available: ${selectedOption?.available ?? "-"})`
                        : "Select equipment"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  </button>

                  {selectErrors.name ? (
                    <div className="mt-1 text-xs text-red-600">
                      {selectErrors.name}
                    </div>
                  ) : null}

                  {isEquipOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[140] rounded-xl border border-zinc-200 bg-white shadow-lg">
                      <div className="max-h-[260px] overflow-auto p-1">
                        {EQUIPMENT_OPTIONS.map((opt) => {
                          const active = opt.name === selectedName;
                          return (
                            <button
                              key={opt.name}
                              type="button"
                              onClick={() => {
                                setSelectedName(opt.name);
                                setSelectErrors((s) => ({
                                  ...s,
                                  name: undefined,
                                }));
                                setIsEquipOpen(false);
                              }}
                              className={[
                                "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition",
                                active
                                  ? "bg-zinc-100 text-zinc-900"
                                  : "hover:bg-zinc-50 text-zinc-700",
                              ].join(" ")}
                            >
                              {opt.name} (Available: {opt.available})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-1 text-xs font-semibold text-zinc-700">
                    Quantity
                  </div>
                  <input
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="Enter quantity"
                    className={[
                      "h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none",
                      selectErrors.qty
                        ? "border-red-300 ring-2 ring-red-100"
                        : "border-zinc-200",
                    ].join(" ")}
                  />
                  {selectErrors.qty ? (
                    <div className="mt-1 text-xs text-red-600">
                      {selectErrors.qty}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsSelectOpen(false)}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addSelected}
                    className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** ========= Modal: Calendar Day Events ========= */
function CalendarDayEventsModal({
  open,
  dateLabel,
  events,
  onClose,
}: {
  open: boolean;
  dateLabel: string;
  events: EventItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                รายการ Event วันที่ {dateLabel}
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                ทั้งหมด {events.length} รายการ
              </div>
            </div>

            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-5 pb-5">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                ไม่มีรายการในวันนี้
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-zinc-900">
                          {ev.title}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {ev.code}
                        </div>
                      </div>

                      <StatusPill tone={ev.status.tone} text={ev.status.text} />
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs text-zinc-400">บริษัท</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900">
                          {ev.company}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-zinc-400">สถานที่</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900">
                          {ev.place}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-zinc-400">วันจัดงาน</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900">
                          {ev.date}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-zinc-400">อุปกรณ์</div>
                        <div className="mt-1 text-sm font-medium text-zinc-900">
                          {ev.items}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-zinc-400">รายละเอียด</div>
                      <div className="mt-1 text-sm text-zinc-700">
                        {ev.desc || "-"}
                      </div>
                    </div>
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

/** ========= Main Page ========= */
export default function Events({ role }: { role: Role }) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      if (!statusRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
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

  const [events, setEvents] = useState<EventItem[]>([
    {
      id: "EVT001",
      title: "Annual Meeting 2025",
      status: { text: "อนุมัติแล้ว", tone: "success" },
      code: "#EVT001",
      desc: "Annual shareholder meeting with presentation",
      company: "ABC Corporation",
      place: "Grand Hotel Bangkok",
      date: "2026-03-20 - 2026-03-21",
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
      date: "2026-03-19 - 2026-03-19",
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
      date: "2026-03-18 - 2026-03-20",
      items: "0 รายการ",
    },
  ]);

  const stats = useMemo(() => {
    const total = events.length;
    const pending = events.filter((e) => e.status.tone === "pending").length;
    const approved = events.filter((e) => e.status.tone === "success").length;
    const progress = events.filter((e) => e.status.tone === "progress").length;

    return [
      {
        label: "ทั้งหมด",
        value: total,
        tone: "neutral" as const,
        icon: <Archive className="h-5 w-5" />,
      },
      {
        label: "รออนุมัติ",
        value: pending,
        tone: "amber" as const,
        icon: <Clock3 className="h-5 w-5" />,
      },
      {
        label: "อนุมัติแล้ว",
        value: approved,
        tone: "emerald" as const,
        icon: <ThumbsUp className="h-5 w-5" />,
      },
      {
        label: "กำลังดำเนินการ",
        value: progress,
        tone: "sky" as const,
        icon: <CheckCircle2 className="h-5 w-5" />,
      },
    ];
  }, [events]);

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageEventId, setManageEventId] = useState<string | null>(null);

  const [equipmentByEvent, setEquipmentByEvent] = useState<
    Record<string, SelectedEquipment[]>
  >({});

  const [search, setSearch] = useState("");
  const [calendarDetail, setCalendarDetail] = useState<{
    dateKey: string;
    events: EventItem[];
  } | null>(null);

  const onManageItems = (eventId: string) => {
    setManageEventId(eventId);
    setIsManageOpen(true);
  };

  const onDeleteEvent = (eventId: string) => {
    const target = events.find((ev) => ev.id === eventId);
    if (!target) return;

    const confirmed = window.confirm(`ลบ Event \"${target.title}\" ใช่หรือไม่?`);
    if (!confirmed) return;

    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));

    setEquipmentByEvent((prev) => {
      if (!(eventId in prev)) return prev;
      const next = { ...prev };
      delete next[eventId];
      return next;
    });

    if (manageEventId === eventId) {
      setIsManageOpen(false);
      setManageEventId(null);
    }

    setCalendarDetail((prev) => {
      if (!prev) return prev;
      const nextEvents = prev.events.filter((ev) => ev.id !== eventId);
      if (nextEvents.length === 0) return null;
      return { ...prev, events: nextEvents };
    });
  };

  const activeEvent = useMemo(() => {
    if (!manageEventId) return null;
    return events.find((e) => e.id === manageEventId) ?? null;
  }, [manageEventId, events]);

  const activeEventRange = useMemo(() => {
    if (!activeEvent) return { startStr: "", endStr: "" };
    return parseDateRange(activeEvent.date);
  }, [activeEvent]);

  const nextEventId = useMemo(() => {
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
    const newId = `EVT${pad2(nextEventId).padStart(3, "0")}`;
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
      status: { text: "รออนุมัติ", tone: "pending" },
      organizer: payload.organizer,
      branchCode: payload.branchCode,
      budgetTHB: payload.budgetTHB,
      attendees: payload.attendees,
    };

    setEvents((prev) => [...prev, newEvent]);
    setView("list");
  };

  const visibleEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const filtered =
      statusFilter === "สถานะทั้งหมด"
        ? events
        : events.filter((e) => e.status.text === statusFilter);

    if (!keyword) return filtered;

    return filtered.filter((e) => {
      const haystack = [
        e.title,
        e.company,
        e.place,
        e.desc,
        e.organizer ?? "",
        e.code,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [events, statusFilter, search]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventItem[]> = {};

    for (const e of visibleEvents) {
      const { startStr, endStr } = parseDateRange(e.date);
      const start = toDateLocal(startStr);
      const end = toDateLocal(endStr);

      let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());

      while (cur <= end) {
        const key = toYMD(cur);
        if (!map[key]) map[key] = [];
        map[key].push(e);
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

    const startOffset = first.getDay();
    const totalDays = last.getDate();
    const cells: Array<{ date: Date; inMonth: boolean }> = [];

    for (let i = 0; i < startOffset; i++) {
      const d = new Date(y, m, 1 - (startOffset - i));
      cells.push({ date: d, inMonth: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      cells.push({ date: new Date(y, m, d), inMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const lastCell = cells[cells.length - 1].date;
      const next = new Date(
        lastCell.getFullYear(),
        lastCell.getMonth(),
        lastCell.getDate() + 1
      );
      cells.push({ date: next, inMonth: false });
    }

    return cells;
  }, [monthCursor]);

  const todayKey = useMemo(() => toYMD(new Date()), []);
  const monthKey = (d: Date) => toYMD(d);

  return (
    <div className="px-6 py-8">
      <CreateEventModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />

      <ManageEquipmentModal
        open={isManageOpen}
        eventTitle={activeEvent?.title ?? ""}
        startDateInitial={activeEventRange.startStr}
        endDateInitial={activeEventRange.endStr}
        initialEquipment={
          manageEventId ? equipmentByEvent[manageEventId] ?? [] : []
        }
        onClose={() => {
          setIsManageOpen(false);
          setManageEventId(null);
        }}
        onSaveApprove={({ startDate, endDate, equipment }) => {
          if (!manageEventId) return;

          setEquipmentByEvent((prev) => ({ ...prev, [manageEventId]: equipment }));

          setEvents((prev) =>
            prev.map((ev) => {
              if (ev.id !== manageEventId) return ev;
              return {
                ...ev,
                date: `${startDate} - ${endDate}`,
                items: `${equipment.length} รายการ`,
                status: { text: "อนุมัติแล้ว", tone: "success" },
              };
            })
          );
        }}
      />

      <CalendarDayEventsModal
        open={!!calendarDetail}
        dateLabel={
          calendarDetail
            ? toDateLocal(calendarDetail.dateKey).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : ""
        }
        events={calendarDetail?.events ?? []}
        onClose={() => setCalendarDetail(null)}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            จัดการ Event
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            สร้างและจัดการงาน Event พร้อมตรวจสอบ Stock
          </p>
        </div>

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

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            value={s.value}
            label={s.label}
            tone={s.tone}
          />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-600"
              placeholder="ค้นหา Event ด้วย ชื่อ, บริษัท, ผู้จัด, สถานที่..."
            />
          </div>

          <div ref={statusRef} className="relative md:w-[240px]">
            <button
              onClick={() => setIsStatusOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              <span
                className={
                  statusFilter === "สถานะทั้งหมด"
                    ? "text-zinc-700"
                    : "text-zinc-800"
                }
              >
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
                        active
                          ? "bg-zinc-100 text-zinc-900"
                          : "hover:bg-zinc-50 text-zinc-700",
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

      <div className="mt-5 text-sm text-zinc-500">
        แสดง {visibleEvents.length} จาก {events.length} Events
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("list")}
            className={[
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition",
              view === "list"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white text-zinc-600 hover:bg-zinc-100",
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
                    <h2 className="truncate text-base font-semibold text-zinc-900">
                      {e.title}
                    </h2>
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
                      onClick={() => onDeleteEvent(e.id)}
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
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {e.company}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">สถานที่</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {e.place}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">วันจัดงาน</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {e.date}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">อุปกรณ์</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {e.items}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "calendar" && (
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-semibold text-zinc-900">
              {formatMonthThai(monthCursor)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setMonthCursor(
                    (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                  )
                }
                className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                title="เดือนก่อน"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() =>
                  setMonthCursor(
                    (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                  )
                }
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
              const dayEvents = eventsByDay[key] ?? [];
              const visibleDayEvents = dayEvents.slice(0, 2);
              const moreCount = Math.max(0, dayEvents.length - visibleDayEvents.length);
              const hasEvent = dayEvents.length > 0;

              const cellCls = [
                "min-h-[120px] rounded-2xl border p-3 transition",
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
                      {hasEvent && (
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      )}
                      {isToday && (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {visibleDayEvents.map((ev) => (
                      <button
                        key={`${key}-${ev.id}`}
                        type="button"
                        onClick={() =>
                          setCalendarDetail({
                            dateKey: key,
                            events: dayEvents,
                          })
                        }
                        className={[
                          "block w-full truncate rounded-lg border-l-4 px-2 py-1 text-left text-[11px] font-medium",
                          getCalendarEventToneClass(ev.status.tone),
                          !inMonth ? "opacity-60" : "",
                        ].join(" ")}
                        title={`${ev.title} • ${ev.status.text}`}
                      >
                        {ev.title}
                      </button>
                    ))}

                    {moreCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarDetail({
                            dateKey: key,
                            events: dayEvents,
                          })
                        }
                        className="px-1 text-left text-[11px] font-medium text-zinc-500 hover:text-zinc-700 hover:underline"
                      >
                        +{moreCount} รายการ
                      </button>
                    )}
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
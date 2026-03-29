"use client";

import React, { useMemo, useState } from "react";
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

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "green" | "amber" | "zinc";
}) {
  const map = {
    blue: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    green: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    amber: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    zinc: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
}

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "neutral" | "emerald" | "violet" | "red";
}) {
  const toneMap = {
    neutral: "bg-zinc-100 text-zinc-700",
    emerald: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
    red: "bg-red-100 text-red-700",
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

function fmt(n: number) {
  return new Intl.NumberFormat("th-TH").format(n);
}

/** ========= Modal: Stock Detail ========= */
function StockDetailModal({
  item,
  onClose,
}: {
  item: StockRow | null;
  onClose: () => void;
}) {
  if (!item) return null;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
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
            <div>
              <div className="text-lg font-semibold text-zinc-900">รายละเอียดอุปกรณ์</div>
              <div className="mt-1 text-sm text-zinc-500">{item.name}</div>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* ID */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-zinc-500">รหัสอุปกรณ์</div>
                  <div className="flex items-center gap-2">
                    <Pill tone="blue">{item.id}</Pill>
                    <Pill tone="blue">{item.code}</Pill>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-zinc-500">สถานะ</div>
                  <Pill tone={statusTone as any}>{item.status}</Pill>
                </div>

                {/* Name */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-zinc-500">ชื่ออุปกรณ์</div>
                  <div className="font-semibold text-zinc-900">{item.name}</div>
                </div>

                {/* Brand */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-zinc-500">ยี่ห้อ</div>
                  <div className="text-zinc-800">{item.brand}</div>
                </div>

                {/* Category */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-zinc-500">ประเภท</div>
                  <div className="flex items-center gap-2">
                    <Pill tone={catTone as any}>{item.category}</Pill>
                    <span className="text-zinc-500">{item.system}</span>
                  </div>
                </div>

                {/* Zone */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-zinc-500">โซนจัดเก็บ</div>
                  <Pill tone="blue">{item.zone}</Pill>
                </div>

                {/* Quantity */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-zinc-500">จำนวนรวม</div>
                  <div className="text-lg font-semibold text-zinc-900">{fmt(item.qty)} ยูนิต</div>
                </div>

                {/* Available */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-zinc-500">จำนวนพร้อมใช้</div>
                  <div className="text-lg font-semibold text-emerald-600">{fmt(item.available)} ยูนิต</div>
                </div>

                {/* Price Per Day */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-zinc-500">ค่าเช่า/วัน</div>
                  <div className="text-lg font-semibold text-zinc-900">{fmt(item.pricePerDay)} ฿</div>
                </div>

                {/* Cost */}
                <div>
                  <div className="mb-2 text-xs font-semibold text-zinc-500">ราคาต้นทุน</div>
                  <div className="text-lg font-semibold text-zinc-900">{fmt(item.cost)} ฿</div>
                </div>
              </div>

              {/* Usage Summary */}
              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="mb-3 text-xs font-semibold text-zinc-700">สรุปการใช้งาน</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-zinc-900">{fmt(item.available)}</div>
                    <div className="text-xs text-zinc-500">พร้อมใช้</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-violet-600">{fmt(item.qty - item.available)}</div>
                    <div className="text-xs text-zinc-500">ใช้งานอยู่</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900">{fmt(item.qty)}</div>
                    <div className="text-xs text-zinc-500">รวมทั้งหมด</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={onClose} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ปิด</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ========= Modal: Add New Stock ========= */
type AddForm = {
  id: string;
  status: ItemStatus;
  name: string;
  brand: string;
  category: Category;
  typeLabel: string;
  zone: string;
  qty: string;
  pricePerDay: string;
  cost: string;
};

function Field({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </div>
      {children}
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}

function AddStockModal({
  open,
  onClose,
  onAdd,
  nextId,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (row: StockRow) => void;
  nextId: string;
}) {
  const [form, setForm] = useState<AddForm>({
    id: nextId,
    status: "พร้อมใช้",
    name: "",
    brand: "",
    category: "ไฟฟ้า",
    typeLabel: "อุปกรณ์ทั่วไป",
    zone: "โซน A",
    qty: "",
    pricePerDay: "",
    cost: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    setForm((s) => ({ ...s, id: nextId }));
    setErrors({});
  }, [open, nextId]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
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
    if (form.qty.trim() && (Number.isNaN(Number(form.qty)) || Number(form.qty) <= 0))
      e.qty = "จำนวนต้องเป็นตัวเลขมากกว่า 0";
    if (!form.pricePerDay.trim()) e.pricePerDay = "กรุณาระบุค่าเช่า/วัน";
    if (form.pricePerDay.trim() && (Number.isNaN(Number(form.pricePerDay)) || Number(form.pricePerDay) < 0))
      e.pricePerDay = "ค่าเช่าต้องเป็นตัวเลข";
    if (!form.cost.trim()) e.cost = "กรุณาระบุราคาต้นทุน";
    if (form.cost.trim() && (Number.isNaN(Number(form.cost)) || Number(form.cost) < 0))
      e.cost = "ราคาต้นทุนต้องเป็นตัวเลข";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const qty = Number(form.qty);
    const codePrefix = form.category === "ไฟฟ้า" ? "LT" : form.category === "ผ้าใบ" ? "ST" : "GR";
    const code = `${codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    onAdd({
      id: form.id.trim(),
      code,
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      system: form.typeLabel.trim(),
      zone: form.zone,
      status: form.status,
      qty,
      available: qty,
      pricePerDay: Number(form.pricePerDay),
      cost: Number(form.cost),
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">เพิ่มอุปกรณ์ใหม่</div>
              <div className="mt-1 text-sm text-zinc-500">กรอกข้อมูลอุปกรณ์</div>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="รหัส" required error={errors.id}>
                <input value={form.id} onChange={(e) => setForm((s) => ({ ...s, id: e.target.value }))} placeholder="EQ-001"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.id ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="สถานะ" required>
                <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as ItemStatus }))}
                  className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="พร้อมใช้">พร้อมใช้</option>
                  <option value="ใช้งานอยู่">ใช้งานอยู่</option>
                  <option value="ซ่อมแซม">ซ่อมแซม</option>
                </select>
              </Field>

              <Field label="ชื่ออุปกรณ์" required error={errors.name}>
                <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="ชื่ออุปกรณ์"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.name ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="ยี่ห้อ" required error={errors.brand}>
                <input value={form.brand} onChange={(e) => setForm((s) => ({ ...s, brand: e.target.value }))} placeholder="ยี่ห้อ"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.brand ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="โซน" required error={errors.zone}>
                <select value={form.zone} onChange={(e) => setForm((s) => ({ ...s, zone: e.target.value }))}
                  className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="โซน A">โซน A</option>
                  <option value="โซน B">โซน B</option>
                  <option value="โซน C">โซน C</option>
                </select>
              </Field>

              <Field label="ประเภท" required>
                <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as Category }))}
                  className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="ไฟฟ้า">ไฟฟ้า</option>
                  <option value="ผ้าใบ">ผ้าใบ</option>
                  <option value="ตกแต่ง">ตกแต่ง</option>
                </select>
              </Field>

              <Field label="จำนวน" required error={errors.qty}>
                <input value={form.qty} onChange={(e) => setForm((s) => ({ ...s, qty: e.target.value }))} placeholder="ระบุจำนวน"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.qty ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="ค่าเช่า/วัน (บาท)" required error={errors.pricePerDay}>
                <input value={form.pricePerDay} onChange={(e) => setForm((s) => ({ ...s, pricePerDay: e.target.value }))} placeholder="ระบุค่าเช่าต่อวัน"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.pricePerDay ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="ราคาต้นทุน (บาท)" required error={errors.cost}>
                <input value={form.cost} onChange={(e) => setForm((s) => ({ ...s, cost: e.target.value }))} placeholder="ระบุราคาต้นทุน"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.cost ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="หมวดหมู่" required>
                <input value={form.typeLabel} onChange={(e) => setForm((s) => ({ ...s, typeLabel: e.target.value }))} placeholder="เช่น โปรเจคเตอร์, ไมค์, เครื่องเสียง"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200" />
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

/** ========= Modal: Edit Stock ========= */
type EditForm = {
  status: ItemStatus;
  name: string;
  brand: string;
  category: Category;
  typeLabel: string;
  zone: string;
  qty: string;
  available: string;
  pricePerDay: string;
  cost: string;
};

function EditStockModal({
  open,
  item,
  onClose,
  onUpdate,
}: {
  open: boolean;
  item: StockRow | null;
  onClose: () => void;
  onUpdate: (updatedItem: StockRow) => void;
}) {
  const [form, setForm] = useState<EditForm>({
    status: "พร้อมใช้",
    name: "",
    brand: "",
    category: "ไฟฟ้า",
    typeLabel: "อุปกรณ์ทั่วไป",
    zone: "โซน A",
    qty: "",
    available: "",
    pricePerDay: "",
    cost: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open || !item) return;
    setForm({
      status: item.status,
      name: item.name,
      brand: item.brand,
      category: item.category,
      typeLabel: item.system,
      zone: item.zone,
      qty: String(item.qty),
      available: String(item.available),
      pricePerDay: String(item.pricePerDay),
      cost: String(item.cost),
    });
    setErrors({});
  }, [open, item]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "กรุณากรอกชื่ออุปกรณ์";
    if (!form.brand.trim()) e.brand = "กรุณากรอกยี่ห้อ";
    if (!form.zone.trim()) e.zone = "กรุณาเลือกโซน";
    if (!form.qty.trim()) e.qty = "กรุณาระบุจำนวน";
    if (form.qty.trim() && (Number.isNaN(Number(form.qty)) || Number(form.qty) <= 0))
      e.qty = "จำนวนต้องเป็นตัวเลขมากกว่า 0";
    if (!form.available.trim()) e.available = "กรุณาระบุจำนวนพร้อมใช้";
    if (form.available.trim() && (Number.isNaN(Number(form.available)) || Number(form.available) < 0))
      e.available = "จำนวนพร้อมใช้ต้องเป็นตัวเลข";
    if (form.available.trim() && form.qty.trim() && Number(form.available) > Number(form.qty))
      e.available = "จำนวนพร้อมใช้ต้องไม่เกินจำนวนรวม";
    if (!form.pricePerDay.trim()) e.pricePerDay = "กรุณาระบุค่าเช่า/วัน";
    if (form.pricePerDay.trim() && (Number.isNaN(Number(form.pricePerDay)) || Number(form.pricePerDay) < 0))
      e.pricePerDay = "ค่าเช่าต้องเป็นตัวเลข";
    if (!form.cost.trim()) e.cost = "กรุณาระบุราคาต้นทุน";
    if (form.cost.trim() && (Number.isNaN(Number(form.cost)) || Number(form.cost) < 0))
      e.cost = "ราคาต้นทุนต้องเป็นตัวเลข";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate() || !item) return;
    onUpdate({
      ...item,
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      system: form.typeLabel.trim(),
      zone: form.zone,
      status: form.status,
      qty: Number(form.qty),
      available: Number(form.available),
      pricePerDay: Number(form.pricePerDay),
      cost: Number(form.cost),
    });
    onClose();
  };

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">แก้ไขอุปกรณ์</div>
              <div className="mt-1 text-sm text-zinc-500">{item.name}</div>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="รหัส" required>
                <input disabled value={item.id} placeholder="EQ-001"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-sm text-zinc-500 outline-none" />
              </Field>

              <Field label="สถานะ" required>
                <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as ItemStatus }))}
                  className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="พร้อมใช้">พร้อมใช้</option>
                  <option value="ใช้งานอยู่">ใช้งานอยู่</option>
                  <option value="ซ่อมแซม">ซ่อมแซม</option>
                </select>
              </Field>

              <Field label="ชื่ออุปกรณ์" required error={errors.name}>
                <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="ชื่ออุปกรณ์"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.name ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="ยี่ห้อ" required error={errors.brand}>
                <input value={form.brand} onChange={(e) => setForm((s) => ({ ...s, brand: e.target.value }))} placeholder="ยี่ห้อ"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.brand ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="โซน" required error={errors.zone}>
                <select value={form.zone} onChange={(e) => setForm((s) => ({ ...s, zone: e.target.value }))}
                  className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="โซน A">โซน A</option>
                  <option value="โซน B">โซน B</option>
                  <option value="โซน C">โซน C</option>
                </select>
              </Field>

              <Field label="ประเภท" required>
                <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as Category }))}
                  className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-10 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="ไฟฟ้า">ไฟฟ้า</option>
                  <option value="ผ้าใบ">ผ้าใบ</option>
                  <option value="ตกแต่ง">ตกแต่ง</option>
                </select>
              </Field>

              <Field label="จำนวนรวม" required error={errors.qty}>
                <input value={form.qty} onChange={(e) => setForm((s) => ({ ...s, qty: e.target.value }))} placeholder="ระบุจำนวน"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.qty ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="จำนวนพร้อมใช้" required error={errors.available}>
                <input value={form.available} onChange={(e) => setForm((s) => ({ ...s, available: e.target.value }))} placeholder="ระบุจำนวนพร้อมใช้"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.available ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="ค่าเช่า/วัน (บาท)" required error={errors.pricePerDay}>
                <input value={form.pricePerDay} onChange={(e) => setForm((s) => ({ ...s, pricePerDay: e.target.value }))} placeholder="ระบุค่าเช่าต่อวัน"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.pricePerDay ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="ราคาต้นทุน (บาท)" required error={errors.cost}>
                <input value={form.cost} onChange={(e) => setForm((s) => ({ ...s, cost: e.target.value }))} placeholder="ระบุราคาต้นทุน"
                  className={["h-10 w-full rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900 outline-none", errors.cost ? "border-red-300 ring-2 ring-red-100" : "border-zinc-200 focus:ring-2 focus:ring-zinc-200"].join(" ")} />
              </Field>

              <Field label="หมวดหมู่" required>
                <input value={form.typeLabel} onChange={(e) => setForm((s) => ({ ...s, typeLabel: e.target.value }))} placeholder="เช่น โปรเจคเตอร์, ไมค์, เครื่องเสียง"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200" />
              </Field>
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

// ✅ รับ stockData และ onStockChange จาก AppShell
export default function Stock({
  role,
  stockData,
  onStockChange,
}: {
  role: Role;
  stockData: StockRow[];
  onStockChange: (updater: StockRow[] | ((prev: StockRow[]) => StockRow[])) => void;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ทั้งหมด" | ItemStatus>("ทั้งหมด");
  const [category, setCategory] = useState<"ทั้งหมด" | Category>("ทั้งหมด");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<StockRow | null>(null);
  const [editItem, setEditItem] = useState<StockRow | null>(null);

  const rows = useMemo(() => {
    return stockData.filter((r) => {
      const hitQ =
        q.trim().length === 0 ||
        [r.id, r.code, r.name, r.brand, r.system, r.zone].some((x) =>
          x.toLowerCase().includes(q.toLowerCase())
        );
      const hitStatus = status === "ทั้งหมด" || r.status === status;
      const hitCat = category === "ทั้งหมด" || r.category === category;
      return hitQ && hitStatus && hitCat;
    });
  }, [q, status, category, stockData]);

  // ✅ stats คำนวณจาก stockData จริง
  const stats = useMemo(() => {
    const total = stockData.reduce((s, r) => s + r.qty, 0);
    const ready = stockData.reduce((s, r) => s + r.available, 0);
    const inUse = stockData.reduce((s, r) => s + (r.qty - r.available), 0);
    const repair = stockData.filter((r) => r.status === "ซ่อมแซม").length;
    return { total, ready, inUse, repair };
  }, [stockData]);

  const showEdit = role !== "SA";
  const showDelete = role === "Manager";

  const nextId = useMemo(() => {
    let max = 0;
    for (const r of stockData) {
      const m = r.id.match(/^EQ(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return `EQ-${String(max + 1).padStart(3, "0")}`;
  }, [stockData]);

  const handleAdd = (row: StockRow) => {
    const normalizedId = row.id.replace("-", "");
    onStockChange((prev) => [{ ...row, id: normalizedId }, ...prev]);
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("ต้องการลบอุปกรณ์นี้ใช่หรือไม่?")) return;
    onStockChange((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdate = (updatedItem: StockRow) => {
    onStockChange((prev) => prev.map((r) => (r.id === updatedItem.id ? updatedItem : r)));
    setEditItem(null);
  };

  return (
    <div className="px-6 py-8">
      <AddStockModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        nextId={nextId}
        onAdd={handleAdd}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">จัดการ Stock</h1>
            <p className="mt-1 text-sm text-zinc-500">ระบบจัดการและค้นหาอุปกรณ์</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50">
            <Download className="h-4 w-4" />
            ส่งออก Excel
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            เพิ่มใหม่
          </button>
        </div>
      </div>

      {/* ✅ Stats คำนวณจาก stockData จริง */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Package className="h-5 w-5" />} value={stats.total} label="รวมทั้งหมด" tone="neutral" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} value={stats.ready} label="พร้อมใช้" tone="emerald" />
        <StatCard icon={<Clock3 className="h-5 w-5" />} value={stats.inUse} label="ใช้งานอยู่" tone="violet" />
        <StatCard icon={<Wrench className="h-5 w-5" />} value={stats.repair} label="ซ่อมแซม" tone="red" />
      </div>

      {/* Search + Filter */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="ค้นหาอุปกรณ์ด้วย ชื่อ, รหัส..."
            />
          </div>

          <div className="relative md:w-[220px]">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}
              className="h-[52px] w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-800 shadow-sm outline-none hover:bg-zinc-50">
              <option value="ทั้งหมด">สถานะทั้งหมด</option>
              <option value="พร้อมใช้">พร้อมใช้</option>
              <option value="ใช้งานอยู่">ใช้งานอยู่</option>
              <option value="ซ่อมแซม">ซ่อมแซม</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>

          <div className="relative md:w-[220px]">
            <select value={category} onChange={(e) => setCategory(e.target.value as any)}
              className="h-[52px] w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-800 shadow-sm outline-none hover:bg-zinc-50">
              <option value="ทั้งหมด">ประเภททั้งหมด</option>
              <option value="ไฟฟ้า">ไฟฟ้า</option>
              <option value="ผ้าใบ">ผ้าใบ</option>
              <option value="ตกแต่ง">ตกแต่ง</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>
      </div>

      <div className="mt-5 text-sm text-zinc-500">
        แสดง {rows.length} จาก {stockData.length} รายการ
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-white">
              <tr className="border-b border-zinc-200 text-left text-xs font-semibold text-zinc-500">
                <th className="px-6 py-4">ID / รหัส</th>
                <th className="px-6 py-4">ชื่ออุปกรณ์</th>
                <th className="px-6 py-4">ยี่ห้อ</th>
                <th className="px-6 py-4">ประเภท</th>
                <th className="px-6 py-4">จัดเก็บ</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-center">จำนวน</th>
                <th className="px-6 py-4 text-center">ค่าเช่า/วัน</th>
                <th className="px-6 py-4 text-center">ราคาต้นทุน</th>
                <th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm text-zinc-800">
              {rows.map((r, idx) => {
                const catTone = r.category === "ไฟฟ้า" ? "amber" : "zinc";
                const statusTone = r.status === "พร้อมใช้" ? "green" : r.status === "ใช้งานอยู่" ? "blue" : "amber";
                return (
                  <tr key={`${r.id}-${idx}`} className={idx % 2 ? "bg-zinc-50/30" : "bg-white"}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Pill tone="blue">{r.id}</Pill>
                        <Pill tone="blue">{r.code}</Pill>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-zinc-900">{r.name}</div>
                    </td>
                    <td className="px-6 py-5">{r.brand}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Pill tone={catTone as any}>{r.category}</Pill>
                        <span className="text-zinc-500">{r.system}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Pill tone="blue">{r.zone}</Pill>
                    </td>
                    <td className="px-6 py-5">
                      <Pill tone={statusTone as any}>{r.status}</Pill>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {/* ✅ แสดง available ที่อัปเดตแล้ว */}
                      <div className="font-semibold">{fmt(r.qty)}</div>
                      <div className="text-xs text-zinc-500">({fmt(r.available)} พร้อมใช้)</div>
                    </td>
                    <td className="px-6 py-5 text-center">{fmt(r.pricePerDay)} ฿</td>
                    <td className="px-6 py-5 text-center">{fmt(r.cost)} ฿</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setDetailItem(r)} className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50" title="ดู">
                          <Eye className="h-4 w-4" />
                        </button>
                        {showEdit && (
                          <button onClick={() => setEditItem(r)} className="grid h-9 w-9 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50" title="แก้ไข">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {showDelete && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="grid h-9 w-9 place-items-center rounded-2xl border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50"
                            title="ลบ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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

      <StockDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      <EditStockModal open={editItem !== null} item={editItem} onClose={() => setEditItem(null)} onUpdate={handleUpdate} />
    </div>
  );
}

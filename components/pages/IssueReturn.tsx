"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  ArrowRight,
  Package,
  CornerDownLeft,
  CheckCircle2,
  Plus,
  X,
  ChevronDown,
  Camera,
  Upload,
  Package2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { StockRow } from "../AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = "issue" | "inuse" | "return";

// สถานะของแต่ละ Event ใน Issue/Return flow
// "ready"   = อนุมัติแล้ว รอ Issue
// "inuse"   = Issue ออกไปแล้ว กำลังใช้งาน
// "returned"= คืนของแล้ว เสร็จสิ้น
type EventStatus = "ready" | "inuse" | "returned";

type IssueEvent = {
  id: string;
  title: string;
  code: string;
  company: string;
  eventDate: string;
  issueDate: string;
  equipment: string;
  status: EventStatus;
};

type EquipmentItem = {
  id: string;
  name: string;
  qty: number;
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

type EquipmentOption = {
  id: string;
  name: string;
  available: number;
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: "amber" | "emerald" | "violet" | "sky" }) {
  const map = { amber: "bg-amber-100 text-amber-700", emerald: "bg-emerald-100 text-emerald-700", violet: "bg-violet-100 text-violet-700", sky: "bg-sky-100 text-sky-700" } as const;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${map[tone]}`}>{icon}</div>
        <div><div className="text-xl font-semibold text-zinc-900">{value}</div><div className="text-sm text-zinc-500">{label}</div></div>
      </div>
    </div>
  );
}

function StatusPill({ text, tone }: { text: string; tone: "success" | "pending" | "blue" | "zinc" }) {
  const map = {
    success: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    blue: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    zinc: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
  } as const;
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}>{text}</span>;
}

// ─── Modal: เลือกอุปกรณ์ (ใช้ร่วมกันทั้ง Quick Issue และ Quick Return) ─────

function SelectEquipmentModal({
  open,
  onClose,
  onAdd,
  equipmentOptions,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: EquipmentItem) => void;
  equipmentOptions: EquipmentOption[];
}) {
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [error, setError] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) { setSelectedId(""); setQty(""); setError(""); setDropOpen(false); }
  }, [open]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!dropRef.current?.contains(e.target as Node)) setDropOpen(false); };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const selected = equipmentOptions.find((o) => o.id === selectedId);

  const submit = () => {
    const q = Number(qty);
    if (!selected) { setError("กรุณาเลือกอุปกรณ์"); return; }
    if (!q || q <= 0) { setError("กรุณาระบุจำนวนที่ถูกต้อง"); return; }
    if (q > selected.available) { setError(`มีอุปกรณ์เพียง ${selected.available} ชิ้น`); return; }
    onAdd({ id: selected.id, name: selected.name, qty: q });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div><div className="text-lg font-semibold text-zinc-900">เลือกอุปกรณ์</div><div className="mt-1 text-sm text-zinc-500">เลือกอุปกรณ์และระบุจำนวน</div></div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"><X className="h-4 w-4" /></button>
          </div>

          <div className="px-5 pb-5 space-y-4">
            {/* Equipment dropdown */}
            <div ref={dropRef} className="relative">
              <div className="mb-1 text-xs font-semibold text-zinc-700">อุปกรณ์ <span className="text-red-600">*</span></div>
              <button type="button" onClick={() => setDropOpen(v => !v)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900">
                <span className={selected ? "text-zinc-900" : "text-zinc-400"}>{selected ? `${selected.name} (พร้อมใช้: ${selected.available})` : "เลือกอุปกรณ์..."}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
              </button>
              {dropOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                  {equipmentOptions.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => { setSelectedId(opt.id); setDropOpen(false); setError(""); }}
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50 ${opt.id === selectedId ? "bg-zinc-100 font-semibold" : ""}`}>
                      <span>{opt.name}</span>
                      <span className="text-xs text-zinc-400">พร้อมใช้: {opt.available}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <div className="mb-1 text-xs font-semibold text-zinc-700">จำนวน <span className="text-red-600">*</span></div>
              <input value={qty} onChange={e => { setQty(e.target.value); setError(""); }} type="number" min="1" placeholder="ระบุจำนวน"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={onClose} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ยกเลิก</button>
              <button onClick={submit} className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                <span className="flex items-center gap-2"><Plus className="h-4 w-4" />เพิ่ม</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Quick Issue ───────────────────────────────────────────────────────
// ใช้สำหรับการเบิกอุปกรณ์แบบเร่งด่วน ไม่ผ่าน Event

function QuickIssueModal({
  open,
  onClose,
  onConfirm,
  equipmentOptions,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: EquipmentItem[]) => void;
  equipmentOptions: EquipmentOption[];
}) {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  React.useEffect(() => { if (!open) setItems([]); }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !isSelectOpen) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isSelectOpen]);

  const addItem = (item: EquipmentItem) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) { const next = [...prev]; next[idx].qty += item.qty; return next; }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  if (!open) return null;

  return (
    <>
      <SelectEquipmentModal open={isSelectOpen} onClose={() => setIsSelectOpen(false)} onAdd={addItem} equipmentOptions={equipmentOptions} />
      <div className="fixed inset-0 z-[140]">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 p-5">
              <div>
                <div className="text-lg font-semibold text-zinc-900">Quick Issue Equipment</div>
                <div className="mt-1 text-sm text-zinc-500">เบิกอุปกรณ์เร่งด่วน (ไม่ผ่าน Event)</div>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"><X className="h-4 w-4" /></button>
            </div>

            <div className="px-5 pb-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-800">อุปกรณ์ที่เลือก ({items.length})</div>
                <button onClick={() => setIsSelectOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm">
                  <Plus className="h-4 w-4" />เพิ่มอุปกรณ์
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
                  <Package2 className="h-10 w-10 text-zinc-300" />
                  <div className="mt-3 text-sm text-zinc-400">ยังไม่ได้เลือกอุปกรณ์</div>
                </div>
              ) : (
                <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">{item.name}</div>
                        <div className="text-xs text-zinc-500">จำนวน: {item.qty} ชิ้น</div>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="grid h-8 w-8 place-items-center rounded-lg text-red-400 hover:bg-red-50"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button onClick={onClose} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ยกเลิก</button>
                <button onClick={() => { onConfirm(items); onClose(); }} disabled={items.length === 0}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                  <ArrowRight className="h-4 w-4" />ยืนยันการเบิก
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Modal: Quick Return ──────────────────────────────────────────────────────
// ใช้สำหรับการคืนอุปกรณ์แบบเร่งด่วน พร้อมถ่ายรูปหลักฐาน

function QuickReturnModal({
  open,
  onClose,
  onConfirm,
  equipmentOptions,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: EquipmentItem[], damaged: boolean, photos: File[]) => void;
  equipmentOptions: EquipmentOption[];
}) {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [isDamaged, setIsDamaged] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => { if (!open) { setItems([]); setIsDamaged(false); setPhotos([]); } }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !isSelectOpen) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isSelectOpen]);

  const addItem = (item: EquipmentItem) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) { const next = [...prev]; next[idx].qty += item.qty; return next; }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotos(prev => [...prev, ...Array.from(files)]);
  };

  // ปุ่มยืนยันกดได้เมื่อ: มีอุปกรณ์ และ (ไม่เสียหาย หรือ เสียหายแต่มีรูป)
  const canConfirm = items.length > 0 && (!isDamaged || photos.length > 0);

  if (!open) return null;

  return (
    <>
      <SelectEquipmentModal open={isSelectOpen} onClose={() => setIsSelectOpen(false)} onAdd={addItem} equipmentOptions={equipmentOptions} />
      <div className="fixed inset-0 z-[140]">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 p-5">
              <div>
                <div className="text-lg font-semibold text-zinc-900">Quick Return Equipment</div>
                <div className="mt-1 text-sm text-zinc-500">คืนอุปกรณ์เร่งด่วน พร้อมหลักฐานรูปภาพ</div>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"><X className="h-4 w-4" /></button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-5 pb-5 space-y-4">
              {/* อุปกรณ์ที่จะคืน */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-800">อุปกรณ์ที่จะคืน ({items.length})</div>
                <button onClick={() => setIsSelectOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm">
                  <Plus className="h-4 w-4" />เพิ่มอุปกรณ์
                </button>
              </div>

              {items.length === 0 ? (
                <div className="flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
                  <Package2 className="h-8 w-8 text-zinc-300" />
                  <div className="mt-2 text-sm text-zinc-400">ยังไม่ได้เลือกอุปกรณ์</div>
                </div>
              ) : (
                <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">{item.name}</div>
                        <div className="text-xs text-zinc-500">จำนวน: {item.qty} ชิ้น</div>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="grid h-8 w-8 place-items-center rounded-lg text-red-400 hover:bg-red-50"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkbox อุปกรณ์เสียหาย */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50">
                <input type="checkbox" checked={isDamaged} onChange={e => setIsDamaged(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 accent-red-600" />
                <span>อุปกรณ์มีความเสียหาย/ชำรุด</span>
              </label>

              {/* แสดงสถานะ */}
              {!isDamaged ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div><div className="text-sm font-semibold text-emerald-800">อุปกรณ์อยู่ในสภาพดี</div><div className="text-xs text-emerald-600">ไม่พบความเสียหาย</div></div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                  <div><div className="text-sm font-semibold text-red-800">พบความเสียหาย</div><div className="text-xs text-red-600">กรุณาอัปโหลดรูปหลักฐานก่อนยืนยัน</div></div>
                </div>
              )}

              {/* อัปโหลดรูปภาพ */}
              <div>
                <div className="mb-2 text-sm font-semibold text-zinc-800">
                  รูปภาพหลักฐาน {isDamaged ? <span className="text-red-600">*</span> : <span className="text-zinc-400 font-normal">(ไม่บังคับ)</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => cameraRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50">
                    <Camera className="h-4 w-4" />เปิดกล้อง
                  </button>
                  <button type="button" onClick={() => uploadRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50">
                    <Upload className="h-4 w-4" />อัปโหลดรูป
                  </button>
                </div>
                <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addPhotos(e.target.files)} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => addPhotos(e.target.files)} />

                <div className="mt-2 min-h-[80px] rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-3">
                  {photos.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center py-4 text-center">
                      <Camera className="h-8 w-8 text-zinc-300" />
                      <div className="mt-2 text-xs text-zinc-400">
                        {isDamaged ? "ต้องอัปโหลดรูปอย่างน้อย 1 รูป" : "ถ่ายหรืออัปโหลดรูปเพิ่มเติมได้"}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((f, i) => (
                        <div key={i} className="rounded-xl border border-zinc-200 bg-white px-2 py-2 text-xs text-zinc-600">
                          <div className="truncate font-medium">{f.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button onClick={onClose} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ยกเลิก</button>
                <button onClick={() => { onConfirm(items, isDamaged, photos); onClose(); }} disabled={!canConfirm}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                  <CheckCircle2 className="h-4 w-4" />ยืนยันการคืน
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Modal: ยืนยัน Issue Event ────────────────────────────────────────────────
// popup เล็กๆ ก่อน Issue จริง

function ConfirmIssueModal({
  open,
  event,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  event: IssueEvent | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || !event) return null;

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
              <ArrowRight className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="mt-4 text-base font-semibold text-zinc-900">ยืนยันการเบิกอุปกรณ์</div>
            <div className="mt-2 text-sm text-zinc-500">
              เบิกอุปกรณ์สำหรับ <span className="font-semibold text-zinc-800">"{event.title}"</span>
            </div>
            <div className="mt-1 text-xs text-zinc-400">{event.equipment} • {event.company}</div>
            <div className="mt-6 flex gap-3">
              <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ยกเลิก</button>
              <button onClick={onConfirm} className="flex-1 h-10 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">ยืนยัน Issue</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: ยืนยัน Return Event ───────────────────────────────────────────────

function ConfirmReturnModal({
  open,
  event,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  event: IssueEvent | null;
  onConfirm: (damaged: boolean, photos: File[]) => void;
  onCancel: () => void;
}) {
  const [isDamaged, setIsDamaged] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => { if (!open) { setIsDamaged(false); setPhotos([]); } }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const canConfirm = !isDamaged || photos.length > 0;

  if (!open || !event) return null;

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">ยืนยันการคืนอุปกรณ์</div>
              <div className="mt-1 text-sm text-zinc-500">"{event.title}" • {event.equipment}</div>
            </div>
            <button onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"><X className="h-4 w-4" /></button>
          </div>

          <div className="px-5 pb-5 space-y-4">
            {/* Checkbox */}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50">
              <input type="checkbox" checked={isDamaged} onChange={e => setIsDamaged(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 accent-red-600" />
              <span>อุปกรณ์มีความเสียหาย/ชำรุด</span>
            </label>

            {isDamaged ? (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                <div><div className="text-sm font-semibold text-red-800">พบความเสียหาย</div><div className="text-xs text-red-600">กรุณาอัปโหลดรูปหลักฐาน</div></div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                <div><div className="text-sm font-semibold text-emerald-800">อุปกรณ์อยู่ในสภาพดี</div><div className="text-xs text-emerald-600">ไม่พบความเสียหาย</div></div>
              </div>
            )}

            {/* รูปภาพ */}
            <div>
              <div className="mb-2 text-sm font-semibold text-zinc-800">
                รูปภาพหลักฐาน {isDamaged ? <span className="text-red-600">*</span> : <span className="text-zinc-400 font-normal">(ไม่บังคับ)</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => cameraRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50">
                  <Camera className="h-4 w-4" />เปิดกล้อง
                </button>
                <button type="button" onClick={() => uploadRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50">
                  <Upload className="h-4 w-4" />อัปโหลดรูป
                </button>
              </div>
              <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setPhotos(p => [...p, ...Array.from(e.target.files!)]); }} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { if (e.target.files) setPhotos(p => [...p, ...Array.from(e.target.files!)]); }} />

              {photos.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {photos.map((f, i) => (
                    <div key={i} className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs text-zinc-600 truncate">{f.name}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50">ยกเลิก</button>
              <button onClick={() => onConfirm(isDamaged, photos)} disabled={!canConfirm}
                className="flex-1 h-10 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                ยืนยันการคืน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed right-6 top-6 z-[200]">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></div>
        <div className="text-sm font-semibold text-zinc-900">{message}</div>
        <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IssueReturn({
  stockData,
  onDeductStock,
  onReturnStock,
}: {
  stockData: StockRow[];
  onDeductStock: (equipmentList: { name: string; qty: number }[]) => void;
  onReturnStock: (equipmentList: { name: string; qty: number }[]) => void;
}) {
  const [tab, setTab] = useState<TabKey>("issue");

  // State หลัก: เก็บสถานะของทุก Event
  const [events, setEvents] = useState<IssueEvent[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("failed to load events");
        const rows = (await res.json()) as Array<{
          id: string;
          title: string;
          code: string;
          company: string;
          date: string;
          items: string;
          status: { text: string; tone: string };
        }>;

        const mapped = rows
          .filter((r) => r.status?.tone === "success")
          .map((r) => {
            const [startDate] = r.date.split(" - ").map((s) => s.trim());
            return {
              id: r.id,
              title: r.title,
              code: r.code,
              company: r.company,
              eventDate: startDate,
              issueDate: startDate,
              equipment: r.items,
              status: "ready" as EventStatus,
            };
          });

        setEvents((prev) => {
          if (prev.length === 0) return mapped;
          const currentStatus = new Map(prev.map((e) => [e.id, e.status]));
          return mapped.map((e) => ({ ...e, status: currentStatus.get(e.id) ?? "ready" }));
        });
      } catch {
        setEvents([]);
      }
    };
    loadEvents();
  }, []);

  const equipmentOptions = useMemo(
    () => stockData.map((s) => ({ id: s.id, name: s.name, available: s.available })),
    [stockData]
  );

  // Modal states
  const [isQuickIssueOpen, setIsQuickIssueOpen] = useState(false);
  const [isQuickReturnOpen, setIsQuickReturnOpen] = useState(false);
  const [confirmIssueEvent, setConfirmIssueEvent] = useState<IssueEvent | null>(null);
  const [confirmReturnEvent, setConfirmReturnEvent] = useState<IssueEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // กรอง Event ตาม tab
  const issueList = useMemo(() => events.filter(e => e.status === "ready"), [events]);
  const inUseList = useMemo(() => events.filter(e => e.status === "inuse"), [events]);
  const returnList = useMemo(() => events.filter(e => e.status === "inuse"), [events]); // tab Return ก็แสดง inuse เพื่อให้กด Return

  // แสดงรายการตาม tab ที่เลือก
  const visibleList = tab === "issue" ? issueList : tab === "inuse" ? inUseList : returnList;

  // Stats
  const stats = useMemo(() => ({
    pending: events.filter(e => e.status === "ready").length,
    readyToIssue: events.filter(e => e.status === "ready").length,
    inUse: events.filter(e => e.status === "inuse").length,
    readyToReturn: events.filter(e => e.status === "inuse").length,
  }), [events]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  // กด Issue → เปิด confirm modal
  const handleIssueClick = (event: IssueEvent) => setConfirmIssueEvent(event);

  // ยืนยัน Issue → เปลี่ยน status เป็น "inuse"
  const handleConfirmIssue = () => {
    if (!confirmIssueEvent) return;
    setEvents(prev => prev.map(e => e.id === confirmIssueEvent.id ? { ...e, status: "inuse" } : e));
    setToast(`✅ Issue สำเร็จ: "${confirmIssueEvent.title}"`);
    setConfirmIssueEvent(null);
    setTab("inuse"); // ย้ายไปดู tab In Use
  };

  // กด Return → เปิด confirm modal
  const handleReturnClick = (event: IssueEvent) => setConfirmReturnEvent(event);

  // ยืนยัน Return → เปลี่ยน status เป็น "returned"
  const handleConfirmReturn = (damaged: boolean) => {
    if (!confirmReturnEvent) return;
    setEvents(prev => prev.map(e => e.id === confirmReturnEvent.id ? { ...e, status: "returned" } : e));
    setToast(`✅ คืนอุปกรณ์สำเร็จ: "${confirmReturnEvent.title}"${damaged ? " (มีความเสียหาย)" : ""}`);
    setConfirmReturnEvent(null);
  };

  // Quick Issue (เบิกเร่งด่วน ไม่ผ่าน Event)
  const handleQuickIssue = (items: EquipmentItem[]) => {
    onDeductStock(items.map((i) => ({ name: i.name, qty: i.qty })));
    const names = items.map(i => i.name).join(", ");
    setToast(`✅ Quick Issue สำเร็จ: ${names}`);
  };

  // Quick Return (คืนเร่งด่วน ไม่ผ่าน Event)
  const handleQuickReturn = (items: EquipmentItem[], damaged: boolean) => {
    onReturnStock(items.map((i) => ({ name: i.name, qty: i.qty })));
    const names = items.map(i => i.name).join(", ");
    setToast(`✅ Quick Return สำเร็จ: ${names}${damaged ? " (มีความเสียหาย)" : ""}`);
  };

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Modals */}
      <QuickIssueModal open={isQuickIssueOpen} onClose={() => setIsQuickIssueOpen(false)} onConfirm={handleQuickIssue} equipmentOptions={equipmentOptions} />
      <QuickReturnModal open={isQuickReturnOpen} onClose={() => setIsQuickReturnOpen(false)} onConfirm={handleQuickReturn} equipmentOptions={equipmentOptions} />
      <ConfirmIssueModal open={!!confirmIssueEvent} event={confirmIssueEvent} onConfirm={handleConfirmIssue} onCancel={() => setConfirmIssueEvent(null)} />
      <ConfirmReturnModal open={!!confirmReturnEvent} event={confirmReturnEvent} onConfirm={(damaged, photos) => handleConfirmReturn(damaged)} onCancel={() => setConfirmReturnEvent(null)} />

      <div className="px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Issue/Return Equipment</h1>
            <p className="mt-1 text-sm text-zinc-500">Manage equipment issue and return for Events with photo evidence</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsQuickIssueOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
              <Plus className="h-4 w-4" />Quick Issue
            </button>
            <button onClick={() => setIsQuickReturnOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              <CornerDownLeft className="h-4 w-4" />Quick Return
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Clock3 className="h-5 w-5" />} value={stats.pending} label="Pending Approval" tone="amber" />
          <StatCard icon={<ArrowRight className="h-5 w-5" />} value={stats.readyToIssue} label="Ready to Issue" tone="emerald" />
          <StatCard icon={<Package className="h-5 w-5" />} value={stats.inUse} label="In Use" tone="violet" />
          <StatCard icon={<CornerDownLeft className="h-5 w-5" />} value={stats.readyToReturn} label="Ready to Return" tone="sky" />
        </div>

        {/* Tabs */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-100/60 p-2 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            {([
              { key: "issue", label: "Issue Equipment", icon: <ArrowRight className="h-4 w-4" />, count: issueList.length },
              { key: "inuse", label: "In Use", icon: <Package className="h-4 w-4" />, count: inUseList.length },
              { key: "return", label: "Return Equipment", icon: <CornerDownLeft className="h-4 w-4" />, count: returnList.length },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={["flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition", tab === t.key ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"].join(" ")}>
                {t.icon}{t.label}
                {t.count > 0 && <span className={["rounded-full px-2 py-0.5 text-xs font-bold", tab === t.key ? "bg-zinc-100 text-zinc-700" : "bg-zinc-200 text-zinc-500"].join(" ")}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Event List */}
        <div className="mt-5 space-y-4">
          {visibleList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-16 text-center">
              <Package2 className="mx-auto h-12 w-12 text-zinc-300" />
              <div className="mt-3 text-sm font-semibold text-zinc-500">
                {tab === "issue" ? "ไม่มี Event ที่รอ Issue" : tab === "inuse" ? "ไม่มี Event ที่กำลังใช้งาน" : "ไม่มี Event ที่รอคืนอุปกรณ์"}
              </div>
            </div>
          ) : visibleList.map(ev => (
            <div key={ev.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate text-base font-semibold text-zinc-900">{ev.title}</h2>
                    <StatusPill text="อนุมัติแล้ว" tone="success" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                    <span className="text-zinc-400">{ev.code}</span>
                    <span className="text-zinc-300">•</span>
                    <span>{ev.company}</span>
                  </div>
                </div>

                {/* ปุ่มขวา: Issue / In Use / Return */}
                {tab === "issue" && (
                  <button onClick={() => handleIssueClick(ev)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700">
                    <ArrowRight className="h-4 w-4" />Issue
                  </button>
                )}
                {tab === "inuse" && (
                  <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />In Use
                  </div>
                )}
                {tab === "return" && (
                  <button onClick={() => handleReturnClick(ev)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                    <CornerDownLeft className="h-4 w-4" />Return
                  </button>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div><div className="text-xs text-zinc-400">Event Date</div><div className="mt-1 text-sm font-medium text-zinc-900">{ev.eventDate}</div></div>
                <div><div className="text-xs text-zinc-400">Issue Date</div><div className="mt-1 text-sm font-medium text-zinc-900">{ev.issueDate}</div></div>
                <div><div className="text-xs text-zinc-400">Equipment</div><div className="mt-1 text-sm font-medium text-zinc-900">{ev.equipment}</div></div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-10" />
      </div>
    </>
  );
}

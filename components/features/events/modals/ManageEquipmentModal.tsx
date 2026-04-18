"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Boxes, ChevronDown, Package, Plus, X } from "lucide-react";
import type { StockRow } from "../../../AppShell";
import type { SelectedEquipment } from "../types";
import { formatTHB, toDateLocal } from "../helpers";

export default function ManageEquipmentModal({
  open,
  eventTitle,
  startDateInitial,
  endDateInitial,
  initialEquipment,
  stockData,
  onClose,
  onSubmitDecision,
}: {
  open: boolean;
  eventTitle: string;
  startDateInitial: string;
  endDateInitial: string;
  initialEquipment: SelectedEquipment[];
  stockData: StockRow[];
  onClose: () => void;
  onSubmitDecision: (payload: {
    startDate: string;
    endDate: string;
    equipment: SelectedEquipment[];
    decision: "approved" | "rejected";
  }) => void;
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

  const selectedOption = useMemo(
    () => equipmentOptions.find((o) => o.name === selectedName) ?? null,
    [equipmentOptions, selectedName]
  );

  useEffect(() => {
    if (!open) return;
    setStartDate(startDateInitial);
    setEndDate(endDateInitial);
    setEquipment(initialEquipment);
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
    if (startDate && endDate && toDateLocal(startDate) > toDateLocal(endDate)) {
      e.endDate = "วันคืนอุปกรณ์ต้องไม่ก่อนวันเบิกอุปกรณ์";
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
    if (!validateSelect() || !selectedOption) return;
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
  const insufficientItems = useMemo(
    () => equipment.filter((it) => it.qty > it.available),
    [equipment]
  );
  const hasInsufficient = insufficientItems.length > 0;

  const save = () => {
    if (!validate()) return;
    if (hasInsufficient) {
      alert(
        `มีอุปกรณ์ไม่เพียงพอ\n\n${insufficientItems
          .map((item) => `- ${item.name} (ต้องใช้ ${item.qty} / มี ${item.available})`)
          .join("\n")}`
      );
      return;
    }
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
                    <div className="mt-1 text-xs text-red-600">{errors.startDate}</div>
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
                    <div className="mt-1 text-xs text-red-600">{errors.endDate}</div>
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
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มอุปกรณ์
                </button>
              </div>

              {hasInsufficient && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  มีอุปกรณ์ไม่เพียงพอ กรุณาตรวจสอบรายการที่ขึ้นสถานะ "ไม่พอ" ก่อนบันทึกและอนุมัติ
                </div>
              )}

              {equipment.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200">
                    <Boxes className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-zinc-800">ยังไม่ได้เลือกอุปกรณ์</div>
                  <div className="mt-1 text-sm text-zinc-500">
                    คลิกปุ่ม "เพิ่มอุปกรณ์" เพื่อเริ่มเลือกอุปกรณ์
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {equipment.map((it, idx) => {
                    const enough = it.qty <= it.available;
                    return (
                      <div
                        key={`${it.name}-${idx}`}
                        className={[
                          "rounded-2xl border bg-white p-4 shadow-sm",
                          enough ? "border-zinc-200" : "border-rose-300 bg-rose-50/40",
                        ].join(" ")}
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
                                <div className="mt-0.5 text-xs text-zinc-500">{it.category}</div>
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
                            <div className="text-xs text-zinc-500">จำนวน / มีอยู่</div>
                            <div className="mt-1 text-sm font-semibold text-zinc-900">
                              {it.qty} / {it.available}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500">ค่าเช่า/วัน</div>
                            <div className="mt-1 text-sm font-semibold text-zinc-900">
                              {formatTHB(it.pricePerDayTHB)} บาท
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500">รวม (1 วัน)</div>
                            <div className="mt-1 text-sm font-semibold text-blue-600">
                              {formatTHB(it.qty * it.pricePerDayTHB)} บาท
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="text-center">
                        <div className="text-xs text-zinc-500">ประเภทอุปกรณ์</div>
                        <div className="mt-1 text-sm font-semibold text-zinc-900">{uniqueTypes}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-zinc-500">จำนวนทั้งหมด</div>
                        <div className="mt-1 text-sm font-semibold text-blue-600">
                          {formatTHB(totalQty)} ชิ้น
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-zinc-500">ค่าใช้จ่ายรวม (โดยประมาณ)</div>
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
                  disabled={hasInsufficient}
                  className={[
                    "h-10 rounded-xl px-4 text-sm font-semibold text-white shadow-sm",
                    hasInsufficient
                      ? "cursor-not-allowed bg-zinc-300"
                      : "bg-red-600 hover:bg-red-700",
                  ].join(" ")}
                >
                  บันทึกและอนุมัติ
                </button>
              </div>
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
                  <div className="text-lg font-semibold text-zinc-900">Select Equipment</div>
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
                  <div className="mb-1 text-xs font-semibold text-zinc-700">Equipment</div>
                  <button
                    onClick={() => setIsEquipOpen((v) => !v)}
                    type="button"
                    className={[
                      "flex h-10 w-full items-center justify-between rounded-xl border bg-zinc-50 px-3 text-sm text-zinc-900",
                      selectErrors.name
                        ? "border-red-300 ring-2 ring-red-100"
                        : "border-zinc-200",
                    ].join(" ")}
                  >
                    <span className={selectedName ? "text-zinc-900" : "text-zinc-500"}>
                      {selectedName
                        ? `${selectedName} (Available: ${selectedOption?.available ?? "-"})`
                        : "Select equipment"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  </button>

                  {selectErrors.name ? (
                    <div className="mt-1 text-xs text-red-600">{selectErrors.name}</div>
                  ) : null}

                  {isEquipOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[140] rounded-xl border border-zinc-200 bg-white shadow-lg">
                      <div className="max-h-[260px] overflow-auto p-1">
                        {equipmentOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-zinc-500">
                            ไม่มีอุปกรณ์ที่พร้อมใช้
                          </div>
                        ) : (
                          equipmentOptions.map((opt) => (
                            <button
                              key={opt.name}
                              type="button"
                              onClick={() => {
                                setSelectedName(opt.name);
                                setSelectErrors((s) => ({ ...s, name: undefined }));
                                setIsEquipOpen(false);
                              }}
                              className={[
                                "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition",
                                opt.name === selectedName
                                  ? "bg-zinc-100 text-zinc-900"
                                  : "text-zinc-700 hover:bg-zinc-50",
                              ].join(" ")}
                            >
                              {opt.name} (Available: {opt.available})
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-1 text-xs font-semibold text-zinc-700">Quantity</div>
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
                    <div className="mt-1 text-xs text-red-600">{selectErrors.qty}</div>
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

      {isDecisionOpen && (
        <div className="fixed inset-0 z-[170]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsDecisionOpen(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
              <div className="text-lg font-semibold text-zinc-900">ยืนยันการบันทึกผล</div>
              <div className="mt-2 text-sm text-zinc-500">ต้องการบันทึก Event นี้เป็นแบบไหน</div>
              <div className="mt-5 grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleDecision("approved")}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  อนุมัติ
                </button>
                <button
                  onClick={() => handleDecision("rejected")}
                  className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                >
                  ไม่อนุมัติ
                </button>
                <button
                  onClick={() => setIsDecisionOpen(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
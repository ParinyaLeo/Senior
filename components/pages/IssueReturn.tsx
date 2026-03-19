"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  CheckCircle2,
  Package,
  Package2,
  CornerDownLeft,
  ArrowRightLeft,
  ArrowRight,
  Plus,
  X,
  ChevronDown,
  Camera,
  Upload,
  CheckCircle,
} from "lucide-react";

type TabKey = "issue" | "inuse" | "return";

type EquipmentOption = {
  id: string;
  name: string;
  available: number;
};

type SelectedEquipmentItem = {
  id: string;
  name: string;
  quantity: number;
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
  tone: "amber" | "emerald" | "violet" | "sky";
}) {
  const toneMap = {
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
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

function StatusPill({
  tone,
  text,
}: {
  tone: "success" | "pending";
  text: string;
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
      : "bg-amber-100 text-amber-700 ring-1 ring-amber-200";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
}

function SegTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition",
        active ? "bg-white shadow-sm" : "text-zinc-500 hover:text-zinc-700",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

export default function IssueReturn() {
  const [tab, setTab] = useState<TabKey>("issue");

  const [isQuickIssueOpen, setIsQuickIssueOpen] = useState(false);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [isEquipmentDropdownOpen, setIsEquipmentDropdownOpen] = useState(false);

  const [isQuickReturnOpen, setIsQuickReturnOpen] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);

  const [selectedEquipment, setSelectedEquipment] = useState<
    SelectedEquipmentItem[]
  >([]);
  const [returnEquipment, setReturnEquipment] = useState<SelectedEquipmentItem[]>(
    []
  );

  const [equipmentId, setEquipmentId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [returnImages, setReturnImages] = useState<File[]>([]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const equipmentOptions: EquipmentOption[] = [
    { id: "eq1", name: "ชุดไฟ LED พลาส่า 200W", available: 50 },
    { id: "eq2", name: "ชุดไฟเวที Moving Head 300W", available: 28 },
    { id: "eq3", name: "ชุดไฟ Par Light LED RGB", available: 35 },
    { id: "eq4", name: "เวทีขนาดเล็ก 2x2 เมตร", available: 20 },
    { id: "eq5", name: "เวทีขนาดกลาง 4x4 เมตร", available: 12 },
    { id: "eq6", name: "เวทีขนาดใหญ่ 6x8 เมตร", available: 8 },
    { id: "eq7", name: "หญ้าเทียม (ม้วน 2x10 เมตร)", available: 85 },
    { id: "eq8", name: "น้ำดื่ม 600ml (แพ็ค 24 ขวด)", available: 450 },
    { id: "eq9", name: "โต๊ะจีนพับได้ 180cm", available: 180 },
    { id: "eq10", name: "โต๊ะบุฟเฟ่ต์ สแตนเลส 180cm", available: 45 },
    { id: "eq11", name: "เก้าอี้พลาสติก มีพนักพิง", available: 420 },
    { id: "eq12", name: "เก้าอี้วีไอพี สีทอง", available: 250 },
    { id: "eq13", name: "เครื่องเสียง PA System 2000W", available: 18 },
    { id: "eq14", name: "ไมโครโฟนไร้สาย คู่", available: 35 },
    { id: "eq15", name: "โปรเจคเตอร์ 5000 Lumens", available: 22 },
  ];

  const rows = [
    {
      id: "EVT001",
      title: "Annual Meeting 2025",
      status: { text: "อนุมัติแล้ว", tone: "success" as const },
      code: "#EVT001",
      company: "ABC Corporation",
      eventDate: "2025-11-20",
      issueDate: "2025-11-19",
      equipment: "5 items",
    },
    {
      id: "EVT002",
      title: "Product Launch Event",
      status: { text: "อนุมัติแล้ว", tone: "success" as const },
      code: "#EVT002",
      company: "Tech Innovations Ltd",
      eventDate: "2025-11-25",
      issueDate: "2025-11-24",
      equipment: "5 items",
    },
  ];

  useMemo(() => {
    if (tab === "issue") return "Issue Equipment";
    if (tab === "inuse") return "In Use";
    return "Return Equipment";
  }, [tab]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsEquipmentDropdownOpen(false);
      }
    }

    if (isEquipmentDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEquipmentDropdownOpen]);

  const onQuickIssue = () => setIsQuickIssueOpen(true);
  const onQuickReturn = () => setIsQuickReturnOpen(true);
  const onIssue = (id: string) => alert(`Issue: ${id}`);
  const onReturn = (id: string) => alert(`Return: ${id}`);

  const onOpenAddEquipment = () => setIsAddEquipmentOpen(true);

  const onCloseAddEquipment = () => {
    setIsAddEquipmentOpen(false);
    setEquipmentId("");
    setQuantity("");
    setIsEquipmentDropdownOpen(false);
  };

  const onSelectEquipment = (id: string) => {
    setEquipmentId(id);
    setIsEquipmentDropdownOpen(false);
  };

  const onAddEquipment = () => {
    const selected = equipmentOptions.find((item) => item.id === equipmentId);
    const qty = Number(quantity);

    if (!selected || !qty || qty <= 0) {
      alert("Please select equipment and enter quantity");
      return;
    }

    if (qty > selected.available) {
      alert(`Available quantity is only ${selected.available}`);
      return;
    }

    setSelectedEquipment((prev) => {
      const existing = prev.find((item) => item.id === selected.id);

      if (existing) {
        return prev.map((item) =>
          item.id === selected.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }

      return [...prev, { id: selected.id, name: selected.name, quantity: qty }];
    });

    onCloseAddEquipment();
  };

  const onConfirmQuickIssue = () => {
    alert("Confirm Issue");
  };

  const onOpenReturnAddEquipment = () => {
    setIsAddEquipmentOpen(true);
  };

  const onAddReturnEquipment = () => {
    const selected = equipmentOptions.find((item) => item.id === equipmentId);
    const qty = Number(quantity);

    if (!selected || !qty || qty <= 0) {
      alert("Please select equipment and enter quantity");
      return;
    }

    setReturnEquipment((prev) => {
      const existing = prev.find((item) => item.id === selected.id);

      if (existing) {
        return prev.map((item) =>
          item.id === selected.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }

      return [...prev, { id: selected.id, name: selected.name, quantity: qty }];
    });

    onCloseAddEquipment();
  };

  const onUploadPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setReturnImages((prev) => [...prev, ...Array.from(files)]);
  };

  const onConfirmQuickReturn = () => {
    alert("Confirm Return");
  };

  const selectedEquipmentOption = equipmentOptions.find(
    (item) => item.id === equipmentId
  );

  const stats = [
    {
      label: "Pending Approval",
      value: 1,
      tone: "amber" as const,
      icon: <Clock3 className="h-5 w-5" />,
    },
    {
      label: "Ready to Issue",
      value: 2,
      tone: "emerald" as const,
      icon: <ArrowRight className="h-5 w-5" />,
    },
    {
      label: "In Use",
      value: 0,
      tone: "violet" as const,
      icon: <Package className="h-5 w-5" />,
    },
    {
      label: "Ready to Return",
      value: 0,
      tone: "sky" as const,
      icon: <CornerDownLeft className="h-5 w-5" />,
    },
  ];

  const isAddModeForReturn = isQuickReturnOpen && isAddEquipmentOpen;
  const canConfirmReturn = returnImages.length > 0;

  return (
    <>
      <div className="px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Issue/Return Equipment
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage equipment issue and return for Events with photo evidence
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onQuickIssue}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-600/10 hover:bg-emerald-700 active:translate-y-[1px]"
            >
              <Plus className="h-4 w-4" />
              Quick Issue
            </button>

            <button
              onClick={onQuickReturn}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-blue-600/10 hover:bg-blue-700 active:translate-y-[1px]"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Quick Return
            </button>
          </div>
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

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-100/60 p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <SegTab
              active={tab === "issue"}
              onClick={() => setTab("issue")}
              icon={<ArrowRight className="h-4 w-4" />}
              label="Issue Equipment"
            />
            <SegTab
              active={tab === "inuse"}
              onClick={() => setTab("inuse")}
              icon={<Package className="h-4 w-4" />}
              label="In Use"
            />
            <SegTab
              active={tab === "return"}
              onClick={() => setTab("return")}
              icon={<CornerDownLeft className="h-4 w-4" />}
              label="Return Equipment"
            />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate text-base font-semibold text-zinc-900">
                      {r.title}
                    </h2>
                    <StatusPill tone={r.status.tone} text={r.status.text} />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                    <span className="text-zinc-400">{r.code}</span>
                    <span className="text-zinc-300">•</span>
                    <span className="min-w-0 truncate">{r.company}</span>
                  </div>
                </div>

                {tab !== "inuse" ? (
                  <button
                    onClick={() =>
                      tab === "issue" ? onIssue(r.id) : onReturn(r.id)
                    }
                    className={[
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm",
                      tab === "issue"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-blue-600 hover:bg-blue-700",
                    ].join(" ")}
                  >
                    {tab === "issue" ? (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Issue
                      </>
                    ) : (
                      <>
                        <CornerDownLeft className="h-4 w-4" />
                        Return
                      </>
                    )}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    In Use
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs text-zinc-400">Event Date</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {r.eventDate}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Issue Date</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {r.issueDate}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400">Equipment</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {r.equipment}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-10" />
      </div>

      {isQuickIssueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="relative w-full max-w-[430px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  Quick Issue Equipment
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Issue equipment without an Event (for urgent cases)
                </p>
              </div>

              <button
                onClick={() => setIsQuickIssueOpen(false)}
                className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 border-t border-zinc-200 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-zinc-800">
                  Selected Equipment ({selectedEquipment.length})
                </div>

                <button
                  onClick={onOpenAddEquipment}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
                >
                  <Plus className="h-4 w-4" />
                  Add Equipment
                </button>
              </div>

              {selectedEquipment.length === 0 ? (
                <div className="mt-4 flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 text-center">
                  <Package2 className="h-10 w-10 text-zinc-400" />
                  <p className="mt-4 text-base text-zinc-500">
                    No equipment selected
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  {selectedEquipment.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          Quantity: {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsQuickIssueOpen(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
                >
                  Cancel
                </button>

                <button
                  onClick={onConfirmQuickIssue}
                  disabled={selectedEquipment.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowRight className="h-4 w-4" />
                  Confirm Issue
                </button>
              </div>
            </div>

            {isAddEquipmentOpen && !isQuickReturnOpen && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/20 p-4">
                <div className="w-full max-w-[425px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight text-zinc-900">
                        Select Equipment
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        Choose equipment and specify quantity
                      </p>
                    </div>

                    <button
                      onClick={onCloseAddEquipment}
                      className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div ref={dropdownRef}>
                      <label className="mb-2 block text-sm font-medium text-zinc-800">
                        Equipment
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setIsEquipmentDropdownOpen((prev) => !prev)
                        }
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-700 outline-none transition hover:bg-white"
                      >
                        <span
                          className={
                            selectedEquipmentOption
                              ? "truncate text-zinc-700"
                              : "truncate text-zinc-400"
                          }
                        >
                          {selectedEquipmentOption
                            ? selectedEquipmentOption.name
                            : "Select equipment"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-zinc-400" />
                      </button>

                      {isEquipmentDropdownOpen && (
                        <div className="mt-1 max-h-[345px] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                          {equipmentOptions.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => onSelectEquipment(item.id)}
                              className="block w-full px-4 py-2.5 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                            >
                              {item.name} (Available: {item.available})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-800">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Enter quantity"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      onClick={onCloseAddEquipment}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={onAddEquipment}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0B0F2F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isQuickReturnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="relative w-full max-w-[430px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  Quick Return Equipment
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Return equipment without an Event with photo evidence
                </p>
              </div>

              <button
                onClick={() => setIsQuickReturnOpen(false)}
                className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 border-t border-zinc-200 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-zinc-800">
                  Equipment to Return ({returnEquipment.length})
                </div>

                <button
                  onClick={onOpenReturnAddEquipment}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
                >
                  <Plus className="h-4 w-4" />
                  Add Equipment
                </button>
              </div>

              {returnEquipment.length === 0 ? (
                <div className="mt-4 flex min-h-[108px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 text-center">
                  <Package2 className="h-10 w-10 text-zinc-400" />
                  <p className="mt-4 text-base text-zinc-500">
                    No equipment selected
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                  {returnEquipment.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          Quantity: {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <label className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm">
                <input
                  type="checkbox"
                  checked={isDamaged}
                  onChange={(e) => setIsDamaged(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Equipment is damaged/broken
              </label>

              {!isDamaged ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="text-base font-medium text-emerald-800">
                        All equipment in good condition
                      </div>
                      <div className="text-sm text-emerald-700">
                        No damage detected
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                  <div className="text-base font-medium text-amber-800">
                    Damaged equipment reported
                  </div>
                  <div className="text-sm text-amber-700">
                    Please upload photo evidence before confirming return
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="text-sm font-medium text-zinc-900">
                  Take Photo/Upload Images (Optional)
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
                  >
                    <Camera className="h-4 w-4" />
                    Open Camera
                  </button>

                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Photos
                  </button>
                </div>

                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onUploadPhotos(e.target.files)}
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => onUploadPhotos(e.target.files)}
                />

                <div className="mt-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4">
                  {returnImages.length === 0 ? (
                    <div className="flex min-h-[92px] flex-col items-center justify-center text-center">
                      <Camera className="h-9 w-9 text-zinc-400" />
                      <p className="mt-3 text-sm text-zinc-500">
                        Please take or upload at least 1 photo
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {returnImages.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-3 text-xs text-zinc-700"
                        >
                          <div className="truncate font-medium">{file.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsQuickReturnOpen(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
                >
                  Cancel
                </button>

                <button
                  onClick={onConfirmQuickReturn}
                  disabled={!canConfirmReturn}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Return
                </button>
              </div>
            </div>

            {isAddModeForReturn && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/20 p-4">
                <div className="w-full max-w-[425px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight text-zinc-900">
                        Select Equipment
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        Choose equipment and specify quantity
                      </p>
                    </div>

                    <button
                      onClick={onCloseAddEquipment}
                      className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div ref={dropdownRef}>
                      <label className="mb-2 block text-sm font-medium text-zinc-800">
                        Equipment
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setIsEquipmentDropdownOpen((prev) => !prev)
                        }
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-700 outline-none transition hover:bg-white"
                      >
                        <span
                          className={
                            selectedEquipmentOption
                              ? "truncate text-zinc-700"
                              : "truncate text-zinc-400"
                          }
                        >
                          {selectedEquipmentOption
                            ? selectedEquipmentOption.name
                            : "Select equipment"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-zinc-400" />
                      </button>

                      {isEquipmentDropdownOpen && (
                        <div className="mt-1 max-h-[345px] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                          {equipmentOptions.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => onSelectEquipment(item.id)}
                              className="block w-full px-4 py-2.5 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                            >
                              {item.name} (Available: {item.available})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-800">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Enter quantity"
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      onClick={onCloseAddEquipment}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={onAddReturnEquipment}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0B0F2F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
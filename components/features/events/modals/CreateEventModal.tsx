"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, X } from "lucide-react";
import type { CreateForm } from "../types";
import { toDateLocal } from "../helpers";

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

function CompanyDropdown({
  label,
  required,
  value,
  onChange,
  placeholder,
  options,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: string[];
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open || !ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const needle = value.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((opt) => opt.toLowerCase().includes(needle));
  }, [options, value]);

  return (
    <div ref={ref} className="relative">
      <div className="mb-1 text-xs font-semibold text-zinc-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </div>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        type="text"
        placeholder={placeholder}
        className={[
          "h-10 w-full rounded-xl border bg-zinc-50 px-3 pr-9 text-sm text-zinc-900 outline-none",
          error
            ? "border-red-300 ring-2 ring-red-100"
            : "border-zinc-200 focus:ring-2 focus:ring-zinc-200",
        ].join(" ")}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute inset-y-0 right-2 grid place-items-center text-zinc-400 hover:text-zinc-600"
        aria-label="Toggle"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="max-h-56 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500">No companies found</div>
            ) : (
              filtered.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                >
                  <span className="truncate">{opt}</span>
                  {opt === value ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
                </button>
              ))
            )}
          </div>
        </div>
      )}
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

export default function CreateEventModal({
  open,
  onClose,
  onCreate,
  companyOptions,
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
  companyOptions: string[];
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
    if (
      form.startDate &&
      form.endDate &&
      toDateLocal(form.startDate) > toDateLocal(form.endDate)
    ) {
      e.endDate = "วันจบต้องไม่ก่อนวันเริ่ม";
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
              <div className="text-lg font-semibold text-zinc-900">Create New Event</div>
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
              <CompanyDropdown
                label="Company Name"
                required
                value={form.companyName}
                onChange={(v) => setForm((s) => ({ ...s, companyName: v }))}
                placeholder="Select or type a company"
                options={companyOptions}
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
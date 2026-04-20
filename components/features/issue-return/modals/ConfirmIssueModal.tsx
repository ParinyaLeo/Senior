"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import type { IssueEvent } from "../types";

type Props = {
  open: boolean;
  event: IssueEvent | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmIssueModal({
  open,
  event,
  onConfirm,
  onCancel,
}: Props) {
  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

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

            <div className="mt-4 text-base font-semibold text-zinc-900">
              ยืนยันการเบิกอุปกรณ์
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              เบิกอุปกรณ์สำหรับ{" "}
              <span className="font-semibold text-zinc-800">
                "{event.title}"
              </span>
            </div>

            <div className="mt-1 text-xs text-zinc-400">
              {event.equipment} • {event.company}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 h-10 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ยกเลิก
              </button>

              <button
                onClick={onConfirm}
                className="flex-1 h-10 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                ยืนยัน Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
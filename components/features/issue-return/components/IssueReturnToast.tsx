"use client";

import React from "react";
import { CheckCircle2, X } from "lucide-react";

type Props = {
  message: string;
  onClose: () => void;
};

export default function IssueReturnToast({ message, onClose }: Props) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed right-6 top-6 z-[200]">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
        </div>

        <div className="text-sm font-semibold text-zinc-900">{message}</div>

        <button
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
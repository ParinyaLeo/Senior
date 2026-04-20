import React from "react";
import { FilePlus } from "lucide-react";

type Props = {
  label: string;
  onClick: () => void;
};

export default function ReportsActionDocButton({ label, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
    >
      <FilePlus className="h-4 w-4 text-zinc-500" />
      {label}
    </button>
  );
}
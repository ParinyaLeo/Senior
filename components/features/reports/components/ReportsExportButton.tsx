import React from "react";
import { Download } from "lucide-react";

type Props = {
  onClick: () => void;
};

export default function ReportsExportButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
    >
      <Download className="h-4 w-4" />
      ส่งออก Excel
    </button>
  );
}
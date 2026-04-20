import React from "react";
import {
  DollarSign,
  Boxes,
  CalendarDays,
  AlertTriangle,
  FileText,
} from "lucide-react";
import type { ReportTab } from "../types";

type SegTabProps = {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

function SegTab({ active, icon, label, onClick }: SegTabProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
          : "text-zinc-500 hover:text-zinc-700",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

type Props = {
  tab: ReportTab;
  onChange: (tab: ReportTab) => void;
};

export default function ReportsTabs({ tab, onChange }: Props) {
  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-100/60 p-2 shadow-sm">
      <div className="flex items-center gap-2">
        <SegTab
          active={tab === "finance"}
          onClick={() => onChange("finance")}
          icon={<DollarSign className="h-4 w-4" />}
          label="การเงิน"
        />

        <SegTab
          active={tab === "stock"}
          onClick={() => onChange("stock")}
          icon={<Boxes className="h-4 w-4" />}
          label="สต็อก"
        />

        <SegTab
          active={tab === "events"}
          onClick={() => onChange("events")}
          icon={<CalendarDays className="h-4 w-4" />}
          label="อีเวนต์"
        />

        <SegTab
          active={tab === "damage"}
          onClick={() => onChange("damage")}
          icon={<AlertTriangle className="h-4 w-4" />}
          label="ความเสียหาย"
        />

        <SegTab
          active={tab === "docs"}
          onClick={() => onChange("docs")}
          icon={<FileText className="h-4 w-4" />}
          label="เอกสาร"
        />
      </div>
    </div>
  );
}
import React from "react";

type Props = {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "blue" | "emerald" | "violet" | "amber" | "orange";
};

export default function ReportsSummaryCard({
  icon,
  value,
  label,
  tone,
}: Props) {
  const toneMap = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
  } as const;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl ring-1 ${toneMap[tone]}`}
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
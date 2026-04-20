import React from "react";

type Props = {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "amber" | "emerald" | "violet" | "sky";
};

export default function IssueReturnStatCard({
  icon,
  value,
  label,
  tone,
}: Props) {
  const map = {
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
    sky: "bg-sky-100 text-sky-700",
  } as const;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${map[tone]}`}>
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
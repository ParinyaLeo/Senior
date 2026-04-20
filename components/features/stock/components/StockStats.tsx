import React from "react";
import { Package, CheckCircle2, Clock3, Wrench } from "lucide-react";

type Props = {
  stats: {
    total: number;
    ready: number;
    inUse: number;
    repair: number;
  };
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
  tone: "neutral" | "emerald" | "violet" | "red";
}) {
  const toneMap = {
    neutral: "bg-zinc-100 text-zinc-700",
    emerald: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
    red: "bg-red-100 text-red-700",
  } as const;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneMap[tone]}`}>
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

export default function StockStats({ stats }: Props) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Package className="h-5 w-5" />}
        value={stats.total}
        label="รวมทั้งหมด"
        tone="neutral"
      />
      <StatCard
        icon={<CheckCircle2 className="h-5 w-5" />}
        value={stats.ready}
        label="พร้อมใช้"
        tone="emerald"
      />
      <StatCard
        icon={<Clock3 className="h-5 w-5" />}
        value={stats.inUse}
        label="ใช้งานอยู่"
        tone="violet"
      />
      <StatCard
        icon={<Wrench className="h-5 w-5" />}
        value={stats.repair}
        label="ซ่อมแซม"
        tone="red"
      />
    </div>
  );
}
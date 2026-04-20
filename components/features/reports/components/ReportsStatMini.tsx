import React from "react";

type Props = {
  title: string;
  value: string | number;
  unit?: string;
  tone: "emerald" | "sky" | "violet";
};

export default function ReportsStatMini({
  title,
  value,
  unit,
  tone,
}: Props) {
  const toneCls =
    tone === "emerald"
      ? "bg-emerald-50"
      : tone === "sky"
        ? "bg-sky-50"
        : "bg-violet-50";

  const valueCls =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "sky"
        ? "text-sky-700"
        : "text-violet-700";

  return (
    <div className={`rounded-2xl border border-zinc-200 ${toneCls} p-5`}>
      <div className="text-sm font-semibold text-zinc-800">{title}</div>
      <div className={`mt-2 text-2xl font-bold ${valueCls}`}>
        {value} {unit ?? ""}
      </div>
    </div>
  );
}
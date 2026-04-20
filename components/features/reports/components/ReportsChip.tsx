import React from "react";

type Props = {
  children: React.ReactNode;
  tone?: "neutral" | "blue";
};

export default function ReportsChip({ children, tone = "neutral" }: Props) {
  const cls =
    tone === "blue"
      ? "bg-blue-50 text-blue-700 ring-blue-100"
      : "bg-white text-zinc-700 ring-zinc-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${cls}`}
    >
      {children}
    </span>
  );
}
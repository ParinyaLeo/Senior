import React from "react";
import type { StockTone } from "../types";

type Props = {
  children: React.ReactNode;
  tone: StockTone;
};

export default function StockPill({ children, tone }: Props) {
  const map = {
    blue: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    green: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    amber: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    zinc: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}
    >
      {children}
    </span>
  );
}
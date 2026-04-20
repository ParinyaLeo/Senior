import React from "react";

type Props = {
  text: string;
  tone: "success" | "pending" | "blue" | "zinc";
};

export default function IssueReturnStatusPill({ text, tone }: Props) {
  const map = {
    success: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    blue: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    zinc: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
  } as const;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}>
      {text}
    </span>
  );
}
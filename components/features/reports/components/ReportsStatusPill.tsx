import React from "react";

type Props = {
  tone: "success" | "pending";
  text: string;
};

export default function ReportsStatusPill({ tone, text }: Props) {
  const cls =
    tone === "success"
      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
      : "bg-orange-100 text-orange-800 ring-1 ring-orange-200";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
}
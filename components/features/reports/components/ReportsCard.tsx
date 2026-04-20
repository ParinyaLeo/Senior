import React from "react";

type Props = {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export default function ReportsCard({ title, right, children }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
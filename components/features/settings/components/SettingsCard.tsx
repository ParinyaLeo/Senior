"use client";

import React from "react";

export default function SettingsCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        {subtitle && (
          <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>
        )}
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
"use client";

import React from "react";

export default function SettingsHeader() {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure company information for invoices, quotations, and work orders
        </p>
      </div>

      <div className="inline-flex items-center gap-2 self-start rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
        Manager Only
      </div>
    </div>
  );
}
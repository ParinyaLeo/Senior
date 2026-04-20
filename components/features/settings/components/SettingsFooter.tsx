"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

export default function SettingsFooter({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="text-xs text-zinc-500">
        Changes are saved automatically to browser storage
      </div>

      <button
        onClick={onReset}
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50"
      >
        <RotateCcw className="h-4 w-4" />
        Reset to Default
      </button>
    </div>
  );
}
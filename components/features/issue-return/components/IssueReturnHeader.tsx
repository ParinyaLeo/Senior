import React from "react";
import { ArrowRight, CornerDownLeft, Plus } from "lucide-react";

type Props = {
  onOpenQuickIssue: () => void;
  onOpenQuickReturn: () => void;
};

export default function IssueReturnHeader({
  onOpenQuickIssue,
  onOpenQuickReturn,
}: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Issue/Return Equipment
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage equipment issue and return for Events with photo evidence
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenQuickIssue}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Quick Issue
        </button>

        <button
          onClick={onOpenQuickReturn}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <CornerDownLeft className="h-4 w-4" />
          Quick Return
        </button>
      </div>
    </div>
  );
}
import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { DamageRow } from "../types";
import ReportsCard from "./ReportsCard";
import ReportsExportButton from "./ReportsExportButton";

type Props = {
  rows: DamageRow[];
  onExport: () => void;
};

export default function DamageReportSection({ rows, onExport }: Props) {
  return (
    <ReportsCard
      title="รายงานความเสียหาย"
      right={<ReportsExportButton onClick={onExport} />}
    >
      {rows.length === 0 ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>

            <div className="mt-4 text-sm font-semibold text-zinc-900">
              ไม่พบรายงานความเสียหาย
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              อุปกรณ์ทั้งหมดอยู่ในสภาพดี
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-zinc-500">มีรายการความเสียหาย</div>
      )}
    </ReportsCard>
  );
}
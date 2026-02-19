"use client";

import React, { useMemo, useState } from "react";
import {
  Clock3,
  CheckCircle2,
  Package,
  CornerDownLeft,
  ArrowRightLeft,
  ArrowRight,
  Plus,
} from "lucide-react";

type TabKey = "issue" | "inuse" | "return";

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "amber" | "emerald" | "violet" | "sky";
}) {
  const toneMap = {
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    violet: "bg-violet-100 text-violet-700",
    sky: "bg-sky-100 text-sky-700",
  } as const;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneMap[tone]}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-xl font-semibold text-zinc-900">{value}</div>
          <div className="text-sm text-zinc-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  tone,
  text,
}: {
  tone: "success" | "pending";
  text: string;
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
      : "bg-amber-100 text-amber-700 ring-1 ring-amber-200";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
}

function SegTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition",
        active ? "bg-white shadow-sm" : "text-zinc-500 hover:text-zinc-700",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

export default function IssueReturn() {
  const [tab, setTab] = useState<TabKey>("issue");

  const rows = [
    {
      id: "EVT001",
      title: "Annual Meeting 2025",
      status: { text: "อนุมัติแล้ว", tone: "success" as const },
      code: "#EVT001",
      company: "ABC Corporation",
      eventDate: "2025-11-20",
      issueDate: "2025-11-19",
      equipment: "5 items",
    },
    {
      id: "EVT002",
      title: "Product Launch Event",
      status: { text: "อนุมัติแล้ว", tone: "success" as const },
      code: "#EVT002",
      company: "Tech Innovations Ltd",
      eventDate: "2025-11-25",
      issueDate: "2025-11-24",
      equipment: "5 items",
    },
  ];

  const title = useMemo(() => {
    if (tab === "issue") return "Issue Equipment";
    if (tab === "inuse") return "In Use";
    return "Return Equipment";
  }, [tab]);

  const onQuickIssue = () => alert("Quick Issue");
  const onQuickReturn = () => alert("Quick Return");
  const onIssue = (id: string) => alert(`Issue: ${id}`);
  const onReturn = (id: string) => alert(`Return: ${id}`);

  const stats = [
    {
      label: "Pending Approval",
      value: 1,
      tone: "amber" as const,
      icon: <Clock3 className="h-5 w-5" />,
    },
    {
      label: "Ready to Issue",
      value: 2,
      tone: "emerald" as const,
      icon: <ArrowRight className="h-5 w-5" />,
    },
    {
      label: "In Use",
      value: 0,
      tone: "violet" as const,
      icon: <Package className="h-5 w-5" />,
    },
    {
      label: "Ready to Return",
      value: 0,
      tone: "sky" as const,
      icon: <CornerDownLeft className="h-5 w-5" />,
    },
  ];

  return (
    <div className="px-6 py-8">
      {/* Header */}
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
            onClick={onQuickIssue}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-600/10 hover:bg-emerald-700 active:translate-y-[1px]"
          >
            <Plus className="h-4 w-4" />
            Quick Issue
          </button>

          <button
            onClick={onQuickReturn}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-blue-600/10 hover:bg-blue-700 active:translate-y-[1px]"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Quick Return
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            value={s.value}
            label={s.label}
            tone={s.tone}
          />
        ))}
      </div>

      {/* Segmented Tabs */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-100/60 p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <SegTab
            active={tab === "issue"}
            onClick={() => setTab("issue")}
            icon={<ArrowRight className="h-4 w-4" />}
            label="Issue Equipment"
          />
          <SegTab
            active={tab === "inuse"}
            onClick={() => setTab("inuse")}
            icon={<Package className="h-4 w-4" />}
            label="In Use"
          />
          <SegTab
            active={tab === "return"}
            onClick={() => setTab("return")}
            icon={<CornerDownLeft className="h-4 w-4" />}
            label="Return Equipment"
          />
        </div>
      </div>

      {/* List */}
      <div className="mt-5 space-y-4">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="truncate text-base font-semibold text-zinc-900">
                    {r.title}
                  </h2>
                  <StatusPill tone={r.status.tone} text={r.status.text} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                  <span className="text-zinc-400">{r.code}</span>
                  <span className="text-zinc-300">•</span>
                  <span className="min-w-0 truncate">{r.company}</span>
                </div>
              </div>

              {/* Action */}
              {tab !== "inuse" ? (
                <button
                  onClick={() => (tab === "issue" ? onIssue(r.id) : onReturn(r.id))}
                  className={[
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm",
                    tab === "issue"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-blue-600 hover:bg-blue-700",
                  ].join(" ")}
                >
                  {tab === "issue" ? (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Issue
                    </>
                  ) : (
                    <>
                      <CornerDownLeft className="h-4 w-4" />
                      Return
                    </>
                  )}
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  In Use
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <div className="text-xs text-zinc-400">Event Date</div>
                <div className="mt-1 text-sm font-medium text-zinc-900">
                  {r.eventDate}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Issue Date</div>
                <div className="mt-1 text-sm font-medium text-zinc-900">
                  {r.issueDate}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Equipment</div>
                <div className="mt-1 text-sm font-medium text-zinc-900">
                  {r.equipment}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-10" />
    </div>
  );
}

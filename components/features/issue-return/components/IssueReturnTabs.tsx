import React from "react";
import type { TabKey } from "../types";
import { ISSUE_RETURN_TABS } from "../constants";

type Props = {
  tab: TabKey;
  issueCount: number;
  inUseCount: number;
  returnCount: number;
  onChange: (tab: TabKey) => void;
};

export default function IssueReturnTabs({
  tab,
  issueCount,
  inUseCount,
  returnCount,
  onChange,
}: Props) {
  const countMap: Record<TabKey, number> = {
    issue: issueCount,
    inuse: inUseCount,
    return: returnCount,
  };

  return (
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-100/60 p-2 shadow-sm">
      <div className="grid grid-cols-3 gap-1">
        {ISSUE_RETURN_TABS.map((t) => {
          const Icon = t.icon;
          const count = countMap[t.key];

          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={[
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                tab === t.key
                  ? "bg-white shadow-sm text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {t.label}

              {count > 0 && (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    tab === t.key
                      ? "bg-zinc-100 text-zinc-700"
                      : "bg-zinc-200 text-zinc-500",
                  ].join(" ")}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
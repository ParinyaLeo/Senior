import React from "react";
import { Package2 } from "lucide-react";
import type { IssueEvent, TabKey } from "../types";
import type { Role } from "../../../AppShell";
import IssueReturnEventCard from "./IssueReturnEventCard";

type Props = {
  role: Role;
  tab: TabKey;
  events: IssueEvent[];
  emptyText: string;
  onIssueClick: (event: IssueEvent) => void;
  onReturnClick: (event: IssueEvent) => void;
};

export default function IssueReturnEventList({
  role,
  tab,
  events,
  emptyText,
  onIssueClick,
  onReturnClick,
}: Props) {
  return (
    <div className="mt-5 space-y-4">
      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-16 text-center">
          <Package2 className="mx-auto h-12 w-12 text-zinc-300" />
          <div className="mt-3 text-sm font-semibold text-zinc-500">
            {emptyText}
          </div>
        </div>
      ) : (
        events.map((ev) => (
          <IssueReturnEventCard
            key={ev.id}
            event={ev}
            tab={tab}
            role={role}
            onIssueClick={onIssueClick}
            onReturnClick={onReturnClick}
          />
        ))
      )}
    </div>
  );
}
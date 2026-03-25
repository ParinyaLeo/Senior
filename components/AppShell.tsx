"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Boxes,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
} from "lucide-react";

import Events from "./pages/Events";
import Stock from "./pages/Stock";
import IssueReturn from "./pages/IssueReturn";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings"; // ✅ เพิ่มตัวนี้

export type Role = "SA" | "Manager" | "Stockkeeper";
type Tab = "events" | "stock" | "issueReturn" | "reports" | "settings";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  unreadFor: Role[];
  audience: Role[];
};

const tabsByRole: Record<Role, { key: Tab; label: string; icon: React.ReactNode }[]> =
  {
    SA: [{ key: "events", label: "Events", icon: <CalendarDays className="h-4 w-4" /> }],
    Manager: [
      { key: "events", label: "Events", icon: <CalendarDays className="h-4 w-4" /> },
      { key: "stock", label: "Stock", icon: <Boxes className="h-4 w-4" /> },
      { key: "issueReturn", label: "Issue/Return", icon: <ArrowLeftRight className="h-4 w-4" /> },
      { key: "reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
      { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    ],
    Stockkeeper: [
      { key: "events", label: "Events", icon: <CalendarDays className="h-4 w-4" /> },
      { key: "stock", label: "Stock", icon: <Boxes className="h-4 w-4" /> },
      { key: "issueReturn", label: "Issue/Return", icon: <ArrowLeftRight className="h-4 w-4" /> },
      { key: "reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
    ],
  };

function LogoMark() {
  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-600 text-white shadow-sm">
        <span className="text-lg font-black">⬢</span>
      </div>

      <div className="leading-tight">
        <div className="text-base font-semibold text-zinc-900">Event Stock Manager</div>
        <div className="text-xs text-zinc-500">ระบบบริหารจัดการ Stock</div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const tone =
    role === "SA"
      ? "bg-blue-50 text-blue-700 ring-blue-100"
      : role === "Manager"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : "bg-violet-50 text-violet-700 ring-violet-100";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tone}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {role}
    </span>
  );
}

export default function AppShell() {
  const [role, setRole] = useState<Role>("Manager");
  const tabs = useMemo(() => tabsByRole[role], [role]);
  const [tab, setTab] = useState<Tab>("events");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const notifRef = React.useRef<HTMLDivElement | null>(null);

  const isSA = role === "SA";

  // กันกรณีเปลี่ยน role แล้ว tab เดิมไม่มีใน role นั้น
  React.useEffect(() => {
    const allowed = tabsByRole[role].map((t) => t.key);
    if (!allowed.includes(tab)) setTab(allowed[0]);
  }, [role, tab]);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const res = await fetch(`/api/notifications?role=${role}&unread=true`);
        if (!res.ok) throw new Error("fail");
        const data = (await res.json()) as NotificationItem[];
        setUnread(data.length);
      } catch {
        setUnread(0);
      }
    };
    loadUnread();
  }, [role]);

  useEffect(() => {
    const onNew = (e: Event) => {
      const detail = (e as CustomEvent<NotificationItem>).detail;
      setNotifList((prev) => [detail, ...prev]);
      if (detail.unreadFor.includes(role)) setUnread((c) => c + 1);
    };
    const onUnread = (e: Event) => {
      const detail = (e as CustomEvent<{ counts: Record<string, number> }>).detail;
      if (detail?.counts?.[role] !== undefined) setUnread(detail.counts[role]);
    };
    window.addEventListener("app:notification:new", onNew as EventListener);
    window.addEventListener("app:notification:unread", onUnread as EventListener);
    return () => {
      window.removeEventListener("app:notification:new", onNew as EventListener);
      window.removeEventListener("app:notification:unread", onUnread as EventListener);
    };
  }, [role]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!notifOpen) return;
      if (!notifRef.current) return;
      if (!notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  const openNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?role=${role}`);
      if (res.ok) {
        const data = (await res.json()) as NotificationItem[];
        setNotifList(data);
      }
      setNotifOpen(true);
      if (unread > 0) {
        await fetch("/api/notifications/mark-read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        setNotifList((prev) =>
          prev.map((n) => ({
            ...n,
            unreadFor: n.unreadFor.filter((r) => r !== role),
          }))
        );
        setUnread(0);
      }
    } catch {
      setNotifOpen(true);
    }
  };

  const renderTabButton = (t: { key: Tab; label: string; icon: React.ReactNode }) => {
    const active = tab === t.key;
    return (
      <button
        key={t.key}
        onClick={() => setTab(t.key)}
        className={[
          "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
          active
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
        ].join(" ")}
      >
        {t.icon}
        {t.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Topbar */}
      <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          {/* Left */}
          <div className="shrink-0">
            <LogoMark />
          </div>

          {/* Center (Tabs) -> ซ่อนเมื่อเป็น SA */}
          {!isSA && (
            <div className="hidden flex-1 items-center justify-center gap-2 md:flex">
              {tabs.map(renderTabButton)}
            </div>
          )}

          {/* Right */}
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {/* ✅ SA: ให้ปุ่ม Events อยู่ "ข้างหน้า" badge สีฟ้า */}
            {isSA && (
              <div className="hidden items-center gap-2 md:flex">
                {renderTabButton(tabsByRole.SA[0])}
              </div>
            )}

            <div className="hidden md:block">
              <RoleBadge role={role} />
            </div>

            <div className="relative" ref={notifRef}>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-10 rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-800 shadow-sm outline-none hover:bg-zinc-50"
              >
                <option value="SA">SA</option>
                <option value="Manager">Manager</option>
                <option value="Stockkeeper">Stockkeeper</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>

            <div className="relative">
              <button
                onClick={openNotifications}
                className="relative grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[200] w-80 rounded-2xl border border-zinc-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between px-4 pb-2 pt-3">
                    <div className="text-sm font-semibold text-zinc-900">การแจ้งเตือน</div>
                    <div className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                      {unread} ใหม่
                    </div>
                  </div>
                  <div className="max-h-96 divide-y divide-zinc-100 overflow-auto">
                    {notifList.length === 0 ? (
                      <div className="p-4 text-sm text-zinc-500">ยังไม่มีการแจ้งเตือน</div>
                    ) : (
                      notifList.map((n) => (
                        <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50">
                          <div className="mt-0.5">
                            <Bell className="h-4 w-4 text-amber-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-zinc-900">{n.title}</div>
                            <div className="mt-0.5 text-xs text-zinc-600">{n.message}</div>
                            <div className="mt-1 text-[11px] text-zinc-400">
                              {new Date(n.createdAt).toLocaleString("th-TH")}
                            </div>
                          </div>
                          {n.unreadFor.includes(role) ? (
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700">
                {role === "SA" ? "S" : role === "Manager" ? "M" : "K"}
              </div>
              <div className="hidden leading-tight md:block">
                <div className="text-sm font-semibold text-zinc-900">{role} Team</div>
                <div className="text-xs text-zinc-500">{role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-2">
        {tab === "events" && <Events role={role} />}
        {tab === "stock" && <Stock role={role} />}
        {tab === "issueReturn" && <IssueReturn />}
        {tab === "reports" && <Reports />}
        {/* ✅ Settings: ให้ Manager เท่านั้น */}
        {tab === "settings" && role === "Manager" && <SettingsPage />}
        {tab === "settings" && role !== "Manager" && (
          <div className="px-6 py-10 text-sm text-zinc-500">Manager Only</div>
        )}
      </div>
    </div>
  );
}

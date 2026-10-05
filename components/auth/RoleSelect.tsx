"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Boxes, Briefcase, Check, ChevronDown, User } from "lucide-react";
import type { AuthRole } from "@/lib/authSchema";

// ตัวเลือกบทบาทในหน้า login — เป็นแค่ตัวช่วยนำทาง/ปรับข้อความ ไม่มีผลต่อสิทธิ์
// (สิทธิ์จริงมาจาก role ของบัญชีใน DB เสมอ)
export const ROLE_OPTIONS: {
  role: AuthRole;
  label: string;
  desc: string;
  icon: React.ReactNode;
  tone: string;
}[] = [
  {
    role: "SA",
    label: "ลูกค้า",
    desc: "สร้างและติดตามอีเวนต์ของคุณ",
    icon: <User className="h-4 w-4" />,
    tone: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  {
    role: "Manager",
    label: "ผู้จัดการ",
    desc: "อนุมัติอีเวนต์ จัดการระบบทั้งหมด",
    icon: <Briefcase className="h-4 w-4" />,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    role: "Stockkeeper",
    label: "เจ้าหน้าที่คลัง",
    desc: "จัดการสต็อกและการเบิก/คืนอุปกรณ์",
    icon: <Boxes className="h-4 w-4" />,
    tone: "bg-violet-50 text-violet-700 ring-violet-100",
  },
];

export function roleLabel(role: AuthRole) {
  return ROLE_OPTIONS.find((o) => o.role === role)?.label ?? role;
}

export default function RoleSelect({
  value,
  onChange,
}: {
  value: AuthRole | null;
  onChange: (role: AuthRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listId = useId();
  const labelId = useId();
  const selected = ROLE_OPTIONS.find((o) => o.role === value) ?? null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const openList = () => {
    setActive(Math.max(0, ROLE_OPTIONS.findIndex((o) => o.role === value)));
    setOpen(true);
  };
  const choose = (i: number) => {
    onChange(ROLE_OPTIONS[i].role);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % ROLE_OPTIONS.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i - 1 + ROLE_OPTIONS.length) % ROLE_OPTIONS.length); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(ROLE_OPTIONS.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
    else if (e.key === "Escape" || e.key === "Tab") { setOpen(false); }
  };

  return (
    <div className="mb-4" ref={rootRef}>
      <span id={labelId} className="mb-1.5 block text-sm font-medium text-zinc-700">
        บทบาทผู้ใช้งาน
      </span>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={labelId}
          aria-activedescendant={open ? `${listId}-${active}` : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-sm outline-none hover:border-zinc-300 focus:border-zinc-400 focus:bg-white focus-visible:ring-2 focus-visible:ring-zinc-200"
        >
          {selected ? (
            <>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ${selected.tone}`}>{selected.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-zinc-900">{selected.label}</span>
                <span className="block truncate text-xs text-zinc-500">{selected.desc}</span>
              </span>
            </>
          ) : (
            <span className="flex-1 text-zinc-400">เลือกบทบาทผู้ใช้งาน</span>
          )}
          <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
          >
            {ROLE_OPTIONS.map((o, i) => {
              const isSelected = o.role === value;
              return (
                <li
                  key={o.role}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${i === active ? "bg-zinc-50" : ""}`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ${o.tone}`}>{o.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-zinc-900">{o.label}</span>
                    <span className="block text-xs text-zinc-500">{o.desc}</span>
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-zinc-700" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

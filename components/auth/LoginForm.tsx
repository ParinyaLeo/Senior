"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Eye, EyeOff, LogIn } from "lucide-react";
import type { AuthRole } from "@/lib/authSchema";
import AuthCard, { AuthField, authInputClass } from "./AuthCard";
import RoleSelect, { roleLabel } from "./RoleSelect";

// เวลาที่แสดงคำเตือน "บทบาทไม่ตรง" ก่อนพาเข้าแอป
const ROLE_MISMATCH_REDIRECT_MS = 2500;

const IDENTIFIER_PLACEHOLDER: Record<AuthRole | "none", string> = {
  none: "name@example.com หรือชื่อผู้ใช้",
  SA: "อีเมลที่ใช้สมัครสมาชิก",
  Manager: "อีเมลหรือชื่อผู้ใช้ เช่น manager",
  Stockkeeper: "อีเมลหรือชื่อผู้ใช้ เช่น stockkeeper",
};

export default function LoginForm() {
  // บทบาทที่เลือกเป็นแค่ตัวช่วย (ปรับข้อความ/ลิงก์) — สิทธิ์จริงมาจากบัญชีที่ login เสมอ
  const [selectedRole, setSelectedRole] = useState<AuthRole | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [mismatch, setMismatch] = useState<AuthRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || mismatch) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
        setSubmitting(false);
        return;
      }
      const actualRole = data?.user?.role as AuthRole | undefined;
      if (selectedRole && actualRole && actualRole !== selectedRole) {
        // login สำเร็จแล้ว แต่บัญชีไม่ใช่บทบาทที่เลือก → แจ้งสั้นๆ แล้วเข้าตาม role จริงของบัญชี
        setMismatch(actualRole);
        setTimeout(() => window.location.assign("/"), ROLE_MISMATCH_REDIRECT_MS);
        return;
      }
      window.location.assign("/");
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่");
      setSubmitting(false);
    }
  };

  const isStaff = selectedRole === "Manager" || selectedRole === "Stockkeeper";

  return (
    <AuthCard
      title="เข้าสู่ระบบ"
      subtitle="เลือกบทบาท แล้วกรอกอีเมลหรือชื่อผู้ใช้ และรหัสผ่านของบัญชีคุณ"
      footer={
        isStaff ? (
          <span className="text-zinc-500">บัญชีพนักงานสร้างโดยผู้ดูแลระบบ หากเข้าใช้งานไม่ได้กรุณาติดต่อผู้จัดการ</span>
        ) : (
          <>
            ยังไม่มีบัญชีลูกค้า?{" "}
            <Link href="/register" className="font-semibold text-red-600 hover:text-red-700">
              สมัครสมาชิก
            </Link>
          </>
        )
      }
    >
      <form onSubmit={submit} noValidate>
        <RoleSelect value={selectedRole} onChange={setSelectedRole} />

        <AuthField label="อีเมลหรือชื่อผู้ใช้">
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={IDENTIFIER_PLACEHOLDER[selectedRole ?? "none"]}
            className={authInputClass}
          />
        </AuthField>

        <AuthField label="รหัสผ่าน">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน"
              className={`${authInputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </AuthField>

        {error && (
          <p role="alert" className="mb-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        {mismatch && selectedRole && (
          <div role="status" className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              บัญชีนี้ไม่ใช่บทบาทที่เลือกไว้ ({roleLabel(selectedRole)}) — กำลังเข้าสู่ระบบในฐานะ{" "}
              <span className="font-semibold">{roleLabel(mismatch)}</span>
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !identifier.trim() || !password}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogIn className="h-4 w-4" />
          {mismatch ? "กำลังเข้าสู่ระบบ..." : submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </AuthCard>
  );
}

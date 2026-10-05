"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import AuthCard, { AuthField, authInputClass } from "./AuthCard";

// ต้องตรงกับ PASSWORD_MIN_LENGTH ใน lib/auth.ts (ตรวจซ้ำที่ API อยู่แล้ว ตรงนี้แค่เตือนก่อนส่ง)
const PASSWORD_MIN_LENGTH = 8;

export default function RegisterForm() {
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    company: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (form.password.length < PASSWORD_MIN_LENGTH) {
      setError(`รหัสผ่านต้องยาวอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          email: form.email,
          phone: form.phone,
          company: form.company,
          password: form.password,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      window.location.assign("/");
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="สมัครสมาชิก"
      subtitle="สร้างบัญชีลูกค้าเพื่อสร้างและติดตามอีเวนต์"
      footer={
        <>
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-semibold text-red-600 hover:text-red-700">
            เข้าสู่ระบบ
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <AuthField label="ชื่อ-นามสกุล" required>
          <input value={form.displayName} onChange={set("displayName")} maxLength={100} autoComplete="name" className={authInputClass} />
        </AuthField>
        <AuthField label="อีเมล" required>
          <input type="email" value={form.email} onChange={set("email")} autoComplete="email" placeholder="name@example.com" className={authInputClass} />
        </AuthField>
        <AuthField label="เบอร์โทรศัพท์">
          <input type="tel" value={form.phone} onChange={set("phone")} maxLength={20} autoComplete="tel" className={authInputClass} />
        </AuthField>
        <AuthField label="ชื่อบริษัท">
          <input value={form.company} onChange={set("company")} maxLength={150} autoComplete="organization" className={authInputClass} />
        </AuthField>
        <AuthField label="รหัสผ่าน" required>
          <input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" placeholder={`อย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`} className={authInputClass} />
        </AuthField>
        <AuthField label="ยืนยันรหัสผ่าน" required>
          <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" className={authInputClass} />
        </AuthField>

        {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !form.displayName || !form.email || !form.password}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          {submitting ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </button>
      </form>
    </AuthCard>
  );
}

import React from "react";

// กรอบหน้า Login / Register ใช้ร่วมกัน (โลโก้ + การ์ด + footer)
export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-600 text-white shadow-md">
            <span className="text-2xl font-black">⬢</span>
          </div>
          <div>
            <div className="text-xl font-bold text-zinc-900">ระบบจัดการสต็อกอีเวนต์</div>
            <div className="text-sm text-zinc-500">ระบบบริหารจัดการสต็อก</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold text-zinc-900">{title}</h1>
          <p className="mb-6 text-sm text-zinc-500">{subtitle}</p>
          {children}
        </div>

        {footer && <div className="mt-4 text-center text-sm text-zinc-500">{footer}</div>}

        <p className="mt-4 text-center text-xs text-zinc-400">
          ระบบจัดการสต็อกอีเวนต์ &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
    </label>
  );
}

export const authInputClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:border-zinc-400 focus:bg-white";

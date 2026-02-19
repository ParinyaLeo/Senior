"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, RotateCcw } from "lucide-react";

type SettingsTab = "company" | "banking";

type CompanyInfo = {
  companyNameTH: string;
  companyNameEN: string;
  tagline: string;
  address: string;
  taxId: string;
  phone: string;
  email: string;
  website: string;
};

type BankingInfo = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode: string;
};

type SettingsState = {
  company: CompanyInfo;
  banking: BankingInfo;
};

const STORAGE_KEY = "event_stock_manager_settings_v1";

const DEFAULT_SETTINGS: SettingsState = {
  company: {
    companyNameTH: "EVENT STOCK MANAGER",
    companyNameEN: "Event Stock Manager Co., Ltd.",
    tagline: "Event Equipment Rental & Management Services",
    address: "255/2 Sikan, Tha Muang, Mueang, Chiang Rai 57000",
    taxId: "0575559000545",
    phone: "095-145-8088",
    email: "info@eventstock.com",
    website: "www.eventstock.com",
  },
  banking: {
    bankName: "Kasikornbank",
    accountName: "Event Stock Manager Co., Ltd.",
    accountNumber: "xxx-x-xxxxx-x",
    branch: "Chiang Rai",
    swiftCode: "KASITHBK",
  },
};

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
        "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
          : "text-zinc-500 hover:text-zinc-700",
      ].join(" ")}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-zinc-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-zinc-700">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300"
      />
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>("company");
  const [data, setData] = useState<SettingsState>(DEFAULT_SETTINGS);

  // โหลดค่าจาก localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SettingsState;
      if (parsed?.company && parsed?.banking) setData(parsed);
    } catch {
      // ignore
    }
  }, []);

  // autosave
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  const reset = () => {
    setData(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // ignore
    }
  };

  const company = data.company;
  const banking = data.banking;

  const title = useMemo(() => {
    return tab === "company" ? "Company Information" : "Banking Information";
  }, [tab]);

  const subtitle = useMemo(() => {
    return tab === "company"
      ? "This information will appear on all generated documents"
      : "Used for invoices / quotations payment details";
  }, [tab]);

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure company information for invoices, quotations, and work orders
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
          Manager Only
        </div>
      </div>

      {/* Tabs (ตัด Terms + Branding ออกแล้ว) */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-100/60 p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <SegTab
            active={tab === "company"}
            onClick={() => setTab("company")}
            icon={<Building2 className="h-4 w-4" />}
            label="Company Info"
          />
          <SegTab
            active={tab === "banking"}
            onClick={() => setTab("banking")}
            icon={<CreditCard className="h-4 w-4" />}
            label="Banking"
          />
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 space-y-6">
        <Card title={title} subtitle={subtitle}>
          {tab === "company" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Company Name (TH)"
                required
                value={company.companyNameTH}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, companyNameTH: v },
                  }))
                }
              />
              <Field
                label="Company Name (EN)"
                required
                value={company.companyNameEN}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, companyNameEN: v },
                  }))
                }
              />

              <div className="md:col-span-2">
                <Field
                  label="Tagline"
                  value={company.tagline}
                  onChange={(v) =>
                    setData((s) => ({
                      ...s,
                      company: { ...s.company, tagline: v },
                    }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Address"
                  value={company.address}
                  onChange={(v) =>
                    setData((s) => ({
                      ...s,
                      company: { ...s.company, address: v },
                    }))
                  }
                  rows={4}
                />
              </div>

              <Field
                label="Tax ID"
                value={company.taxId}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, taxId: v },
                  }))
                }
              />
              <Field
                label="Phone"
                value={company.phone}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, phone: v },
                  }))
                }
              />
              <Field
                label="Email"
                value={company.email}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, email: v },
                  }))
                }
                type="email"
              />
              <Field
                label="Website"
                value={company.website}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    company: { ...s.company, website: v },
                  }))
                }
              />
            </div>
          )}

          {tab === "banking" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Bank Name"
                required
                value={banking.bankName}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    banking: { ...s.banking, bankName: v },
                  }))
                }
              />
              <Field
                label="Account Name"
                required
                value={banking.accountName}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    banking: { ...s.banking, accountName: v },
                  }))
                }
              />
              <Field
                label="Account Number"
                required
                value={banking.accountNumber}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    banking: { ...s.banking, accountNumber: v },
                  }))
                }
              />
              <Field
                label="Branch"
                value={banking.branch}
                onChange={(v) =>
                  setData((s) => ({
                    ...s,
                    banking: { ...s.banking, branch: v },
                  }))
                }
              />
              <div className="md:col-span-2">
                <Field
                  label="SWIFT Code"
                  value={banking.swiftCode}
                  onChange={(v) =>
                    setData((s) => ({
                      ...s,
                      banking: { ...s.banking, swiftCode: v },
                    }))
                  }
                />
              </div>
            </div>
          )}
        </Card>

        {/* Footer info + Reset */}
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-zinc-500">
            Changes are saved automatically to browser storage
          </div>

          <button
            onClick={reset}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </button>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}

import React from "react";

type Props = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
};

export default function StockField({
  label,
  required,
  children,
  error,
}: Props) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </div>
      {children}
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
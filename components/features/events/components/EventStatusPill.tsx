import type { StatusTone } from "../types";

type EventStatusPillProps = {
  tone: StatusTone;
  text: string;
};

export default function EventStatusPill({
  tone,
  text,
}: EventStatusPillProps) {
  const cls =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
      : tone === "pending"
        ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
        : tone === "progress"
          ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
          : "bg-rose-100 text-rose-700 ring-1 ring-rose-200";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
}
type EventDayLegendDotProps = {
  cls: string;
  label: string;
};

export default function EventDayLegendDot({
  cls,
  label,
}: EventDayLegendDotProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-600">
      <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
      <span>{label}</span>
    </div>
  );
}
import { CalendarDays, List } from "lucide-react";

type EventsViewToggleProps = {
  view: "list" | "calendar";
  onChangeView: (view: "list" | "calendar") => void;
};

export default function EventsViewToggle({
  view,
  onChangeView,
}: EventsViewToggleProps) {
  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChangeView("list")}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition",
            view === "list"
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-white text-zinc-600 hover:bg-zinc-100",
          ].join(" ")}
        >
          <List className="h-4 w-4" />
          รายการ
        </button>

        <button
          onClick={() => onChangeView("calendar")}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition",
            view === "calendar"
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-white text-zinc-600 hover:bg-zinc-100",
          ].join(" ")}
        >
          <CalendarDays className="h-4 w-4" />
          ปฏิทิน
        </button>
      </div>
    </div>
  );
}
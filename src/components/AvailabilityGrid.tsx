import { WEEKDAYS } from "@/lib/subjects";
import type { Availability } from "@/lib/types";

export function AvailabilityGrid({ slots }: { slots: Availability[] }) {
  if (!slots.length) return <p className="text-sm text-slate-500">Instruktor nije upisao dostupnost — pitajte ga porukom.</p>;
  return (
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {WEEKDAYS.map((d) => {
        const day = slots.filter((s) => s.weekday === d.id);
        return (
          <div key={d.id} className="min-w-0">
            <p className="mb-1 font-bold text-slate-700">{d.short}</p>
            <div className="space-y-1">
              {day.length === 0 && <div className="rounded-md bg-slate-100 py-2 text-slate-400">—</div>}
              {day.map((s, i) => (
                <div key={i} className="rounded-md bg-emerald-50 px-0.5 py-1.5 font-medium text-emerald-800">
                  {s.start_time.slice(0, 5)}
                  <br />
                  {s.end_time.slice(0, 5)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";
import { useState, useTransition } from "react";
import { saveAvailability } from "../actions/tutor";
import { WEEKDAYS } from "@/lib/subjects";
import { Notice } from "@/components/ui";
import type { Availability } from "@/lib/types";

type Slot = { weekday: number; start_time: string; end_time: string };

export function AvailabilityEditor({ initial }: { initial: Availability[] }) {
  const [slots, setSlots] = useState<Slot[]>(
    initial.map((a) => ({ weekday: a.weekday, start_time: a.start_time.slice(0, 5), end_time: a.end_time.slice(0, 5) })),
  );
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();

  const add = (weekday: number) => setSlots((s) => [...s, { weekday, start_time: "16:00", end_time: "19:00" }]);
  const update = (i: number, patch: Partial<Slot>) => setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const remove = (i: number) => setSlots((s) => s.filter((_, j) => j !== i));

  return (
    <div className="space-y-3">
      {WEEKDAYS.map((d) => {
        const daySlots = slots.map((s, i) => ({ s, i })).filter((x) => x.s.weekday === d.id);
        return (
          <div key={d.id} className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-start">
            <p className="w-28 pt-2 text-sm font-semibold">{d.name}</p>
            <div className="flex-1 space-y-2">
              {daySlots.length === 0 && <p className="pt-2 text-sm text-slate-400">Nedostupno</p>}
              {daySlots.map(({ s, i }) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="time" step={900} className="input w-auto" value={s.start_time} onChange={(e) => update(i, { start_time: e.target.value })} aria-label={`${d.name} od`} />
                  <span>–</span>
                  <input type="time" step={900} className="input w-auto" value={s.end_time} onChange={(e) => update(i, { end_time: e.target.value })} aria-label={`${d.name} do`} />
                  <button type="button" className="btn-sm text-red-600" onClick={() => remove(i)} aria-label="Ukloni termin">✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary btn-sm self-start" onClick={() => add(d.id)}>+ Termin</button>
          </div>
        );
      })}
      {msg && <Notice kind={msg.error ? "error" : "ok"}>{msg.error ?? msg.ok}</Notice>}
      <button
        type="button"
        className="btn-primary"
        disabled={pending}
        onClick={() => {
          if (slots.some((s) => s.end_time <= s.start_time)) {
            setMsg({ error: "Kraj termina mora biti nakon početka." });
            return;
          }
          start(async () => setMsg(await saveAvailability(slots)));
        }}
      >
        {pending ? "Spremam…" : "Spremi dostupnost"}
      </button>
    </div>
  );
}

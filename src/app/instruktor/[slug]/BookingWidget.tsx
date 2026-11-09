"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Zap } from "lucide-react";
import { bookLesson } from "../../actions/bookings";
import { MODES } from "@/lib/subjects";
import { dayKey, dayShort, timeHM, dayLong } from "@/lib/time";
import type { Slot } from "@/lib/types";

export function BookingWidget({
  tutorId,
  slug,
  modes,
  slots,
  lessonMinutes,
  loggedIn,
}: {
  tutorId: string;
  slug: string;
  modes: string[];
  slots: Slot[];
  lessonMinutes: number;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const days = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots) {
      const k = dayKey(s.starts_at);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return [...m.entries()];
  }, [slots]);
  const [day, setDay] = useState(days[0]?.[0] ?? "");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [mode, setMode] = useState(modes[0] ?? "online");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!slots.length)
    return <p className="text-sm text-slate-600">Trenutno nema slobodnih termina za rezervaciju. Pošaljite poruku instruktoru.</p>;

  const daySlots = days.find(([k]) => k === day)?.[1] ?? [];

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Dan">
        {days.map(([k, list]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={k === day}
            onClick={() => {
              setDay(k);
              setSlot(null);
            }}
            className={`flex min-w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-1.5 text-xs ${k === day ? "border-brand-700 bg-brand-700 text-chalk" : "border-line bg-white text-ink"}`}
          >
            <span className="font-semibold capitalize">{dayShort(list[0].starts_at).split(" ")[0].replace(",", "")}</span>
            <span>{dayShort(list[0].starts_at).split(" ").slice(1).join(" ")}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {daySlots.map((s) => (
          <button
            key={s.starts_at}
            type="button"
            onClick={() => setSlot(s)}
            aria-pressed={slot?.starts_at === s.starts_at}
            className={`relative min-h-11 rounded-xl border text-sm font-semibold ${slot?.starts_at === s.starts_at ? "border-brand-700 bg-brand-700 text-chalk" : "border-line bg-white hover:border-brand-500"}`}
          >
            {timeHM(s.starts_at)}
            {s.is_hitno && <Zap className="absolute top-1 right-1 size-3 fill-gold-400 text-gold-500" aria-label="hitno" />}
          </button>
        ))}
      </div>

      {slot && (
        <div className="space-y-2 rounded-xl bg-paper p-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CalendarCheck className="size-4" aria-hidden /> {dayLong(slot.starts_at)}, {timeHM(slot.starts_at)}–{timeHM(slot.ends_at)} ({lessonMinutes} min)
          </p>
          {modes.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {MODES.filter((m) => modes.includes(m.id)).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  aria-pressed={mode === m.id}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${mode === m.id ? "border-brand-700 bg-brand-700 text-chalk" : "border-line bg-white"}`}
                >
                  {m.short}
                </button>
              ))}
            </div>
          )}
          <textarea
            className="input min-h-16 text-sm"
            placeholder="Napomena (razred, gradivo, adresa za dolazak…)"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Napomena"
          />
          {err && <p className="text-sm text-red-700">{err}</p>}
          {loggedIn ? (
            <button
              type="button"
              className="btn-primary w-full"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setErr(null);
                  const res = await bookLesson(tutorId, slot.starts_at, mode, note);
                  if (res.error) {
                    setErr(res.error);
                    router.refresh();
                  } else router.push("/termini?novi=1");
                })
              }
            >
              {pending ? "Rezervacija u tijeku…" : "Potvrdi rezervaciju"}
            </button>
          ) : (
            <Link href={`/prijava?next=${encodeURIComponent(`/instruktor/${slug}`)}`} className="btn-primary w-full">
              Prijavite se za rezervaciju
            </Link>
          )}
          <p className="text-xs text-slate-600">Termin se potvrđuje odmah. Plaćate izravno instruktoru.</p>
        </div>
      )}
    </div>
  );
}

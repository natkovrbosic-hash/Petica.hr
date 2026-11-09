"use client";
import { useState, useTransition } from "react";
import { Zap } from "lucide-react";
import { saveBookingSettings, setHitno } from "../actions/bookings";
import { Notice } from "@/components/ui";
import { timeHM } from "@/lib/time";

type Res = { ok?: string; error?: string } | null;

export function HitnoBox({ hitnoUntil, approved }: { hitnoUntil: string | null; approved: boolean }) {
  const [msg, setMsg] = useState<Res>(null);
  const [pending, start] = useTransition();
  const active = Boolean(hitnoUntil && new Date(hitnoUntil) > new Date());
  const run = (h: number) => start(async () => setMsg(await setHitno(h)));
  return (
    <section className={`rounded-[10px] p-5 ${active ? "bg-board text-chalk" : "card"}`}>
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Zap className={`size-5 ${active ? "fill-gold-400 text-gold-400" : "text-gold-500"}`} aria-hidden /> Hitne instrukcije
      </h2>
      <p className={`mt-1 text-sm ${active ? "text-brand-100" : "text-slate-600"}`}>
        {active
          ? `Hitna dostupnost uključena je do ${timeHM(hitnoUntil!)}. Profil se prikazuje među hitnim instrukcijama, a termini se mogu rezervirati odmah, i izvan redovnog rasporeda te bez minimalne najave.`
          : "Uključite hitnu dostupnost kada imate slobodnog vremena izvan rasporeda. Profil će se prikazivati korisnicima kojima su instrukcije potrebne isti dan."}
      </p>
      {!approved ? (
        <p className="mt-3 text-sm">Dostupno nakon odobrenja profila.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            [2, "2 sata"],
            [4, "4 sata"],
            [-1, "Do kraja dana"],
          ].map(([h, label]) => (
            <button key={h} type="button" disabled={pending} onClick={() => run(Number(h))} className="btn-gold btn-sm">
              {active ? `Produži: ${label}` : `Uključi: ${label}`}
            </button>
          ))}
          {active && (
            <button type="button" disabled={pending} onClick={() => run(0)} className="btn-sm rounded-lg border border-chalk/50 px-3 text-sm">
              Isključi
            </button>
          )}
        </div>
      )}
      {msg && <div className="mt-3 text-ink"><Notice kind={msg.error ? "error" : "ok"}>{msg.error ?? msg.ok}</Notice></div>}
    </section>
  );
}

export function BookingSettings({ enabled, lessonMinutes, noticeHours }: { enabled: boolean; lessonMinutes: number; noticeHours: number }) {
  const [on, setOn] = useState(enabled);
  const [len, setLen] = useState(lessonMinutes);
  const [notice, setNotice] = useState(noticeHours);
  const [msg, setMsg] = useState<Res>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-4">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="mt-0.5 size-4" />
        <span>
          <strong>Automatske rezervacije.</strong> Učenici sami rezerviraju slobodne termine iz vaše tjedne dostupnosti;
          rezervacija se potvrđuje odmah.
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="len">Trajanje sata</label>
          <select id="len" className="input" value={len} onChange={(e) => setLen(Number(e.target.value))} disabled={!on}>
            {[45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>{m} min</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="notice">Najkasnije rezervacija</label>
          <select id="notice" className="input" value={notice} onChange={(e) => setNotice(Number(e.target.value))} disabled={!on}>
            {[0, 1, 2, 4, 12, 24, 48].map((h) => (
              <option key={h} value={h}>{h === 0 ? "bez najave" : `${h} h unaprijed`}</option>
            ))}
          </select>
        </div>
      </div>
      {msg && <Notice kind={msg.error ? "error" : "ok"}>{msg.error ?? msg.ok}</Notice>}
      <button type="button" className="btn-primary" disabled={pending} onClick={() => start(async () => setMsg(await saveBookingSettings(on, len, notice)))}>
        {pending ? "Spremam…" : "Spremi postavke rezervacija"}
      </button>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Zap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { modeName } from "@/lib/subjects";
import { dayLong, timeHM } from "@/lib/time";
import type { Booking } from "@/lib/types";
import { Notice } from "@/components/ui";
import { CancelButton } from "./CancelButton";

export const metadata: Metadata = { title: "Termini", robots: { index: false } };

function BookingRow({ b }: { b: Booking }) {
  const past = new Date(b.ends_at) < new Date();
  const cancelled = b.status === "otkazan";
  return (
    <li className={`card flex flex-col gap-2 p-4 ${cancelled || past ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-extrabold capitalize">{dayLong(b.starts_at)}</p>
          <p className="text-sm font-semibold">
            {timeHM(b.starts_at)}–{timeHM(b.ends_at)} · {modeName(b.mode)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {b.is_hitno && (
            <span className="inline-flex items-center gap-1 rounded-full bg-board px-2.5 py-1 text-xs font-bold text-gold-400">
              <Zap className="size-3 fill-current" aria-hidden /> Hitno
            </span>
          )}
          {cancelled ? <span className="chip">Otkazano</span> : past ? <span className="chip">Održano</span> : <span className="chip bg-gold-400 text-board">Potvrđeno</span>}
        </div>
      </div>
      <p className="text-sm text-slate-700">
        {b.i_am_tutor ? "Učenik / roditelj: " : "Instruktor: "}
        {b.i_am_tutor ? (
          <strong>{b.other_name}</strong>
        ) : (
          <Link className="link" href={`/instruktor/${b.tutor_slug}`}>{b.other_name}</Link>
        )}
      </p>
      {b.note && <p className="rounded-xl bg-paper p-2.5 text-sm text-slate-700">{b.note}</p>}
      {cancelled && b.cancel_reason && <p className="text-sm text-slate-600">Razlog otkazivanja: {b.cancel_reason}</p>}
      {!cancelled && !past && (
        <div className="flex flex-wrap gap-2">
          <CancelButton bookingId={b.id} />
          <Link href="/poruke" className="btn-secondary btn-sm">Poruke</Link>
        </div>
      )}
    </li>
  );
}

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ novi?: string }> }) {
  const sp = await searchParams;
  const { profile } = await requireUser("/termini");
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_bookings");
  const all = (data ?? []) as Booking[];
  const now = new Date();
  const upcoming = all.filter((b) => new Date(b.ends_at) >= now && b.status === "potvrden");
  const rest = all.filter((b) => !upcoming.includes(b)).reverse().slice(0, 30);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="font-display text-3xl font-extrabold">Termini</h1>
      {sp.novi && (
        <Notice kind="ok">
          Termin je rezerviran i potvrđen. Instruktor je dobio obavijest, a u porukama možete dogovoriti detalje.
        </Notice>
      )}
      <section>
        <h2 className="mb-3 font-display text-xl font-extrabold">Nadolazeći</h2>
        {upcoming.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-6 text-center text-sm text-slate-600">
            <CalendarDays className="size-6" aria-hidden />
            {profile.role === "instruktor" ? (
              <>Nemate nadolazećih termina. Učenici rezerviraju prema vašoj dostupnosti u „Moj profil”.</>
            ) : (
              <>
                Nemate nadolazećih termina. <Link className="link" href="/pretraga">Pronađite instruktora</Link>
              </>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <BookingRow key={b.id} b={b} />
            ))}
          </ul>
        )}
      </section>
      {rest.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-extrabold">Prošli i otkazani</h2>
          <ul className="space-y-3">
            {rest.map((b) => (
              <BookingRow key={b.id} b={b} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

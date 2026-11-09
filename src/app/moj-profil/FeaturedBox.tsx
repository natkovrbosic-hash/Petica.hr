"use client";
import { useState, useTransition } from "react";
import { activatePromoFeatured } from "../actions/billing";
import { Notice, formatDate } from "@/components/ui";

type Sub = { status: string; source: string; current_period_end: string | null; cancel_at_period_end: boolean } | null;

const MSG: Record<string, [kind: "ok" | "warn" | "error" | "info", text: string]> = {
  uspjeh: ["ok", "Hvala! Pretplata je aktivirana — istaknutost se uključuje čim Stripe potvrdi plaćanje (obično odmah)."],
  test: ["warn", "TESTNI NAČIN: Stripe nije konfiguriran, pretplata je simulirana na mjesec dana."],
  odustao: ["info", "Plaćanje je prekinuto. Ništa nije naplaćeno."],
  neodobren: ["warn", "Profil mora biti odobren prije isticanja."],
  promo: ["info", "Tijekom razdoblja lansiranja istaknuti profil je besplatan — uključite ga ispod."],
  "vec-aktivna": ["info", "Pretplata je već aktivna."],
  greska: ["error", "Nešto nije u redu. Pokušajte ponovno ili se javite podršci."],
};

export function FeaturedBox({
  approved,
  featuredUntil,
  sub,
  priceEur,
  promo,
  stripeEnabled,
  notice,
}: {
  approved: boolean;
  featuredUntil: string | null;
  sub: Sub;
  priceEur: number;
  promo: { active: boolean; until: string };
  stripeEnabled: boolean;
  notice?: string;
}) {
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  const featured = Boolean(featuredUntil && new Date(featuredUntil) > new Date());
  const paid = sub?.source === "stripe" && ["active", "trialing", "past_due"].includes(sub.status);
  const n = notice ? MSG[notice] : null;

  return (
    <section id="istaknuto" className="card scroll-mt-20 border-gold-400 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">★ Istaknuti profil</h2>
          <p className="mt-1 text-sm text-slate-600">
            Prikaz na vrhu rezultata pretrage i SEO stranica, oznaka „Istaknuto” i zlatni okvir. Osnovni profil ostaje
            besplatan.
          </p>
        </div>
        <p className="shrink-0 text-right text-xl font-extrabold">
          {promo.active ? <span className="text-emerald-700">0 €</span> : `${priceEur} €`}
          <span className="block text-xs font-medium text-slate-500">mjesečno</span>
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {n && <Notice kind={n[0]}>{n[1]}</Notice>}
        {featured && (
          <Notice kind="ok">
            Profil je istaknut do {formatDate(featuredUntil!)}
            {sub?.source === "promo" && " (besplatno razdoblje lansiranja)"}
            {sub?.source === "test" && " (testni način)"}
            {paid && sub?.cancel_at_period_end && " Pretplata je otkazana i neće se obnoviti."}
          </Notice>
        )}
        {!approved && <p className="text-sm text-slate-600">Istaknuti profil možete uključiti nakon što admin odobri profil.</p>}

        {approved && promo.active && !featured && (
          <button
            className="btn-gold w-full sm:w-auto"
            disabled={pending}
            onClick={() => start(async () => setMsg(await activatePromoFeatured()))}
          >
            Uključi besplatno do {formatDate(promo.until)}
          </button>
        )}
        {approved && promo.active && (
          <p className="text-xs text-slate-500">
            Prva 3 mjeseca od lansiranja istaknuti profil je besplatan. Nakon toga ga po želji uključujete uz pretplatu
            od {priceEur} €/mj — ništa se ne naplaćuje automatski.
          </p>
        )}

        {approved && !promo.active && !paid && (
          <form action="/api/stripe/checkout" method="post">
            <button className="btn-gold w-full sm:w-auto">
              {featured ? "Nastavi uz pretplatu" : "Istakni profil"} — {priceEur} €/mj
            </button>
            <p className="mt-2 text-xs text-slate-500">
              Plaćanje karticom, Apple Pay / Google Pay{stripeEnabled ? " ili PayPal (ako je dostupan)" : ""} preko
              Stripea. Otkaz u bilo kojem trenutku; istaknutost traje do kraja plaćenog mjeseca.
              {!stripeEnabled && " Stripe nije konfiguriran — pretplata će se simulirati (testni način)."}
            </p>
          </form>
        )}
        {paid && stripeEnabled && (
          <form action="/api/stripe/portal" method="post">
            <button className="btn-secondary">Upravljaj pretplatom (kartica, računi, otkaz)</button>
          </form>
        )}
        {msg && <Notice kind={msg.error ? "error" : "ok"}>{msg.error ?? msg.ok}</Notice>}
      </div>
    </section>
  );
}

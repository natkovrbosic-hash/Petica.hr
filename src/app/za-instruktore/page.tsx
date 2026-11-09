export const revalidate = 3600;

import type { Metadata } from "next";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { FEATURED_PRICE_EUR, launchPromo } from "@/lib/config";
import { formatDate } from "@/components/ui";

export const metadata: Metadata = {
  title: "Za instruktore — besplatan profil, bez provizije",
  description: "Objavite profil instruktora besplatno. Bez provizije na sate — dogovor i plaćanje izravno s učenicima.",
  alternates: { canonical: "/za-instruktore" },
};

export default function ForTutorsPage() {
  const promo = launchPromo();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Oglasite svoje instrukcije na Petica.hr</h1>
      <p className="mt-3 text-lg text-slate-600">
        Besplatan profil, poruke s roditeljima i učenicima, recenzije — i nikakva provizija na vaše sate.
      </p>
      {promo.active && (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          <strong>Lansiranje:</strong> istaknuti profil je besplatan do {formatDate(promo.until)}
        </div>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-bold">Osnovni profil</h2>
          <p className="mt-1 text-3xl font-extrabold">0 €</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />Profil s fotografijom, predmetima i cijenom</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />Prikaz u pretrazi i na stranicama gradova</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />Neograničene poruke</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />Recenzije učenika i roditelja</li>
          </ul>
        </div>
        <div className="card border-gold-400 p-6 ring-1 ring-gold-400">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Star className="size-5 fill-gold-400 text-gold-500" aria-hidden /> Istaknuti profil</h2>
          <p className="mt-1 text-3xl font-extrabold">
            {FEATURED_PRICE_EUR} € <span className="text-base font-medium text-slate-500">/ mj</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />Sve iz osnovnog profila</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />Na vrhu rezultata pretrage</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />Oznaka „Istaknuto” i zlatni okvir</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />Otkaz u bilo kojem trenutku</li>
          </ul>
        </div>
      </div>
      <div className="mt-8 space-y-3 text-sm text-slate-600">
        <p>
          <strong>Kako funkcionira plaćanje sati?</strong> Izravno između vas i učenika — Petica.hr ne naplaćuje
          instrukcije, ne uzima proviziju i ne posreduje u plaćanju.
        </p>
        <p>
          <strong>Porezi:</strong> sami ste odgovorni za svoje porezne i zakonske obveze (npr. prijavu prihoda od
          instrukcija). Petica.hr samo prodaje oglasni prostor.
        </p>
        <p>
          <strong>Uvjeti:</strong> morate imati najmanje 18 godina. Profil prije objave pregledava naš tim.
        </p>
      </div>
      <Link href="/registracija?uloga=instruktor" className="btn-gold mt-8">Napravi besplatan profil</Link>
    </div>
  );
}

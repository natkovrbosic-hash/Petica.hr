export const revalidate = 3600;

import type { Metadata } from "next";
import Link from "next/link";
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
      <h1 className="text-3xl font-extrabold sm:text-4xl">Držite instrukcije? Neka vas učenici pronađu.</h1>
      <p className="mt-3 text-lg text-slate-600">
        Besplatan profil, poruke s roditeljima i učenicima, recenzije — i nikakva provizija na vaše sate.
      </p>
      {promo.active && (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          🎉 <strong>Lansiranje:</strong> istaknuti profil je besplatan do {formatDate(promo.until)}
        </div>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-bold">Osnovni profil</h2>
          <p className="mt-1 text-3xl font-extrabold">0 €</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>✓ Profil s fotografijom, predmetima i cijenom</li>
            <li>✓ Prikaz u pretrazi i na stranicama gradova</li>
            <li>✓ Neograničene poruke</li>
            <li>✓ Recenzije učenika i roditelja</li>
          </ul>
        </div>
        <div className="card border-gold-400 p-6 ring-1 ring-gold-400">
          <h2 className="text-lg font-bold">★ Istaknuti profil</h2>
          <p className="mt-1 text-3xl font-extrabold">
            {FEATURED_PRICE_EUR} € <span className="text-base font-medium text-slate-500">/ mj</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>✓ Sve iz osnovnog profila</li>
            <li>✓ Na vrhu rezultata pretrage</li>
            <li>✓ Oznaka „Istaknuto” i zlatni okvir</li>
            <li>✓ Otkaz u bilo kojem trenutku</li>
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

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

// Privola za kolačiće. Petica.hr trenutno koristi samo nužne kolačiće (prijava, ova privola).
// Kad se doda analitika, učitavati je samo ako hasConsent("analitika") vrati true.

const KEY = "petica_privola";
type Consent = { nuzni: true; analitika: boolean; datum: string };

export function hasConsent(kind: "analitika") {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null") as Consent | null;
    return Boolean(c?.[kind]);
  } catch {
    return false;
  }
}

function save(analitika: boolean) {
  const c: Consent = { nuzni: true, analitika, datum: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {}
  document.cookie = `${KEY}=${analitika ? "sve" : "nuzni"}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analitika, setAnalitika] = useState(false);

  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- čitanje localStorage moguće je tek u pregledniku
    if (!stored) setOpen(true);
    const reopen = () => {
      setAnalitika(hasConsent("analitika"));
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener("petica:kolacici", reopen);
    return () => window.removeEventListener("petica:kolacici", reopen);
  }, []);

  if (!open) return null;
  const close = (a: boolean) => {
    save(a);
    setOpen(false);
  };

  return (
    <div role="dialog" aria-label="Kolačići" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="card mx-auto max-w-2xl p-4 shadow-lg">
        <p className="text-sm text-slate-700">
          Koristimo nužne kolačiće za prijavu i rad stranice. Analitičke kolačiće koristimo samo uz vašu privolu.{" "}
          <Link href="/kolacici" className="link">Više o kolačićima</Link>
        </p>
        {details && (
          <div className="mt-3 space-y-2 text-sm">
            <label className="flex items-center gap-2 text-slate-500">
              <input type="checkbox" checked disabled /> Nužni (uvijek uključeni)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={analitika} onChange={(e) => setAnalitika(e.target.checked)} /> Analitika
              (trenutno se ne koristi)
            </label>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-primary btn-sm" onClick={() => close(true)}>Prihvati sve</button>
          <button className="btn-secondary btn-sm" onClick={() => close(false)}>Samo nužni</button>
          {details ? (
            <button className="btn-secondary btn-sm" onClick={() => close(analitika)}>Spremi odabir</button>
          ) : (
            <button className="btn-sm text-sm font-semibold text-slate-600 underline" onClick={() => setDetails(true)}>
              Postavke
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsLink() {
  return (
    <button className="hover:text-brand-700" onClick={() => window.dispatchEvent(new Event("petica:kolacici"))}>
      Postavke kolačića
    </button>
  );
}

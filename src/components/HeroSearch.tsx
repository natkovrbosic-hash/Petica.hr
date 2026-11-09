"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { detectSubjects } from "@/lib/problem-match";
import { subjectBySlug } from "@/lib/subjects";
import { CITIES } from "@/lib/cities";

const EXAMPLES = ["ne kužim razlomke", "lektira za petak", "esej za maturu", "kolokvij iz statistike", "present perfect"];

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [grad, setGrad] = useState("");
  const matches = useMemo(() => detectSubjects(q), [q]);

  const go = (params: Record<string, string>) => {
    const p = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    router.push(`/pretraga?${p}`);
  };

  return (
    <form
      className="card p-3 sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        go({ q: q.trim(), grad });
      }}
    >
      <label htmlFor="hero-q" className="label">Što vam treba?</label>
      <input
        id="hero-q"
        className="input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Npr. „ne kužim razlomke” ili „engleski za maturu”"
        autoComplete="off"
      />
      <div className="mt-2 min-h-8">
        {matches.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-slate-600">Predlažemo:</span>
            {matches.map((m) => {
              const s = subjectBySlug(m.subject)!;
              return (
                <button
                  type="button"
                  key={m.subject}
                  onClick={() => go({ predmet: s.slug, grad })}
                  className="chip bg-brand-50 text-brand-800 hover:bg-brand-100"
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 text-xs text-slate-500">
            {EXAMPLES.map((ex) => (
              <button type="button" key={ex} className="chip hover:bg-slate-200" onClick={() => setQ(ex)}>
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          className="input sm:flex-1"
          list="hero-cities"
          value={grad}
          onChange={(e) => setGrad(e.target.value)}
          placeholder="Grad (neobavezno)"
          aria-label="Grad"
        />
        <datalist id="hero-cities">
          {CITIES.map((c) => (
            <option key={c.name} value={c.name} />
          ))}
        </datalist>
        <button className="btn-primary sm:w-40" type="submit">Pronađi instruktora</button>
      </div>
    </form>
  );
}

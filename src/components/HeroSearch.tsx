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
      className="rounded-[18px] bg-paper p-4 text-ink"
      onSubmit={(e) => {
        e.preventDefault();
        go({ q: q.trim(), grad });
      }}
    >
      <label htmlFor="hero-q" className="label text-slate-600">Napiši svojim riječima</label>
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
            <span className="text-slate-600">To je</span>
            {matches.map((m) => {
              const s = subjectBySlug(m.subject)!;
              return (
                <button
                  type="button"
                  key={m.subject}
                  onClick={() => go({ predmet: s.slug, grad })}
                  className="rounded-full bg-gold-400 px-3 py-1.5 text-sm font-semibold text-board hover:bg-gold-500"
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 text-xs text-slate-500">
            {EXAMPLES.map((ex) => (
              <button type="button" key={ex} className="chip bg-white hover:bg-slate-200" onClick={() => setQ(ex)}>
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
        <button className="btn-primary sm:w-44" type="submit">Pokaži instruktore</button>
      </div>
    </form>
  );
}

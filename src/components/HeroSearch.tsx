"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { detectSubjects } from "@/lib/problem-match";
import { subjectBySlug } from "@/lib/subjects";
import { CITIES } from "@/lib/cities";

const EXAMPLES = ["razlomci i jednadžbe", "lektira i esej", "esej za državnu maturu", "kolokvij iz statistike", "engleska gramatika"];

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
      className="rounded-[10px] bg-white p-4 text-ink sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        go({ q: q.trim(), grad });
      }}
    >
      <label htmlFor="hero-q" className="label">Što trebate vježbati?</label>
      <input
        id="hero-q"
        className="input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="npr. razlomci, 5. razred"
        autoComplete="off"
      />
      <div className="mt-2 min-h-8">
        {matches.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-slate-600">Predmet:</span>
            {matches.map((m) => {
              const s = subjectBySlug(m.subject)!;
              return (
                <button
                  type="button"
                  key={m.subject}
                  onClick={() => go({ predmet: s.slug, grad })}
                  className="rounded-[4px] border border-board px-2 py-1 text-sm font-bold text-board hover:bg-paper"
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-slate-600">
            {EXAMPLES.map((ex) => (
              <button type="button" key={ex} className="underline decoration-slate-300 underline-offset-[3px] hover:text-ink hover:decoration-ink" onClick={() => setQ(ex)}>
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
        <button className="btn-primary whitespace-nowrap" type="submit">Pretraži instruktore</button>
      </div>
    </form>
  );
}

/* eslint-disable @next/next/no-img-element -- slike profila dolaze iz Supabase Storagea */
import { Star } from "lucide-react";
import { subjectName } from "@/lib/subjects";

export function Avatar({ name, src, size = 64 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .replace(/\(TEST\)/, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  if (src)
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-2xl object-cover"
        style={{ width: size, height: size }}
      />
    );
  return (
    <div
      className="grid shrink-0 place-items-center rounded-2xl bg-brand-100 font-bold text-brand-800"
      style={{ width: size, height: size, fontSize: size / 2.8 }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function Stars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "lg" }) {
  const v = Number(value) || 0;
  return (
    <span className={`inline-flex items-center gap-1 ${size === "lg" ? "text-base" : "text-sm"}`}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`${size === "lg" ? "size-4.5" : "size-3.5"} ${n <= Math.round(v) ? "fill-gold-500 text-gold-500" : "fill-slate-200 text-slate-200"}`}
          />
        ))}
      </span>
      {count !== undefined && (
        <span className="text-slate-600">
          {count > 0 ? `${v.toFixed(1).replace(".", ",")} (${count})` : "Još nema recenzija"}
        </span>
      )}
      <span className="sr-only">Ocjena {v.toFixed(1)} od 5</span>
    </span>
  );
}

export function FeaturedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-700">
      <Star className="size-3 fill-current" aria-hidden /> Istaknuto
    </span>
  );
}

export function TestBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-bold text-fuchsia-800"
      title="Ovo je testni profil za demonstraciju — nije stvarni instruktor."
    >
      TESTNI PROFIL
    </span>
  );
}

export function SubjectChips({ subjects, max = 4 }: { subjects: string[]; max?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {subjects.slice(0, max).map((s) => (
        <span key={s} className="chip bg-brand-50 text-brand-800">{subjectName(s)}</span>
      ))}
      {subjects.length > max && <span className="chip">+{subjects.length - max}</span>}
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "warn" | "error" | "ok"; children: React.ReactNode }) {
  const cls = {
    info: "border-brand-200 bg-brand-50 text-brand-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-800",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[kind];
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export const formatEur = (n: number | null | undefined) =>
  n == null ? "—" : `${Number(n).toLocaleString("hr-HR", { maximumFractionDigits: 2 })} €`;

export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("hr-HR", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Zagreb" });

import "server-only";
import { createClient } from "./supabase/server";
import { cityByName } from "./cities";
import { detectLevel, detectSubjects, type SubjectMatch } from "./problem-match";
import { subjectBySlug, LEVELS, MODES, DAY_PARTS, SORTS } from "./subjects";
import type { SearchResult } from "./types";

export const PAGE_SIZE = 20;

export type Filters = {
  q: string;
  predmet: string | null;
  razina: string | null;
  zupanija: string | null;
  grad: string | null;
  radijus: number;
  nacin: string[];
  min: number | null;
  max: number | null;
  dani: number[];
  doba: string | null;
  sort: string;
  str: number;
  hitno: boolean;
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const all = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(",") : v) ?? "";
const num = (v: string) => (v && Number.isFinite(Number(v)) ? Number(v) : null);

export function parseFilters(sp: SP): Filters {
  const predmet = subjectBySlug(one(sp.predmet))?.slug ?? null;
  const razina = LEVELS.some((l) => l.id === one(sp.razina)) ? one(sp.razina) : null;
  const grad = cityByName(one(sp.grad))?.name ?? null;
  const nacin = all(sp.nacin).split(",").filter((m) => MODES.some((x) => x.id === m));
  const dani = all(sp.dani).split(",").map(Number).filter((d) => d >= 1 && d <= 7);
  const doba = DAY_PARTS.some((p) => p.id === one(sp.doba)) ? one(sp.doba) : null;
  const sort = SORTS.some((s) => s.id === one(sp.sort)) ? one(sp.sort) : "preporuceno";
  return {
    q: one(sp.q).slice(0, 200),
    predmet,
    razina,
    zupanija: one(sp.zupanija) || null,
    grad,
    radijus: Math.min(100, Math.max(1, num(one(sp.radijus)) ?? 15)),
    nacin,
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    dani,
    doba,
    sort,
    str: Math.max(1, num(one(sp.str)) ?? 1),
    hitno: one(sp.hitno) === "1",
  };
}

export type SearchOutcome = {
  results: SearchResult[];
  total: number;
  /** predmet prepoznat iz opisa problema (kad korisnik nije sam odabrao predmet) */
  detected: SubjectMatch[];
  effective: Filters;
  error?: string;
};

export async function runSearch(f: Filters): Promise<SearchOutcome> {
  const detected = f.q && !f.predmet ? detectSubjects(f.q) : [];
  const effective: Filters = {
    ...f,
    predmet: f.predmet ?? detected[0]?.subject ?? null,
    razina: f.razina ?? (f.q ? detectLevel(f.q) : null),
  };
  const city = cityByName(effective.grad);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_tutors", {
    p_subject: effective.predmet,
    p_level: effective.razina,
    p_county: city ? null : effective.zupanija,
    p_lat: city?.lat ?? null,
    p_lng: city?.lng ?? null,
    p_radius_km: city ? effective.radijus : null,
    p_modes: effective.nacin.length ? effective.nacin : null,
    p_price_min: effective.min,
    p_price_max: effective.max,
    p_days: effective.dani.length ? effective.dani : null,
    p_part: effective.doba,
    p_sort: effective.sort === "udaljenost" && !city ? "preporuceno" : effective.sort,
    p_limit: PAGE_SIZE,
    p_offset: (effective.str - 1) * PAGE_SIZE,
    p_hitno: effective.hitno,
  });
  if (error) {
    console.error("[search]", error);
    return { results: [], total: 0, detected, effective, error: "Pretraga trenutno nije dostupna." };
  }
  const results = (data ?? []) as SearchResult[];
  return { results, total: Number(results[0]?.total_count ?? 0), detected, effective };
}

export function filtersToQuery(f: Partial<Filters>) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.predmet) p.set("predmet", f.predmet);
  if (f.razina) p.set("razina", f.razina);
  if (f.grad) p.set("grad", f.grad);
  else if (f.zupanija) p.set("zupanija", f.zupanija);
  if (f.grad && f.radijus && f.radijus !== 15) p.set("radijus", String(f.radijus));
  if (f.nacin?.length) p.set("nacin", f.nacin.join(","));
  if (f.min != null) p.set("min", String(f.min));
  if (f.max != null) p.set("max", String(f.max));
  if (f.dani?.length) p.set("dani", f.dani.join(","));
  if (f.doba) p.set("doba", f.doba);
  if (f.sort && f.sort !== "preporuceno") p.set("sort", f.sort);
  if (f.hitno) p.set("hitno", "1");
  if (f.str && f.str > 1) p.set("str", String(f.str));
  return p.toString();
}

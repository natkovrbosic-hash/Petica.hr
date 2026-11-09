import "server-only";
import { createPublicClient } from "./supabase/public";
import { CITIES, MAJOR_CITIES, cityByName, distanceKm, type City } from "./cities";
import type { SearchResult } from "./types";

type SearchArgs = Partial<{
  p_subject: string | null;
  p_level: string | null;
  p_county: string | null;
  p_lat: number | null;
  p_lng: number | null;
  p_radius_km: number | null;
  p_modes: string[] | null;
  p_sort: string;
  p_limit: number;
}>;

/** Pretraga bez kolačića (za ISR/SEO stranice). Bez Supabase konfiguracije vraća prazan popis. */
export async function publicSearch(args: SearchArgs): Promise<SearchResult[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const { data, error } = await createPublicClient().rpc("search_tutors", { p_limit: 20, ...args });
  if (error) {
    console.error("[seo] search", error);
    return [];
  }
  return (data ?? []) as SearchResult[];
}

export type SubjectCityCount = { subject: string; city: string; n: number };

export async function subjectCityCounts(): Promise<SubjectCityCount[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const { data } = await createPublicClient().rpc("tutor_counts_by_subject_city");
  return ((data ?? []) as SubjectCityCount[]).map((r) => ({ ...r, n: Number(r.n) }));
}

export function nearestCities(city: City, n = 8) {
  return CITIES.filter((c) => c.name !== city.name)
    .map((c) => ({ c, d: distanceKm(city, c) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.c);
}

export const isMajorCity = (name: string) => MAJOR_CITIES.includes(name);
export const majorCities = () => MAJOR_CITIES.map((n) => cityByName(n)!).filter(Boolean);

export const averagePrice = (list: SearchResult[]) => {
  const prices = list.map((t) => Number(t.price_eur)).filter((p) => p > 0);
  return prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
};

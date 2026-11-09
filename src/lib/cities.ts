// Gradovi u Hrvatskoj sa županijom i koordinatama središta (preuzeto iz Cehovi.hr, shared/places.json + areas.js).
import CITY_LIST from "./cities.json";

export type City = { name: string; county: string; lat: number; lng: number };

const hr = (a: string, b: string) => a.localeCompare(b, "hr");

export const CITIES: City[] = [...(CITY_LIST as City[])].sort((a, b) => hr(a.name, b.name));

export const COUNTIES: string[] = [...new Set(CITIES.map((c) => c.county))].sort((a, b) => {
  // Grad Zagreb prvi, ostale abecedno
  if (a === "Grad Zagreb") return -1;
  if (b === "Grad Zagreb") return 1;
  return hr(a, b);
});

// "Trešnjevka - sjever" → "tresnjevka sjever"
export const norm = (s: string | null | undefined) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// "Velika Gorica" → "velika-gorica", "Đakovo" → "dakovo"
export const slugify = (s: string) => norm(s).replace(/ /g, "-");

const BY_NAME = new Map(CITIES.map((c) => [norm(c.name), c]));
const BY_SLUG = new Map(CITIES.map((c) => [slugify(c.name), c]));

export const cityByName = (name: string | null | undefined) => (name ? BY_NAME.get(norm(name)) ?? null : null);
export const cityBySlug = (slug: string) => BY_SLUG.get(slug) ?? null;
export const citySlug = (name: string) => slugify(name);
export const citiesInCounty = (county: string) => CITIES.filter((c) => c.county === county);

// Veći gradovi — za SEO linkove i prijedloge
export const MAJOR_CITIES = [
  "Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Velika Gorica", "Slavonski Brod", "Pula", "Karlovac",
  "Sisak", "Varaždin", "Šibenik", "Dubrovnik", "Bjelovar", "Kaštela", "Samobor", "Vinkovci", "Koprivnica",
  "Čakovec", "Požega", "Vukovar", "Zaprešić", "Solin", "Poreč",
];

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const t = (x: number) => (x * Math.PI) / 180;
  const dLat = t(b.lat - a.lat);
  const dLng = t(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

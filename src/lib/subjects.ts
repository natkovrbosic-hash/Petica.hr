// Predmeti, razine, načini održavanja i dostupnost — jedini izvor istine za UI, pretragu i SEO stranice.

export type Subject = {
  slug: string;
  name: string;
  /** „Instrukcije iz …” */
  genitive: string;
};

export const SUBJECTS: Subject[] = [
  { slug: "matematika", name: "Matematika", genitive: "matematike" },
  { slug: "hrvatski-jezik", name: "Hrvatski jezik", genitive: "hrvatskog jezika" },
  { slug: "engleski-jezik", name: "Engleski jezik", genitive: "engleskog jezika" },
  { slug: "njemacki-jezik", name: "Njemački jezik", genitive: "njemačkog jezika" },
  { slug: "fizika", name: "Fizika", genitive: "fizike" },
  { slug: "kemija", name: "Kemija", genitive: "kemije" },
  { slug: "biologija", name: "Biologija", genitive: "biologije" },
  { slug: "informatika", name: "Informatika", genitive: "informatike" },
  { slug: "programiranje", name: "Programiranje", genitive: "programiranja" },
  { slug: "talijanski-jezik", name: "Talijanski jezik", genitive: "talijanskog jezika" },
  { slug: "francuski-jezik", name: "Francuski jezik", genitive: "francuskog jezika" },
  { slug: "spanjolski-jezik", name: "Španjolski jezik", genitive: "španjolskog jezika" },
  { slug: "latinski-jezik", name: "Latinski jezik", genitive: "latinskog jezika" },
  { slug: "povijest", name: "Povijest", genitive: "povijesti" },
  { slug: "geografija", name: "Geografija", genitive: "geografije" },
  { slug: "filozofija", name: "Filozofija i logika", genitive: "filozofije i logike" },
  { slug: "ekonomija", name: "Ekonomija", genitive: "ekonomije" },
  { slug: "racunovodstvo", name: "Računovodstvo", genitive: "računovodstva" },
  { slug: "statistika", name: "Statistika", genitive: "statistike" },
  { slug: "pomoc-u-ucenju", name: "Pomoć u učenju (razredna nastava)", genitive: "razredne nastave" },
];

const SUBJECT_BY_SLUG = new Map(SUBJECTS.map((s) => [s.slug, s]));
export const subjectBySlug = (slug: string | null | undefined) => (slug ? SUBJECT_BY_SLUG.get(slug) ?? null : null);
export const subjectName = (slug: string) => SUBJECT_BY_SLUG.get(slug)?.name ?? slug;

export type Level = { id: string; name: string; short: string; group: "os" | "ss" | "matura" | "fakultet" };

export const LEVELS: Level[] = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `os-${i + 1}`,
    name: `Osnovna škola — ${i + 1}. razred`,
    short: `OŠ ${i + 1}.`,
    group: "os" as const,
  })),
  { id: "ss", name: "Srednja škola", short: "SŠ", group: "ss" },
  { id: "matura", name: "Državna matura", short: "Matura", group: "matura" },
  { id: "fakultet", name: "Fakultet", short: "Fakultet", group: "fakultet" },
];
const LEVEL_BY_ID = new Map(LEVELS.map((l) => [l.id, l]));
export const levelById = (id: string) => LEVEL_BY_ID.get(id) ?? null;

/** Sažeti prikaz razina: [os-1..os-4, ss] → "OŠ 1.–4., SŠ" */
export function levelsSummary(ids: string[]) {
  const os = ids.filter((i) => i.startsWith("os-")).map((i) => Number(i.slice(3))).sort((a, b) => a - b);
  const parts: string[] = [];
  if (os.length) {
    const ranges: string[] = [];
    let start = os[0];
    let prev = os[0];
    for (const n of [...os.slice(1), Infinity]) {
      if (n !== prev + 1) {
        ranges.push(start === prev ? `${start}.` : `${start}.–${prev}.`);
        start = n;
      }
      prev = n;
    }
    parts.push(`OŠ ${ranges.join(", ")}`);
  }
  for (const id of ["ss", "matura", "fakultet"]) if (ids.includes(id)) parts.push(levelById(id)!.short);
  return parts.join(", ");
}

export const MODES = [
  { id: "kod_mene", name: "Uživo kod mene", short: "Kod instruktora" },
  { id: "dolazim", name: "Dolazim kući", short: "Dolazi kući" },
  { id: "online", name: "Online", short: "Online" },
] as const;
export type ModeId = (typeof MODES)[number]["id"];
export const modeName = (id: string, short = false) => {
  const m = MODES.find((x) => x.id === id);
  return m ? (short ? m.short : m.name) : id;
};

export const WEEKDAYS = [
  { id: 1, name: "Ponedjeljak", short: "Pon" },
  { id: 2, name: "Utorak", short: "Uto" },
  { id: 3, name: "Srijeda", short: "Sri" },
  { id: 4, name: "Četvrtak", short: "Čet" },
  { id: 5, name: "Petak", short: "Pet" },
  { id: 6, name: "Subota", short: "Sub" },
  { id: 7, name: "Nedjelja", short: "Ned" },
];

export const DAY_PARTS = [
  { id: "jutro", name: "Jutro (8–12)" },
  { id: "popodne", name: "Popodne (12–17)" },
  { id: "vecer", name: "Večer (17–21)" },
] as const;

export const SORTS = [
  { id: "preporuceno", name: "Preporučeno" },
  { id: "ocjena", name: "Najbolje ocijenjeni" },
  { id: "cijena_asc", name: "Najniža cijena" },
  { id: "cijena_desc", name: "Najviša cijena" },
  { id: "udaljenost", name: "Najbliži" },
  { id: "termin", name: "Najraniji slobodan termin" },
] as const;

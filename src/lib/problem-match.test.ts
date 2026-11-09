import { describe, expect, it } from "vitest";
import { detectLevel, detectSubjects, _RULES_FOR_TESTS } from "./problem-match";
import { SUBJECTS, levelsSummary } from "./subjects";
import { cityByName, cityBySlug, CITIES, COUNTIES } from "./cities";
import { ageOn } from "./age";

const top = (q: string) => detectSubjects(q)[0]?.subject;

describe("prepoznavanje problema → predmet", () => {
  it.each([
    ["ne kužim razlomke", "matematika"],
    ["Ne kužim RAZLOMKE!!", "matematika"],
    ["trebam pomoć s jednadžbama i postotcima", "matematika"],
    ["lektira za petak", "hrvatski-jezik"],
    ["ne znam napisati esej za maturu", "hrvatski-jezik"],
    ["pravopis i padeži", "hrvatski-jezik"],
    ["present perfect mi nije jasan", "engleski-jezik"],
    ["priprema za FCE", "engleski-jezik"],
    ["njemački za Goethe ispit", "njemacki-jezik"],
    ["ne razumijem silu i ubrzanje", "fizika"],
    ["strujni krug i Ohmov zakon", "fizika"],
    ["kiseline i lužine, pH", "kemija"],
    ["mitoza i mejoza", "biologija"],
    ["ne znam Python petlje", "programiranje"],
    ["učim C++ za faks", "programiranje"],
    ["kolokvij iz statistike, regresija", "statistika"],
    ["bilanca i amortizacija", "racunovodstvo"],
    ["drugi svjetski rat", "povijest"],
    ["dijete ne zna tablicu množenja", "matematika"],
    ["prvašić ne zna čitati", "pomoc-u-ucenju"],
    ["domaća zadaća svaki dan problem", "pomoc-u-ucenju"],
  ])("„%s” → %s", (q, subject) => {
    expect(top(q)).toBe(subject);
  });

  it("ništa za prazan ili nepoznat tekst", () => {
    expect(detectSubjects("")).toEqual([]);
    expect(detectSubjects("ab")).toEqual([]);
    expect(detectSubjects("dobar dan kako ste")).toEqual([]);
  });

  it("„kod kuće” nije programiranje", () => {
    expect(detectSubjects("trebam instruktora da dođe kod kuće").map((m) => m.subject)).not.toContain("programiranje");
  });

  it("sva pravila koriste postojeće predmete", () => {
    const slugs = new Set(SUBJECTS.map((s) => s.slug));
    for (const r of _RULES_FOR_TESTS) expect(slugs.has(r.subject)).toBe(true);
  });
});

describe("razina iz teksta", () => {
  it.each([
    ["esej za maturu", "matura"],
    ["kolokvij na faksu", "fakultet"],
    ["matematika 5. razred", "os-5"],
    ["gimnazija, 2. razred", "ss"],
    ["razlomci", null],
  ])("„%s” → %s", (q, level) => {
    expect(detectLevel(q)).toBe(level);
  });
});

describe("pomoćne funkcije", () => {
  it("sažetak razina", () => {
    expect(levelsSummary(["os-1", "os-2", "os-3", "os-4", "ss", "matura"])).toBe("OŠ 1.–4., SŠ, Matura");
    expect(levelsSummary(["os-5", "os-7", "os-8"])).toBe("OŠ 5., 7.–8.");
  });
  it("gradovi i slugovi", () => {
    expect(CITIES).toHaveLength(128);
    expect(COUNTIES[0]).toBe("Grad Zagreb");
    expect(COUNTIES).toHaveLength(21);
    expect(cityBySlug("velika-gorica")?.name).toBe("Velika Gorica");
    expect(cityBySlug("dakovo")?.name).toBe("Đakovo");
    expect(cityByName("zagreb")?.county).toBe("Grad Zagreb");
  });
  it("dob", () => {
    const now = new Date("2026-11-09T12:00:00");
    expect(ageOn("2008-11-09", now)).toBe(18);
    expect(ageOn("2008-11-10", now)).toBe(17);
    expect(ageOn("2010-11-09", now)).toBe(16);
  });
});

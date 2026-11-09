// Prepoznavanje problema iz slobodnog teksta → predmet (i razina) koji treba.
// Isti mehanizam kao u Cehovi.hr (src/problemMatch.js): rječnik ključnih riječi, bez AI-ja, radi trenutno.
//
// Pravila ključnih riječi (BEZ dijakritika, malim slovima):
//   "razlom"        → prefiks riječi (razlomci, razlomke, razlomaka…)   = 1 bod
//   "=sila"         → točna riječ (za kratke/dvosmislene riječi)         = 1 bod
//   "tablica mnoz"  → fraza (počinje na granici riječi)                  = 2 boda
import { norm } from "./cities";

type Rule = { subject: string; kw: string[] };

const RULES: Rule[] = [
  {
    subject: "matematika",
    kw: ["matemat", "=mate", "=matu", "=matiku", "=mata", "razlom", "jednadzb", "nejednadzb", "postot", "derivacij",
      "integral", "funkcij", "geometrij", "trigonometrij", "=sinus", "kosinus", "tangens", "logarit", "algebr",
      "mnozenj", "dijeljenj", "zbrajanj", "oduzimanj", "kvadratn", "korijen", "vektor", "matric", "=limes",
      "pitagor", "=brojevi", "tablica mnoz", "decimaln", "proporcij", "=skup", "=skupovi", "kut", "=trokut",
      "povrsin", "opseg", "volumen", "=niz", "nizovi", "kompleksn", "polinom", "eksponencij", "=graf", "grafov"],
  },
  {
    subject: "hrvatski-jezik",
    kw: ["lektir", "pravopis", "gramatik", "=esej", "=eseja", "=eseje", "interpretacij", "sastavak", "=sastav",
      "knjizevn", "padez", "glagol", "imenic", "pridjev", "zamjenic", "interpunkcij", "=zarez", "pjesm", "=roman",
      "=hrvatski", "=hrvatskog", "=hrv", "analiza pjesme", "pisanje eseja", "stilsk", "naglas", "recenic",
      "sintaks", "morfolog", "fonolog", "pisanj", "=citanje", "lektire"],
  },
  {
    subject: "engleski-jezik",
    kw: ["englesk", "=english", "=grammar", "present perfect", "past simple", "present simple", "irregular verb",
      "=ielts", "=toefl", "=fce", "=cae", "cambridge", "=tenses", "nepravilni glagol"],
  },
  { subject: "njemacki-jezik", kw: ["njemack", "=deutsch", "goethe", "=dsd", "zertifikat", "=artikli", "=njem"] },
  { subject: "talijanski-jezik", kw: ["talijansk", "=italiano", "=tal"] },
  { subject: "francuski-jezik", kw: ["francusk", "=francais", "=delf"] },
  { subject: "spanjolski-jezik", kw: ["spanjolsk", "=espanol", "=dele"] },
  { subject: "latinski-jezik", kw: ["latinsk", "=latin", "=latinu", "=latina", "deklinacij", "konjugacij"] },
  {
    subject: "fizika",
    kw: ["fizik", "=sila", "=sile", "brzin", "ubrzanj", "newton", "kinematik", "dinamik", "elektricn", "=struja",
      "=strujni krug", "=otpor", "=ohm", "energij", "=snaga", "optik", "=val", "=valovi", "termodinamik",
      "gravitacij", "=tlak", "impuls", "=moment", "kolicina gibanja", "gibanj", "=lece", "magnet"],
  },
  {
    subject: "kemija",
    kw: ["kemij", "=mol", "molar", "kiselin", "luzin", "=baza", "=baze", "reakcij", "periodni sustav", "elektron",
      "=atom", "atomi", "organsk", "anorgan", "=spoj", "=spojevi", "otopin", "=ph", "stehiometrij", "valencij",
      "redoks", "oksidacij", "izomer", "ugljikovodi", "kemijsk"],
  },
  {
    subject: "biologija",
    kw: ["biolog", "stanic", "genetik", "=dnk", "=rnk", "evolucij", "fotosintez", "organiz", "mitoz", "mejoz",
      "anatomij", "ekolog", "biljk", "=zivotinj", "zivotinj", "fiziolog", "nasljedivanj", "mendel", "enzim",
      "probav", "krvotok", "=mikrob", "bakterij", "=virus"],
  },
  {
    subject: "informatika",
    kw: ["informatik", "=excel", "=word", "=powerpoint", "racunal", "=scratch", "baza podataka", "baze podataka",
      "=tablice", "=office", "binarn"],
  },
  {
    subject: "programiranje",
    kw: ["programir", "=python", "pythonu", "=java", "=javi", "javascript", "=c++", "=c#", "kodiranj",
      "algoritm", "=sql", "web stranic", "=html", "=css", "=react", "petlj", "=rekurzij", "=oop", "objektno"],
  },
  {
    subject: "povijest",
    kw: ["povijes", "=rat", "=ratovi", "svjetski rat", "srednji vijek", "antik", "revolucij", "=rim", "rimsk",
      "=grcka", "=carstv", "carstvo", "domovinski rat", "=bitka", "prapovijest", "renesans",],
  },
  {
    subject: "geografija",
    kw: ["geograf", "=karta", "=karte", "kontinent", "reljef", "glavni grad", "stanovnistv", "=klima", "klimatsk",
      "=rijeke", "=planine", "=drzave", "litosfer", "atmosfer", "geolog"],
  },
  { subject: "filozofija", kw: ["filozof", "=logika", "=logike", "=logiku", "=etika", "=etike", "silogiz", "sokrat", "platon", "kant"] },
  {
    subject: "ekonomija",
    kw: ["ekonomij", "ekonoms", "=ponuda", "potraznj", "makroekonom", "mikroekonom", "=bdp", "inflacij", "trzist",
      "elasticnost", "=poduzet", "marketing", "menadzment"],
  },
  { subject: "racunovodstvo", kw: ["racunovod", "knjigovod", "bilanc", "=konto", "=konta", "amortizacij", "=pdv", "dvojno knjig"] },
  {
    subject: "statistika",
    kw: ["statistik", "vjerojatnost", "=spss", "regresij", "hipotez", "standardna devijacij", "=prosjek", "varijanc",
      "korelacij", "distribucij", "=uzorak", "t test", "hi kvadrat"],
  },
  {
    subject: "pomoc-u-ucenju",
    kw: ["domaca zadac", "=zadaca", "=zadacu", "=zadace", "naucit citat", "koncentracij", "prvasic",
      "razredna nastava", "disleksij", "diskalkulij", "=pid", "priroda i drustvo", "=prirodu", "navike ucenja",
      "organizacija ucenja", "slova", "=pisati"],
  },
];

export type SubjectMatch = { subject: string; score: number };

function score(rawKw: string, words: string[], padded: string) {
  if (rawKw.startsWith("=")) {
    const kw = rawKw.slice(1);
    return kw.includes(" ") ? (padded.includes(" " + kw + " ") ? 2 : 0) : words.includes(kw) ? 1 : 0;
  }
  if (rawKw.includes(" ")) return padded.includes(" " + rawKw) ? 2 : 0;
  return words.some((w) => w.startsWith(rawKw)) ? 1 : 0;
}

// "c++" i "c#" norm() bi pretvorio u "c" — sačuvaj ih kao posebne riječi prije normalizacije
const normalizeText = (text: string) =>
  norm(String(text).replace(/c\+\+/gi, " cpp ").replace(/c#/gi, " csharp "))
    .replace(/\bcpp\b/g, "c++")
    .replace(/\bcsharp\b/g, "c#");

/** Vraća do 3 predmeta, najbolji prvi. */
export function detectSubjects(text: string): SubjectMatch[] {
  const n = normalizeText(text);
  if (n.length < 3) return [];
  const words = n.split(" ");
  const padded = " " + n + " ";
  const found: SubjectMatch[] = [];
  for (const rule of RULES) {
    let pts = 0;
    for (const k of rule.kw) pts += score(k, words, padded);
    if (pts > 0) found.push({ subject: rule.subject, score: pts });
  }
  found.sort((a, b) => b.score - a.score);
  if (!found.length) return [];
  const cutoff = found[0].score * 0.6;
  return found.filter((f) => f.score >= cutoff).slice(0, 3);
}

/** Razina iz teksta: "matura" → matura, "faks" → fakultet, "5. razred" → os-5, "gimnazija" → ss */
export function detectLevel(text: string): string | null {
  const n = norm(text);
  if (/\bmatur/.test(n)) return "matura";
  if (/\b(faks|fakultet|kolokvij|ispitni rok|studij|student)/.test(n)) return "fakultet";
  const srednja = /\b(srednj|gimnazij|strukovn|tehnick)/.test(n);
  if (srednja) return "ss";
  const m = /\b([1-8])\s*(razred|r)\b/.exec(n);
  if (m) return `os-${m[1]}`;
  if (/\b(osnovn|os)\b/.test(n)) return null;
  return null;
}

export const _RULES_FOR_TESTS = RULES;

"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cityByName } from "@/lib/cities";
import { LEVELS, MODES, SUBJECTS } from "@/lib/subjects";
import type { FormState } from "./auth";

const MIN_BIO = 50;

async function currentTutorId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase, id: null };
  const { data: t } = await supabase.from("tutors").select("id").eq("id", data.user.id).maybeSingle();
  return { supabase, id: (t?.id as string | undefined) ?? null };
}

export async function saveTutorProfile(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, id } = await currentTutorId();
  if (!id) return { error: "Samo instruktori mogu uređivati profil instruktora." };

  const pick = (name: string, allowed: string[]) =>
    [...new Set(form.getAll(name).map(String))].filter((v) => allowed.includes(v));
  const subjects = pick("subjects", SUBJECTS.map((s) => s.slug));
  const levels = pick("levels", LEVELS.map((l) => l.id));
  const modes = pick("modes", MODES.map((m) => m.id));
  const displayName = String(form.get("display_name") ?? "").trim();
  const headline = String(form.get("headline") ?? "").trim().slice(0, 120);
  const bio = String(form.get("bio") ?? "").trim().slice(0, 3000);
  const experience = String(form.get("experience") ?? "").trim().slice(0, 2000);
  const priceRaw = String(form.get("price_eur") ?? "").replace(",", ".");
  const price = priceRaw ? Number(priceRaw) : null;
  const expYears = form.get("experience_years") ? Number(form.get("experience_years")) : null;
  const radius = Number(form.get("travel_radius_km") ?? 10);
  const city = cityByName(String(form.get("city") ?? ""));

  if (displayName.length < 2) return { error: "Upišite ime koje će se prikazivati na profilu." };
  if (price != null && (!Number.isFinite(price) || price < 1 || price > 500)) return { error: "Cijena mora biti između 1 i 500 €." };
  if (expYears != null && (!Number.isInteger(expYears) || expYears < 0 || expYears > 60)) return { error: "Provjerite godine iskustva." };
  if (form.get("city") && !city) return { error: "Odaberite grad s popisa." };

  const submit = form.get("intent") === "submit";
  if (submit) {
    const missing = [
      !subjects.length && "barem jedan predmet",
      !levels.length && "barem jednu razinu",
      !modes.length && "način održavanja",
      price == null && "cijenu",
      !city && "grad",
      bio.length < MIN_BIO && `opis (najmanje ${MIN_BIO} znakova)`,
    ].filter(Boolean);
    if (missing.length) return { error: `Za slanje na odobrenje nedostaje: ${missing.join(", ")}.` };
  }

  const update: Record<string, unknown> = {
    display_name: displayName.slice(0, 80),
    headline: headline || null,
    bio: bio || null,
    experience: experience || null,
    subjects,
    levels,
    modes,
    price_eur: price,
    experience_years: expYears,
    travel_radius_km: Number.isFinite(radius) ? Math.min(100, Math.max(0, Math.round(radius))) : 10,
    city: city?.name ?? null,
    county: city?.county ?? null,
    lat: city?.lat ?? null,
    lng: city?.lng ?? null,
  };
  if (submit) update.submitted_at = new Date().toISOString();

  const { error } = await supabase.from("tutors").update(update).eq("id", id);
  if (error) {
    console.error("[tutor] save", error);
    return { error: "Spremanje nije uspjelo. Pokušajte ponovno." };
  }
  revalidatePath("/moj-profil");
  revalidatePath("/instruktor/[slug]", "page");
  return { ok: submit ? "Profil je poslan na odobrenje. Javit ćemo vam emailom." : "Promjene su spremljene." };
}

export async function saveAvailability(slots: { weekday: number; start_time: string; end_time: string }[]) {
  const { supabase, id } = await currentTutorId();
  if (!id) return { error: "Niste prijavljeni kao instruktor." };
  const clean = slots
    .filter((s) => s.weekday >= 1 && s.weekday <= 7 && /^\d{2}:\d{2}$/.test(s.start_time) && /^\d{2}:\d{2}$/.test(s.end_time))
    .filter((s) => s.end_time > s.start_time)
    .slice(0, 50);
  const { error: delErr } = await supabase.from("availability").delete().eq("tutor_id", id);
  if (delErr) return { error: "Spremanje nije uspjelo." };
  if (clean.length) {
    const { error } = await supabase.from("availability").insert(clean.map((s) => ({ ...s, tutor_id: id })));
    if (error) return { error: "Spremanje nije uspjelo." };
  }
  revalidatePath("/moj-profil");
  return { ok: "Dostupnost je spremljena." };
}

export async function setPhoto(url: string | null) {
  const { supabase, id } = await currentTutorId();
  if (!id) return { error: "Niste prijavljeni kao instruktor." };
  // dopuštene su samo slike iz vlastite mape u spremniku „avatars”
  const marker = "/storage/v1/object/public/avatars/";
  let stored: string | null = null;
  if (url) {
    const rest = url.slice(url.indexOf(marker) + marker.length);
    if (!url.includes(marker) || !rest.startsWith(`${id}/`) || rest.includes("..")) return { error: "Neispravna slika." };
    const base = process.env.NEXT_PUBLIC_SUPABASE_PROXY === "1" ? "/sb" : process.env.NEXT_PUBLIC_SUPABASE_URL;
    stored = `${base}${marker}${rest}`;
  }
  const { error } = await supabase.from("tutors").update({ photo_url: stored }).eq("id", id);
  if (error) return { error: "Spremanje slike nije uspjelo." };
  revalidatePath("/moj-profil");
  return { ok: "Slika je spremljena." };
}

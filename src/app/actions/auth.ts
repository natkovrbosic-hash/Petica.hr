"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/config";
import { ageOn } from "@/lib/age";

export type FormState = { error?: string; ok?: string } | null;

const safeNext = (n: FormDataEntryValue | null) => {
  const s = String(n ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
};

const AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials": "Pogrešan email ili lozinka.",
  "Email not confirmed": "Email još nije potvrđen — provjerite pretinac (i neželjenu poštu).",
  "User already registered": "Račun s tim emailom već postoji. Prijavite se ili zatražite novu lozinku.",
};
const tr = (msg: string) => AUTH_ERRORS[msg] ?? (msg.includes("najmanje") ? msg : "Nešto nije u redu. Pokušajte ponovno.");

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: tr(error.message) };
  revalidatePath("/", "layout");
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const role = form.get("role") === "instruktor" ? "instruktor" : "korisnik";
  const fullName = String(form.get("full_name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const birth = String(form.get("birth_date") ?? "");

  if (fullName.length < 2) return { error: "Upišite ime i prezime." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Upišite ispravan email." };
  if (password.length < 8) return { error: "Lozinka mora imati najmanje 8 znakova." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return { error: "Upišite datum rođenja." };
  const age = ageOn(birth);
  if (role === "instruktor" && (age < 18 || form.get("adult") !== "on"))
    return { error: "Instruktor mora imati najmanje 18 godina i to potvrditi." };
  if (role === "korisnik" && (age < 16 || form.get("age_ok") !== "on"))
    return { error: "Račun mogu otvoriti roditelji i učenici s najmanje 16 godina." };
  if (age > 110) return { error: "Provjerite datum rođenja." };
  if (form.get("terms") !== "on") return { error: "Za registraciju trebate prihvatiti Uvjete korištenja." };

  const supabase = await createClient();
  const next = role === "instruktor" ? "/moj-profil" : safeNext(form.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role, birth_date: birth },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: tr(error.message) };
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }
  return { ok: `Poslali smo poveznicu za potvrdu na ${email}. Otvorite je da biste dovršili registraciju.` };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(String(form.get("email") ?? "").trim(), {
    redirectTo: `${SITE_URL}/auth/callback?next=/nova-lozinka`,
  });
  // Isti odgovor bez obzira postoji li račun (ne otkrivamo tko je registriran)
  return { ok: "Ako račun postoji, poslali smo poveznicu za novu lozinku." };
}

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Lozinka mora imati najmanje 8 znakova." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Lozinku nije moguće promijeniti. Zatražite novu poveznicu." };
  redirect("/moj-racun?lozinka=promijenjena");
}

import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** Prijavljeni korisnik i njegov profil (jednom po zahtjevu). */
export const getSession = cache(async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { user: null, profile: null };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  return { user: data.user, profile: (profile as Profile | null) ?? null };
});

export async function requireUser(next = "/") {
  const s = await getSession();
  if (!s.user || !s.profile) redirect(`/prijava?next=${encodeURIComponent(next)}`);
  return { user: s.user, profile: s.profile };
}

export async function requireAdmin() {
  const s = await requireUser("/admin");
  if (s.profile.role !== "admin") redirect("/");
  return s;
}

"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { launchPromo } from "@/lib/config";

/** Besplatno razdoblje lansiranja: istaknuti profil bez plaćanja do kraja promocije (feature flag). */
export async function activatePromoFeatured() {
  const promo = launchPromo();
  if (!promo.active) return { error: "Besplatno razdoblje lansiranja je završilo." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Niste prijavljeni." };
  const { data: t } = await supabase.from("tutors").select("id, status").eq("id", auth.user.id).maybeSingle();
  if (!t) return { error: "Samo instruktori mogu istaknuti profil." };
  if (t.status !== "odobren") return { error: "Profil mora biti odobren prije isticanja." };

  const admin = createAdminClient();
  await admin.from("tutors").update({ featured_until: promo.until.toISOString() }).eq("id", t.id);
  await admin.from("subscriptions").upsert({
    tutor_id: t.id,
    status: "active",
    source: "promo",
    current_period_end: promo.until.toISOString(),
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/moj-profil");
  return { ok: "Istaknuti profil je uključen do kraja razdoblja lansiranja." };
}

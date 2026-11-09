"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import type { FormState } from "./auth";

export async function updateAccount(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Niste prijavljeni." };
  const fullName = String(form.get("full_name") ?? "").trim();
  if (fullName.length < 2 || fullName.length > 80) return { error: "Upišite ime i prezime." };
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, email_notifications: form.get("email_notifications") === "on" })
    .eq("id", data.user.id);
  if (error) return { error: "Spremanje nije uspjelo." };
  revalidatePath("/", "layout");
  return { ok: "Spremljeno." };
}

/** GDPR: trajno brisanje računa. Briše auth korisnika → kaskadno profil, profil instruktora, poruke, recenzije, favorite. */
export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("confirm") !== "OBRIŠI") return { error: "Za potvrdu upišite OBRIŠI." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Niste prijavljeni." };
  const admin = createAdminClient();

  // otkaži Stripe pretplatu ako postoji
  const { data: sub } = await admin.from("subscriptions").select("stripe_subscription_id").eq("tutor_id", data.user.id).maybeSingle();
  const stripe = getStripe();
  if (stripe && sub?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    } catch (e) {
      console.error("[account] otkaz pretplate", e);
    }
  }
  // obriši slike profila
  const { data: files } = await admin.storage.from("avatars").list(data.user.id);
  if (files?.length) await admin.storage.from("avatars").remove(files.map((f) => `${data.user!.id}/${f.name}`));

  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) return { error: "Brisanje nije uspjelo. Javite se podršci." };
  await supabase.auth.signOut();
  redirect("/?racun=obrisan");
}

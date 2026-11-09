"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notify";

async function me() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function submitReview(tutorId: string, rating: number, body: string) {
  const { supabase, user } = await me();
  if (!user) return { error: "Niste prijavljeni." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Odaberite ocjenu od 1 do 5." };
  const text = body.trim().slice(0, 2000) || null;

  const { data: existing } = await supabase.from("reviews").select("id").eq("tutor_id", tutorId).eq("author_id", user.id).maybeSingle();
  const { error } = existing
    ? await supabase.from("reviews").update({ rating, body: text }).eq("id", existing.id)
    : await supabase.from("reviews").insert({ tutor_id: tutorId, author_id: user.id, rating, body: text });
  if (error) {
    // RLS odbija recenziju ako korisnik i instruktor nisu razmijenili poruke
    return { error: "Recenziju možete ostaviti tek nakon što ste razmijenili poruke s instruktorom." };
  }

  if (!existing && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const { data: p } = await admin.from("profiles").select("email_notifications").eq("id", tutorId).single();
      const { data: u } = await admin.auth.admin.getUserById(tutorId);
      const { data: t } = await admin.from("tutors").select("slug").eq("id", tutorId).single();
      if (p?.email_notifications && u.user?.email)
        await sendEmail({
          to: u.user.email,
          subject: `Nova recenzija: ${"★".repeat(rating)}`,
          text: `Dobili ste novu recenziju (${rating}/5) na Petica.hr.`,
          link: `/instruktor/${t?.slug}#recenzije`,
        });
    } catch (e) {
      console.error("[notify] recenzija", e);
    }
  }
  revalidatePath("/instruktor/[slug]", "page");
  return { ok: existing ? "Recenzija je ažurirana." : "Hvala! Recenzija je objavljena." };
}

export async function deleteReview(tutorId: string) {
  const { supabase, user } = await me();
  if (!user) return { error: "Niste prijavljeni." };
  await supabase.from("reviews").delete().eq("tutor_id", tutorId).eq("author_id", user.id);
  revalidatePath("/instruktor/[slug]", "page");
  return { ok: "Recenzija je obrisana." };
}

export async function toggleFavorite(tutorId: string, on: boolean) {
  const { supabase, user } = await me();
  if (!user) return { error: "Niste prijavljeni." };
  const { error } = on
    ? await supabase.from("favorites").upsert({ user_id: user.id, tutor_id: tutorId })
    : await supabase.from("favorites").delete().eq("user_id", user.id).eq("tutor_id", tutorId);
  if (error) return { error: "Nije uspjelo." };
  revalidatePath("/moj-racun");
  return { ok: on ? "Spremljeno u favorite." : "Uklonjeno iz favorita." };
}

export async function submitReport(targetType: "recenzija" | "profil" | "poruka", targetId: string, reason: string) {
  const { supabase, user } = await me();
  if (!user) return { error: "Niste prijavljeni." };
  const text = reason.trim();
  if (text.length < 3) return { error: "Ukratko opišite razlog prijave." };
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: user.id, target_type: targetType, target_id: targetId, reason: text.slice(0, 1000) });
  if (error) return { error: "Prijava nije poslana." };
  return { ok: "Hvala, prijavu ćemo pregledati." };
}

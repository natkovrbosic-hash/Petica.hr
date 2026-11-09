"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notify";

async function adminClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Niste prijavljeni.");
  const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (p?.role !== "admin") throw new Error("Nemate ovlasti.");
  return supabase;
}

async function emailUser(userId: string, subject: string, text: string, link: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const admin = createAdminClient();
    const { data: u } = await admin.auth.admin.getUserById(userId);
    if (u.user?.email) await sendEmail({ to: u.user.email, subject, text, link });
  } catch (e) {
    console.error("[admin] email", e);
  }
}

export async function setTutorStatus(tutorId: string, status: "odobren" | "odbijen" | "na_cekanju", reason?: string) {
  const supabase = await adminClient();
  const { error } = await supabase
    .from("tutors")
    .update({
      status,
      rejection_reason: status === "odbijen" ? reason?.trim() || "Profil ne ispunjava uvjete." : null,
      approved_at: status === "odobren" ? new Date().toISOString() : null,
    })
    .eq("id", tutorId);
  if (error) return { error: "Nije uspjelo." };
  if (status === "odobren")
    await emailUser(tutorId, "Vaš profil je odobren 🎉", "Vaš profil instruktora na Petica.hr je odobren i sada je vidljiv u pretrazi.", "/moj-profil");
  if (status === "odbijen")
    await emailUser(
      tutorId,
      "Profil instruktora nije odobren",
      `Vaš profil instruktora nije odobren. Razlog: ${reason?.trim() || "profil ne ispunjava uvjete"}.\nIspravite podatke i ponovno ga pošaljite na odobrenje.`,
      "/moj-profil",
    );
  revalidatePath("/admin");
  return { ok: "Spremljeno." };
}

export async function setReviewStatus(reviewId: string, status: "objavljena" | "skrivena") {
  const supabase = await adminClient();
  const { error } = await supabase.from("reviews").update({ status }).eq("id", reviewId);
  if (error) return { error: "Nije uspjelo." };
  revalidatePath("/admin");
  return { ok: "Spremljeno." };
}

export async function deleteReviewAdmin(reviewId: string) {
  const supabase = await adminClient();
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) return { error: "Nije uspjelo." };
  revalidatePath("/admin");
  return { ok: "Obrisano." };
}

export async function resolveReport(reportId: string, status: "rijesena" | "odbacena", note?: string) {
  const supabase = await adminClient();
  const { error } = await supabase
    .from("reports")
    .update({ status, admin_note: note?.trim() || null, resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) return { error: "Nije uspjelo." };
  revalidatePath("/admin");
  return { ok: "Spremljeno." };
}

export async function setFeaturedManually(tutorId: string, days: number) {
  const supabase = await adminClient();
  const until = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
  const { error } = await supabase.from("tutors").update({ featured_until: until }).eq("id", tutorId);
  if (error) return { error: "Nije uspjelo." };
  revalidatePath("/admin");
  return { ok: "Spremljeno." };
}

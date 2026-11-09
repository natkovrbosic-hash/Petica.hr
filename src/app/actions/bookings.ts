"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notify";
import { dayLong, timeHM } from "@/lib/time";
import { modeName } from "@/lib/subjects";
import type { Slot } from "@/lib/types";

const DB_ERRORS = ["Termin", "Odaberite", "Prijavite", "Imate previše", "Ne možete", "Prošli termin"];
const clean = (msg: string, fallback: string) => (DB_ERRORS.some((p) => msg.startsWith(p)) ? msg : fallback);

/** Slobodni termini instruktora za idućih `days` dana (računa ih baza iz radnog vremena i rezervacija). */
export async function getSlots(tutorId: string, days = 14): Promise<Slot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("free_slots", { p_tutor: tutorId, p_days: days });
  if (error) {
    console.error("[bookings] free_slots", error);
    return [];
  }
  return (data ?? []) as Slot[];
}

async function emailTo(userId: string, subject: string, text: string, link: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const admin = createAdminClient();
    const { data: p } = await admin.from("profiles").select("email_notifications").eq("id", userId).single();
    if (!p?.email_notifications) return;
    const { data: u } = await admin.auth.admin.getUserById(userId);
    if (u.user?.email) await sendEmail({ to: u.user.email, subject, text, link });
  } catch (e) {
    console.error("[bookings] email", e);
  }
}

export async function bookLesson(tutorId: string, startsAt: string, mode: string, note: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Prijavite se za rezervaciju." };
  const { data: id, error } = await supabase.rpc("book_lesson", {
    p_tutor: tutorId,
    p_starts_at: startsAt,
    p_mode: mode,
    p_note: note.slice(0, 500) || null,
  });
  if (error) return { error: clean(error.message, "Rezervacija nije uspjela. Pokušajte ponovno.") };

  const { data: p } = await supabase.from("profiles").select("full_name").eq("id", auth.user.id).single();
  await emailTo(
    tutorId,
    `Novi termin: ${dayLong(startsAt)} u ${timeHM(startsAt)}`,
    `Rezerviran je novi termin: ${dayLong(startsAt)} u ${timeHM(startsAt)} (${modeName(mode)}).\nKorisnik: ${p?.full_name ?? "—"}${note ? `\nNapomena: ${note}` : ""}\n\nTermin je potvrđen automatski prema Vašem rasporedu. Ako termin ne možete održati, otkažite ga u odjeljku „Termini”.`,
    "/termini",
  );
  revalidatePath("/termini");
  return { ok: "Termin je rezerviran.", id: id as string };
}

export async function cancelBooking(bookingId: string, reason: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Niste prijavljeni." };
  const { data: b } = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  const { error } = await supabase.rpc("cancel_booking", { p_booking: bookingId, p_reason: reason.slice(0, 300) || null });
  if (error) return { error: clean(error.message, "Otkazivanje nije uspjelo.") };
  if (b) {
    const other = b.tutor_id === auth.user.id ? b.student_id : b.tutor_id;
    await emailTo(
      other,
      `Otkazan termin: ${dayLong(b.starts_at)} u ${timeHM(b.starts_at)}`,
      `Termin ${dayLong(b.starts_at)} u ${timeHM(b.starts_at)} je otkazan.${reason ? `\nRazlog: ${reason}` : ""}`,
      "/termini",
    );
  }
  revalidatePath("/termini");
  return { ok: "Termin je otkazan." };
}

/** Hitna dostupnost: hours = 0 isključuje, -1 = do kraja dana (21:00). */
export async function setHitno(hours: number) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Niste prijavljeni." };
  let until: Date | null = null;
  if (hours > 0) until = new Date(Date.now() + Math.min(hours, 12) * 3600000);
  if (hours === -1) {
    // 21:00 po zagrebačkom vremenu danas
    const zg = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Zagreb" }));
    const offsetMs = zg.getTime() - new Date().getTime();
    zg.setHours(21, 0, 0, 0);
    until = new Date(zg.getTime() - offsetMs);
    if (until <= new Date()) return { error: "Radni dan je završio. Odaberite trajanje u satima." };
  }
  const { error } = await supabase.from("tutors").update({ hitno_until: until?.toISOString() ?? null }).eq("id", auth.user.id);
  if (error) return { error: "Nije uspjelo." };
  revalidatePath("/moj-profil");
  return { ok: until ? "Hitna dostupnost je uključena." : "Hitna dostupnost je isključena." };
}

export async function saveBookingSettings(enabled: boolean, lessonMinutes: number, noticeHours: number) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Niste prijavljeni." };
  if (![45, 60, 90, 120].includes(lessonMinutes)) return { error: "Neispravno trajanje." };
  if (!(noticeHours >= 0 && noticeHours <= 72)) return { error: "Neispravna najava." };
  const { error } = await supabase
    .from("tutors")
    .update({ bookings_enabled: enabled, lesson_minutes: lessonMinutes, booking_notice_hours: noticeHours })
    .eq("id", auth.user.id);
  if (error) return { error: "Spremanje nije uspjelo." };
  revalidatePath("/moj-profil");
  return { ok: "Postavke rezervacija su spremljene." };
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GDPR: preuzimanje svih vlastitih podataka (JSON)
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  const id = auth.user.id;
  const [profile, tutor, availability, conversations, messages, reviews, favorites, reports, subscription, bookings] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("tutors").select("*").eq("id", id).maybeSingle(),
    supabase.from("availability").select("*").eq("tutor_id", id),
    supabase.from("conversations").select("*"),
    supabase.from("messages").select("*").order("created_at"),
    supabase.from("reviews").select("*").eq("author_id", id),
    supabase.from("favorites").select("*").eq("user_id", id),
    supabase.from("reports").select("*").eq("reporter_id", id),
    supabase.from("subscriptions").select("status, current_period_end, cancel_at_period_end, source").eq("tutor_id", id).maybeSingle(),
    supabase.from("bookings").select("*").order("starts_at"),
  ]);
  const body = {
    izvezeno: new Date().toISOString(),
    racun: { id, email: auth.user.email, kreiran: auth.user.created_at },
    profil: profile.data,
    profil_instruktora: tutor.data,
    dostupnost: availability.data,
    razgovori: conversations.data,
    poruke: messages.data,
    recenzije: reviews.data,
    favoriti: favorites.data,
    prijave: reports.data,
    pretplata: subscription.data,
    termini: bookings.data,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="instrukcije24-moji-podaci.json"`,
      "Cache-Control": "no-store",
    },
  });
}

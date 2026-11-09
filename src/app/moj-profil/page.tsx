import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Availability, Tutor } from "@/lib/types";
import { Notice } from "@/components/ui";
import { TutorProfileForm } from "./TutorProfileForm";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { PhotoUpload } from "./PhotoUpload";
import { FeaturedBox } from "./FeaturedBox";
import { BookingSettings, HitnoBox } from "./BookingSettings";
import { FEATURED_PRICE_EUR, launchPromo, stripeEnabled } from "@/lib/config";

export const metadata: Metadata = { title: "Moj profil instruktora", robots: { index: false } };

function StatusBanner({ t }: { t: Tutor }) {
  if (t.status === "odobren")
    return (
      <Notice kind="ok">
        Profil je odobren i vidljiv u pretrazi.{" "}
        <Link className="link" href={`/instruktor/${t.slug}`}>Pogledaj javni profil</Link>
      </Notice>
    );
  if (t.status === "odbijen")
    return (
      <Notice kind="error">
        Profil nije odobren{t.rejection_reason ? `: ${t.rejection_reason}` : "."} Ispravite podatke i ponovno ga pošaljite.
      </Notice>
    );
  if (t.submitted_at) return <Notice kind="warn">Profil čeka odobrenje administratora. Obično traje do 1 radnog dana.</Notice>;
  return <Notice>Ispunite profil i pošaljite ga na odobrenje. Tek odobreni profili vidljivi su u pretrazi.</Notice>;
}

export default async function MyTutorProfilePage({ searchParams }: { searchParams: Promise<{ pretplata?: string }> }) {
  const sp = await searchParams;
  const { profile } = await requireUser("/moj-profil");
  if (profile.role !== "instruktor") redirect("/moj-racun");
  const supabase = await createClient();
  const [{ data: tutor }, { data: availability }, { data: sub }] = await Promise.all([
    supabase.from("tutors").select("*").eq("id", profile.id).single(),
    supabase.from("availability").select("*").eq("tutor_id", profile.id).order("weekday").order("start_time"),
    supabase.from("subscriptions").select("status, source, current_period_end, cancel_at_period_end").eq("tutor_id", profile.id).maybeSingle(),
  ]);
  const promo = launchPromo();
  const t = tutor as Tutor;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Moj profil instruktora</h1>
      <StatusBanner t={t} />

      <HitnoBox hitnoUntil={t.hitno_until} approved={t.status === "odobren"} />

      <FeaturedBox
        approved={t.status === "odobren"}
        featuredUntil={t.featured_until}
        sub={sub}
        priceEur={FEATURED_PRICE_EUR}
        promo={{ active: promo.active, until: promo.until.toISOString() }}
        stripeEnabled={stripeEnabled()}
        notice={sp.pretplata}
      />

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-bold">Fotografija</h2>
        <PhotoUpload tutorId={t.id} name={t.display_name} url={t.photo_url} />
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-bold">Podaci o instrukcijama</h2>
        <TutorProfileForm t={t} />
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-bold">Tjedna dostupnost</h2>
        <p className="mb-4 text-sm text-slate-600">Vaše radno vrijeme za instrukcije. Iz njega se automatski nude termini za rezervaciju.</p>
        <AvailabilityEditor initial={(availability ?? []) as Availability[]} />
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-bold">Rezervacije termina</h2>
        <p className="mb-4 text-sm text-slate-600">
          Slobodni termini računaju se automatski iz tjedne dostupnosti i već rezerviranih sati.{" "}
          <a className="link" href="/termini">Moji termini</a>
        </p>
        <BookingSettings enabled={t.bookings_enabled} lessonMinutes={t.lesson_minutes} noticeHours={t.booking_notice_hours} />
      </section>

      <p className="text-xs text-slate-500">
        Kao instruktor sami ste odgovorni za svoje porezne i druge zakonske obveze (npr. prijava prihoda). Instrukcije24.hr
        ne posreduje u plaćanju instrukcija.
      </p>
    </div>
  );
}

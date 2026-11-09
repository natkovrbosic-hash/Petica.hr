import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { citySlug } from "@/lib/cities";
import { LEVELS, modeName, subjectBySlug } from "@/lib/subjects";
import { isFeatured, type Availability, type Review, type Tutor } from "@/lib/types";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { Avatar, FeaturedBadge, Notice, Stars, TestBadge, formatDate, formatEur } from "@/components/ui";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ReportButton } from "@/components/ReportButton";
import { ContactBox } from "./ContactBox";
import { ReviewForm } from "./ReviewForm";

type Params = { params: Promise<{ slug: string }> };

const getTutor = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("tutors").select("*").eq("slug", slug).maybeSingle();
  return data as Tutor | null;
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = await getTutor((await params).slug);
  if (!t) return { title: "Instruktor nije pronađen" };
  const subjects = t.subjects.map((s) => subjectBySlug(s)?.name).filter(Boolean).join(", ");
  return {
    title: `${t.display_name} — instrukcije: ${subjects}${t.city ? `, ${t.city}` : ""}`,
    description: (t.headline ? t.headline + ". " : "") + (t.bio ?? "").slice(0, 140),
    alternates: { canonical: `/instruktor/${t.slug}` },
    robots: t.status === "odobren" && !t.is_test ? undefined : { index: false },
    openGraph: { images: t.photo_url ? [t.photo_url] : undefined },
  };
}

export default async function TutorPage({ params }: Params) {
  const { slug } = await params;
  const t = await getTutor(slug);
  if (!t) notFound();

  const { user, profile } = await getSession();
  const supabase = await createClient();
  const [{ data: availability }, { data: reviewsRaw }, conv, fav, canReview, myReview] = await Promise.all([
    supabase.from("availability").select("*").eq("tutor_id", t.id).order("weekday").order("start_time"),
    supabase.from("reviews").select("*").eq("tutor_id", t.id).eq("status", "objavljena").order("created_at", { ascending: false }),
    user ? supabase.from("conversations").select("id").eq("student_id", user.id).eq("tutor_id", t.id).maybeSingle() : null,
    user ? supabase.from("favorites").select("tutor_id").eq("user_id", user.id).eq("tutor_id", t.id).maybeSingle() : null,
    user ? supabase.rpc("can_review", { p_tutor: t.id }) : null,
    user ? supabase.from("reviews").select("*").eq("tutor_id", t.id).eq("author_id", user.id).maybeSingle() : null,
  ]);
  const reviews = (reviewsRaw ?? []) as Review[];
  const isSelf = user?.id === t.id;

  // imena autora recenzija: samo ime i početno slovo prezimena (ne otkrivamo puno ime)
  const authorNames = new Map<string, string>();
  if (reviews.length) {
    const { data } = await supabase.rpc("review_author_names", { p_tutor: t.id });
    for (const r of (data ?? []) as { author_id: string; short_name: string }[]) authorNames.set(r.author_id, r.short_name);
  }

  const levelGroups = [
    { title: "Osnovna škola", ids: LEVELS.filter((l) => l.group === "os").map((l) => l.id) },
    { title: "Ostalo", ids: ["ss", "matura", "fakultet"] },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: t.display_name,
      description: t.headline ?? undefined,
      image: t.photo_url ?? undefined,
      url: `${SITE_URL}/instruktor/${t.slug}`,
      address: t.city ? { "@type": "PostalAddress", addressLocality: t.city, addressCountry: "HR" } : undefined,
      knowsAbout: t.subjects.map((s) => subjectBySlug(s)?.name),
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {t.status !== "odobren" && (
        <div className="mb-4">
          <Notice kind="warn">Ovaj profil još nije odobren i nije vidljiv u pretrazi.</Notice>
        </div>
      )}
      {t.is_test && (
        <div className="mb-4">
          <Notice kind="warn">Ovo je <strong>testni profil</strong> za demonstraciju — osoba i podaci nisu stvarni.</Notice>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex gap-4">
              <Avatar name={t.display_name} src={t.photo_url} size={96} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900">{t.display_name}</h1>
                  {isFeatured(t) && <FeaturedBadge />}
                  {t.is_test && <TestBadge />}
                </div>
                {t.headline && <p className="mt-1 text-slate-700">{t.headline}</p>}
                <div className="mt-2">
                  <Stars value={t.rating_avg} count={t.rating_count} size="lg" />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  📍 {t.city ?? "—"}
                  {t.county ? `, ${t.county}` : ""}
                  {t.experience_years != null && ` · ${t.experience_years} god. iskustva`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {t.subjects.map((s) => {
                const sub = subjectBySlug(s);
                return t.city && sub ? (
                  <Link key={s} href={`/instrukcije/${s}/${citySlug(t.city)}`} className="chip bg-brand-50 py-1.5 text-sm text-brand-800 hover:bg-brand-100">
                    {sub.emoji} {sub.name}
                  </Link>
                ) : (
                  <span key={s} className="chip">{sub?.name ?? s}</span>
                );
              })}
            </div>
          </section>

          {t.bio && (
            <section className="card p-5">
              <h2 className="text-lg font-bold">O meni</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{t.bio}</p>
            </section>
          )}

          <section className="card grid gap-5 p-5 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-bold">Razine</h2>
              {levelGroups.map((g) => {
                const ls = LEVELS.filter((l) => g.ids.includes(l.id) && t.levels.includes(l.id));
                if (!ls.length) return null;
                return (
                  <div key={g.title} className="mt-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">{g.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {ls.map((l) => (
                        <span key={l.id} className="chip">{g.title === "Osnovna škola" ? `${l.id.slice(3)}. razred` : l.name}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <h2 className="text-lg font-bold">Način</h2>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {t.modes.map((m) => (
                  <li key={m}>
                    ✓ {modeName(m)}
                    {m === "dolazim" && t.travel_radius_km > 0 ? ` (do ${t.travel_radius_km} km)` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {t.experience && (
            <section className="card p-5">
              <h2 className="text-lg font-bold">Iskustvo i obrazovanje</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] text-slate-700">{t.experience}</p>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-3 text-lg font-bold">Dostupnost (tjedno)</h2>
            <AvailabilityGrid slots={(availability ?? []) as Availability[]} />
          </section>

          <section className="card p-5" id="recenzije">
            <h2 className="text-lg font-bold">Recenzije ({reviews.length})</h2>
            {user && !isSelf && (
              <div className="mt-3">
                {canReview?.data || myReview?.data ? (
                  <ReviewForm tutorId={t.id} existing={(myReview?.data as Review | null) ?? null} />
                ) : (
                  <p className="text-sm text-slate-500">
                    Recenziju možete ostaviti nakon što razmijenite poruke s instruktorom.
                  </p>
                )}
              </div>
            )}
            <ul className="mt-4 divide-y divide-slate-100">
              {reviews.length === 0 && <li className="py-2 text-sm text-slate-500">Još nema recenzija.</li>}
              {reviews.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Stars value={r.rating} />
                    <span className="text-xs text-slate-500">{formatDate(r.created_at)}</span>
                  </div>
                  {r.body && <p className="mt-1 text-[15px] text-slate-700">{r.body}</p>}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{authorNames.get(r.author_id) ?? "Korisnik"}</span>
                    {user && user.id !== r.author_id && <ReportButton targetType="recenzija" targetId={r.id} compact />}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div id="kontakt" className="card scroll-mt-20 p-5">
            <p className="text-3xl font-extrabold">
              {formatEur(t.price_eur)} <span className="text-base font-medium text-slate-500">/ sat</span>
            </p>
            <div className="mt-4">
              <ContactBox
                tutorId={t.id}
                tutorName={t.display_name}
                slug={t.slug}
                loggedIn={Boolean(user)}
                isSelf={isSelf}
                conversationId={(conv?.data?.id as string | undefined) ?? null}
              />
            </div>
            {user && !isSelf && profile && (
              <div className="mt-3 flex items-center justify-between">
                <FavoriteButton tutorId={t.id} initial={Boolean(fav?.data)} />
                <ReportButton targetType="profil" targetId={t.id} />
              </div>
            )}
          </div>
          <p className="px-1 text-xs text-slate-500">
            Instruktor je samostalno odgovoran za svoje porezne i zakonske obveze. Petica.hr samo prodaje oglasni prostor i
            ne sudjeluje u dogovoru ni plaćanju instrukcija.
          </p>
        </aside>
      </div>
      {!isSelf && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <p className="text-lg font-extrabold">
            {formatEur(t.price_eur)} <span className="text-sm font-medium text-slate-500">/ sat</span>
          </p>
          <a href="#kontakt" className="btn-primary">Pošalji poruku</a>
        </div>
      )}
      <div className="h-16 lg:hidden" aria-hidden />
    </div>
  );
}

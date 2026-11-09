import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FEATURED_PRICE_EUR, launchPromo } from "@/lib/config";
import { levelsSummary, modeName, subjectName } from "@/lib/subjects";
import { isFeatured, type Review, type Tutor } from "@/lib/types";
import { Stars, TestBadge, formatDate, formatEur } from "@/components/ui";
import { FeatureToggle, ReportResolution, ReviewModeration, TutorModeration } from "./AdminButtons";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const TABS = [
  ["pregled", "Pregled"],
  ["profili", "Profili"],
  ["recenzije", "Recenzije"],
  ["prijave", "Prijave"],
  ["pretplate", "Pretplate"],
] as const;

const STATUS_LABEL: Record<string, string> = { na_cekanju: "Na čekanju", odobren: "Odobren", odbijen: "Odbijen" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = TABS.some(([id]) => id === sp.tab) ? sp.tab! : "pregled";
  const supabase = await createClient();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-extrabold">Admin</h1>
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(([id, label]) => (
          <Link
            key={id}
            href={`/admin?tab=${id}`}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${tab === id ? "border-brand-600 text-brand-700" : "border-transparent text-slate-600"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        {tab === "pregled" && <Overview supabase={supabase} />}
        {tab === "profili" && <Profiles supabase={supabase} status={sp.status ?? "na_cekanju"} />}
        {tab === "recenzije" && <Reviews supabase={supabase} />}
        {tab === "prijave" && <Reports supabase={supabase} />}
        {tab === "pretplate" && <Subscriptions supabase={supabase} />}
      </div>
    </div>
  );
}

type SB = Awaited<ReturnType<typeof createClient>>;

async function Overview({ supabase }: { supabase: SB }) {
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const head = { count: "exact" as const, head: true };
  const [users, approved, pending, openReports, reviews, paid, promo, featured] = await Promise.all([
    count(supabase.from("profiles").select("id", head)),
    count(supabase.from("tutors").select("id", head).eq("status", "odobren")),
    count(supabase.from("tutors").select("id", head).eq("status", "na_cekanju").not("submitted_at", "is", null)),
    count(supabase.from("reports").select("id", head).eq("status", "otvorena")),
    count(supabase.from("reviews").select("id", head)),
    count(supabase.from("subscriptions").select("tutor_id", head).eq("source", "stripe").in("status", ["active", "trialing", "past_due"])),
    count(supabase.from("subscriptions").select("tutor_id", head).eq("source", "promo")),
    count(supabase.from("tutors").select("id", head).gt("featured_until", new Date().toISOString())),
  ]);
  const p = launchPromo();
  const cards: [string, string | number, string?][] = [
    ["Korisnici", users],
    ["Odobreni instruktori", approved],
    ["Profili na čekanju", pending, "/admin?tab=profili"],
    ["Otvorene prijave", openReports, "/admin?tab=prijave"],
    ["Recenzije", reviews, "/admin?tab=recenzije"],
    ["Istaknuti profili", featured, "/admin?tab=pretplate"],
    ["Plaćene pretplate", paid],
    ["Procjena MRR", formatEur(paid * FEATURED_PRICE_EUR)],
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(([label, value, href]) => {
          const inner = (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
              <p className="mt-1 text-2xl font-extrabold">{value}</p>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="card p-4 hover:border-brand-300">{inner}</Link>
          ) : (
            <div key={label} className="card p-4">{inner}</div>
          );
        })}
      </div>
      <p className="text-sm text-slate-600">
        Besplatno razdoblje lansiranja: {p.active ? `uključeno do ${formatDate(p.until)}` : "isključeno"} · promo istaknutih: {promo}
      </p>
    </div>
  );
}

async function Profiles({ supabase, status }: { supabase: SB; status: string }) {
  let q = supabase.from("tutors").select("*").order("submitted_at", { ascending: true, nullsFirst: false }).limit(100);
  if (status === "na_cekanju") q = q.eq("status", "na_cekanju").not("submitted_at", "is", null);
  else if (status === "nedovrseni") q = q.eq("status", "na_cekanju").is("submitted_at", null);
  else q = q.eq("status", status);
  const { data } = await q;
  const tutors = (data ?? []) as Tutor[];
  const filters = [
    ["na_cekanju", "Čekaju odobrenje"],
    ["odobren", "Odobreni"],
    ["odbijen", "Odbijeni"],
    ["nedovrseni", "Nedovršeni"],
  ];
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map(([id, label]) => (
          <Link key={id} href={`/admin?tab=profili&status=${id}`} className={`chip py-1.5 ${status === id ? "bg-brand-600 text-white" : ""}`}>
            {label}
          </Link>
        ))}
      </div>
      {tutors.length === 0 && <p className="text-sm text-slate-600">Nema profila.</p>}
      <div className="space-y-3">
        {tutors.map((t) => (
          <div key={t.id} className="card space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/instruktor/${t.slug}`} className="font-bold hover:underline" target="_blank">{t.display_name}</Link>
              <span className="chip">{STATUS_LABEL[t.status]}</span>
              {t.is_test && <TestBadge />}
              {isFeatured(t) && <span className="chip bg-gold-100 text-gold-700">★ do {formatDate(t.featured_until!)}</span>}
            </div>
            <p className="text-sm text-slate-700">{t.headline}</p>
            <p className="text-xs text-slate-600">
              {t.subjects.map(subjectName).join(", ") || "— nema predmeta"} · {levelsSummary(t.levels) || "— nema razina"} ·{" "}
              {t.modes.map((m) => modeName(m, true)).join(", ") || "— nema načina"} · {formatEur(t.price_eur)} · {t.city ?? "— nema grada"}
            </p>
            {t.bio && <p className="line-clamp-3 text-sm text-slate-600">{t.bio}</p>}
            {t.rejection_reason && <p className="text-xs text-red-700">Razlog odbijanja: {t.rejection_reason}</p>}
            <p className="text-xs text-slate-500">
              Registriran {formatDate(t.created_at)}
              {t.submitted_at && ` · poslan na odobrenje ${formatDate(t.submitted_at)}`}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TutorModeration tutorId={t.id} status={t.status} />
              {t.status === "odobren" && <FeatureToggle tutorId={t.id} featured={isFeatured(t)} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function Reviews({ supabase }: { supabase: SB }) {
  const { data } = await supabase
    .from("reviews")
    .select("*, tutors(slug, display_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const reviews = (data ?? []) as (Review & { tutors: { slug: string; display_name: string } })[];
  return (
    <div className="space-y-3">
      {reviews.length === 0 && <p className="text-sm text-slate-600">Nema recenzija.</p>}
      {reviews.map((r) => (
        <div key={r.id} className={`card space-y-1 p-4 ${r.status === "skrivena" ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Stars value={r.rating} />
            <span>za</span>
            <Link className="link" href={`/instruktor/${r.tutors.slug}`}>{r.tutors.display_name}</Link>
            <span className="text-xs text-slate-500">{formatDate(r.created_at)}</span>
            {r.status === "skrivena" && <span className="chip">skrivena</span>}
          </div>
          {r.body && <p className="text-sm text-slate-700">{r.body}</p>}
          <ReviewModeration reviewId={r.id} status={r.status} />
        </div>
      ))}
    </div>
  );
}

async function Reports({ supabase }: { supabase: SB }) {
  const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
  const reports = (data ?? []) as {
    id: string; target_type: string; target_id: string; reason: string; status: string; created_at: string; admin_note: string | null;
  }[];
  const reviewIds = reports.filter((r) => r.target_type === "recenzija").map((r) => r.target_id);
  const tutorIds = reports.filter((r) => r.target_type === "profil").map((r) => r.target_id);
  const messageIds = reports.filter((r) => r.target_type === "poruka").map((r) => r.target_id);
  const [rv, tu, ms] = await Promise.all([
    reviewIds.length ? supabase.from("reviews").select("id, body, rating, status, tutors(slug, display_name)").in("id", reviewIds) : { data: [] },
    tutorIds.length ? supabase.from("tutors").select("id, slug, display_name").in("id", tutorIds) : { data: [] },
    messageIds.length ? supabase.from("messages").select("id, body, conversation_id").in("id", messageIds) : { data: [] },
  ]);
  const byId = new Map<string, Record<string, unknown>>();
  for (const x of [...(rv.data ?? []), ...(tu.data ?? []), ...(ms.data ?? [])] as Record<string, unknown>[]) byId.set(x.id as string, x);

  return (
    <div className="space-y-3">
      {reports.length === 0 && <p className="text-sm text-slate-600">Nema prijava.</p>}
      {reports.map((r) => {
        const target = byId.get(r.target_id);
        return (
          <div key={r.id} className={`card space-y-2 p-4 ${r.status !== "otvorena" ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="chip">{r.target_type}</span>
              <span className="chip">{r.status}</span>
              <span className="text-xs text-slate-500">{formatDate(r.created_at)}</span>
            </div>
            <p className="text-sm"><strong>Razlog:</strong> {r.reason}</p>
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {!target && "Sadržaj je obrisan."}
              {target && r.target_type === "recenzija" && (
                <>
                  „{String(target.body ?? "(bez teksta)")}” — {String(target.rating)}★ za{" "}
                  <Link className="link" href={`/instruktor/${(target.tutors as { slug: string }).slug}`}>
                    {(target.tutors as { display_name: string }).display_name}
                  </Link>
                  <div className="mt-2">
                    <ReviewModeration reviewId={r.target_id} status={String(target.status)} />
                  </div>
                </>
              )}
              {target && r.target_type === "profil" && (
                <Link className="link" href={`/instruktor/${String(target.slug)}`}>{String(target.display_name)}</Link>
              )}
              {target && r.target_type === "poruka" && <>„{String(target.body)}”</>}
            </div>
            {r.admin_note && <p className="text-xs text-slate-500">Bilješka: {r.admin_note}</p>}
            {r.status === "otvorena" && <ReportResolution reportId={r.id} />}
          </div>
        );
      })}
    </div>
  );
}

async function Subscriptions({ supabase }: { supabase: SB }) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*, tutors(slug, display_name, featured_until)")
    .order("updated_at", { ascending: false })
    .limit(200);
  const subs = (data ?? []) as {
    tutor_id: string; status: string; source: string; current_period_end: string | null; cancel_at_period_end: boolean;
    stripe_subscription_id: string | null; tutors: { slug: string; display_name: string; featured_until: string | null };
  }[];
  const SRC: Record<string, string> = { stripe: "Stripe", promo: "Lansiranje (besplatno)", test: "Testni način" };
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs text-slate-500 uppercase">
          <tr>
            <th className="p-3">Instruktor</th>
            <th className="p-3">Izvor</th>
            <th className="p-3">Status</th>
            <th className="p-3">Razdoblje do</th>
            <th className="p-3">Istaknut do</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subs.length === 0 && (
            <tr><td className="p-3 text-slate-600" colSpan={5}>Nema pretplata.</td></tr>
          )}
          {subs.map((s) => (
            <tr key={s.tutor_id}>
              <td className="p-3"><Link className="link" href={`/instruktor/${s.tutors.slug}`}>{s.tutors.display_name}</Link></td>
              <td className="p-3">{SRC[s.source] ?? s.source}</td>
              <td className="p-3">
                {s.status}
                {s.cancel_at_period_end && " (otkazana)"}
              </td>
              <td className="p-3">{s.current_period_end ? formatDate(s.current_period_end) : "—"}</td>
              <td className="p-3">{s.tutors.featured_until ? formatDate(s.tutors.featured_until) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

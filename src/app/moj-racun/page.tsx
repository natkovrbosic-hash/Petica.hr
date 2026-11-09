import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions/auth";
import { Notice } from "@/components/ui";
import { TutorCard } from "@/components/TutorCard";
import type { SearchResult } from "@/lib/types";
import { isFeatured } from "@/lib/types";
import { AccountForm, DeleteAccountForm } from "./AccountForms";

export const metadata: Metadata = { title: "Moj račun", robots: { index: false } };

const ROLE: Record<string, string> = { korisnik: "Roditelj / učenik", instruktor: "Instruktor", admin: "Administrator" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ lozinka?: string }> }) {
  const sp = await searchParams;
  const { user, profile } = await requireUser("/moj-racun");
  const supabase = await createClient();
  const { data: favs } = await supabase
    .from("favorites")
    .select("tutors(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const favorites = (favs ?? [])
    .map((f) => f.tutors as unknown as SearchResult & { featured_until: string | null; status: string })
    .filter((t) => t && t.status === "odobren")
    .map((t) => ({ ...t, is_featured: isFeatured(t), distance_km: null, total_count: 0 }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moj račun</h1>
        <form action={signOut}>
          <button className="btn-secondary btn-sm">Odjava</button>
        </form>
      </div>
      {sp.lozinka && <Notice kind="ok">Lozinka je promijenjena.</Notice>}
      <p className="text-sm text-slate-600">
        {user.email}, {ROLE[profile.role].toLowerCase()}
      </p>

      {profile.role === "instruktor" && (
        <Link href="/moj-profil" className="card block p-5 hover:border-brand-300">
          <p className="font-bold">Moj profil instruktora</p>
          <p className="text-sm text-slate-600">Uredite profil, dostupnost i istaknuti profil.</p>
        </Link>
      )}

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-bold">Osnovni podaci</h2>
        <AccountForm fullName={profile.full_name} emailNotifications={profile.email_notifications} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Favoriti</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-slate-600">
            Još nemate spremljenih instruktora. Na profilu instruktora kliknite „Spremi u favorite”.
          </p>
        ) : (
          <div className="space-y-3">
            {favorites.map((t) => (
              <TutorCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-bold">Privatnost</h2>
        <p className="mt-1 text-sm text-slate-600">
          Preuzmite kopiju svih svojih podataka (JSON) ili trajno obrišite račun.{" "}
          <Link className="link" href="/privatnost">Politika privatnosti</Link>
        </p>
        <a href="/api/moj-racun/izvoz" className="btn-secondary btn-sm mt-3">Preuzmi moje podatke</a>
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-semibold text-red-700">Obriši račun</summary>
          <div className="mt-3">
            <DeleteAccountForm />
          </div>
        </details>
      </section>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Me = { name: string; role: string } | null;

// Prijava se provjerava u pregledniku kako bi javne stranice (SEO) mogle ostati statične i keširane.
export function UserMenu() {
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- bez Supabase konfiguracije nema prijave
      setMe(null);
      return;
    }
    const supabase = createClient();
    // Samo za prikaz izbornika (ne za provjeru ovlasti — to radi server): sesija iz kolačića, bez mrežnog poziva.
    // Ponovno pri svakoj promjeni stranice, jer prijava/odjava ide preko server akcija.
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return setMe(null);
      const { data: p, error } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
      // ako baza nije dostupna iz preglednika, izbornik se gradi iz podataka sesije
      const meta = user.user_metadata as { full_name?: string; role?: string };
      setMe(p ? { name: p.full_name, role: p.role } : error ? { name: meta.full_name ?? user.email ?? "?", role: meta.role ?? "korisnik" } : null);
      const { data: convs } = await supabase.rpc("my_conversations");
      setUnread(((convs ?? []) as { unread: number }[]).reduce((s, c) => s + Number(c.unread), 0));
    };
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void load();
    });
    return () => sub.subscription.unsubscribe();
  }, [pathname]);

  if (me === undefined) return <span className="size-9" aria-hidden />;
  if (!me)
    return (
      <>
        <Link href="/za-instruktore" className="hidden rounded-md px-3 py-2 hover:bg-white/10 sm:block">
          Za instruktore
        </Link>
        <Link href="/prijava" className="ml-1 rounded-md bg-chalk px-3.5 py-2 text-board hover:bg-white">
          Prijava
        </Link>
      </>
    );
  return (
    <>
      <Link href="/termini" className="hidden rounded-md px-3 py-2 hover:bg-white/10 sm:block">
        Termini
      </Link>
      <Link href="/poruke" className="relative rounded-md px-3 py-2 hover:bg-white/10">
        Poruke
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-gold-400 px-1 text-[11px] font-bold text-board">
            {unread}
          </span>
        )}
      </Link>
      {me.role === "instruktor" && (
        <Link href="/moj-profil" className="hidden rounded-md px-3 py-2 hover:bg-white/10 md:block">
          Moj profil
        </Link>
      )}
      {me.role === "admin" && (
        <Link href="/admin" className="rounded-md px-3 py-2 hover:bg-white/10">
          Admin
        </Link>
      )}
      <Link
        href="/moj-racun"
        className="ml-1 grid size-9 place-items-center rounded-md bg-chalk text-sm font-bold text-board"
        aria-label="Moj račun"
        title={me.name}
      >
        {me.name.slice(0, 1).toUpperCase()}
      </Link>
    </>
  );
}

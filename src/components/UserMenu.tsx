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
      const { data: p } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
      setMe(p ? { name: p.full_name, role: p.role } : null);
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
        <Link href="/za-instruktore" className="hidden rounded-lg px-2.5 py-2 hover:bg-slate-100 sm:block">
          Za instruktore
        </Link>
        <Link href="/prijava" className="btn-primary btn-sm">
          Prijava
        </Link>
      </>
    );
  return (
    <>
      <Link href="/poruke" className="relative rounded-lg px-2.5 py-2 hover:bg-slate-100">
        Poruke
        {unread > 0 && (
          <span className="absolute -top-0.5 right-0 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unread}
          </span>
        )}
      </Link>
      {me.role === "instruktor" && (
        <Link href="/moj-profil" className="hidden rounded-lg px-2.5 py-2 hover:bg-slate-100 sm:block">
          Moj profil
        </Link>
      )}
      {me.role === "admin" && (
        <Link href="/admin" className="rounded-lg px-2.5 py-2 text-brand-700 hover:bg-slate-100">
          Admin
        </Link>
      )}
      <Link
        href="/moj-racun"
        className="grid size-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800"
        aria-label="Moj račun"
        title={me.name}
      >
        {me.name.slice(0, 1).toUpperCase()}
      </Link>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ConversationListItem } from "@/lib/types";
import { Avatar } from "@/components/ui";

export const metadata: Metadata = { title: "Poruke", robots: { index: false } };

const when = (d: string) => {
  const tz = { timeZone: "Europe/Zagreb" } as const;
  const date = new Date(d);
  const sameDay = date.toLocaleDateString("hr-HR", tz) === new Date().toLocaleDateString("hr-HR", tz);
  return sameDay
    ? date.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit", ...tz })
    : date.toLocaleDateString("hr-HR", { day: "numeric", month: "numeric", ...tz });
};

export default async function MessagesPage() {
  const { profile } = await requireUser("/poruke");
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_conversations");
  const list = (data ?? []) as ConversationListItem[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-extrabold">Poruke</h1>
      {list.length === 0 ? (
        <div className="card mt-6 p-6 text-center text-sm text-slate-600">
          {profile.role === "instruktor" ? (
            "Još nemate poruka. Kad vam se javi korisnik, razgovor će se pojaviti ovdje."
          ) : (
            <>
              Još nemate poruka. <Link className="link" href="/pretraga">Pronađite instruktora</Link> i pošaljite mu poruku.
            </>
          )}
        </div>
      ) : (
        <ul className="card mt-6 divide-y divide-slate-100">
          {list.map((c) => (
            <li key={c.id}>
              <Link href={`/poruke/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                <Avatar name={c.other_name} src={c.other_photo} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate ${c.unread > 0 ? "font-extrabold" : "font-semibold"}`}>{c.other_name}</p>
                    <span className="shrink-0 text-xs text-slate-500">{when(c.last_message_at)}</span>
                  </div>
                  <p className={`truncate text-sm ${c.unread > 0 ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                    {c.last_message ?? "—"}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="grid min-w-6 place-items-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

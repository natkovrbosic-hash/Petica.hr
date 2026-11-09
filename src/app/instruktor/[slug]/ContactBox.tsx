"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { startConversation } from "../../actions/messages";

export function ContactBox({
  tutorId,
  tutorName,
  slug,
  loggedIn,
  isSelf,
  conversationId,
}: {
  tutorId: string;
  tutorName: string;
  slug: string;
  loggedIn: boolean;
  isSelf: boolean;
  conversationId: string | null;
}) {
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (isSelf) return <p className="text-sm text-slate-600">Ovo je vaš javni profil.</p>;
  if (!loggedIn)
    return (
      <Link href={`/prijava?next=${encodeURIComponent(`/instruktor/${slug}`)}`} className="btn-primary w-full">
        Prijavite se i pošaljite poruku
      </Link>
    );
  if (conversationId)
    return (
      <Link href={`/poruke/${conversationId}`} className="btn-primary w-full">
        Nastavi razgovor
      </Link>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          const res = await startConversation(tutorId, text);
          if (res?.error) setErr(res.error);
        });
      }}
      className="space-y-2"
    >
      <label htmlFor="first-msg" className="label">Poruka za {tutorName.replace(" (TEST)", "")}</label>
      <textarea
        id="first-msg"
        className="input min-h-28"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={4000}
        placeholder="Predstavite se: predmet, razred, što vam treba, kada bi vam odgovaralo…"
        required
      />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button className="btn-primary w-full" disabled={pending || !text.trim()}>
        {pending ? "Slanje…" : "Pošaljite poruku"}
      </button>
      <p className="text-xs text-slate-500">
        Termin, mjesto i cijenu dogovarate izravno s instruktorom. Petica.hr ne naplaćuje instrukcije.
      </p>
    </form>
  );
}

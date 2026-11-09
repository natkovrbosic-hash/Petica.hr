"use client";
import { useState, useTransition } from "react";
import { deleteReview, submitReview } from "../../actions/social";
import type { Review } from "@/lib/types";

export function ReviewForm({ tutorId, existing }: { tutorId: string; existing: Review | null }) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [open, setOpen] = useState(!existing);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();

  if (!open)
    return (
      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
        <span>
          Vaša recenzija: {"★".repeat(existing!.rating)}
          {existing!.status === "skrivena" && " (skrivena od moderatora)"}
        </span>
        <button className="link" onClick={() => setOpen(true)}>Uredi</button>
        <button
          className="text-red-600 underline"
          onClick={() => start(async () => setMsg(await deleteReview(tutorId)))}
          disabled={pending}
        >
          Obriši
        </button>
        {msg && <span className="text-slate-600">{msg.ok ?? msg.error}</span>}
      </div>
    );

  return (
    <form
      className="space-y-2 rounded-xl bg-slate-50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await submitReview(tutorId, rating, body);
          setMsg(res);
          if (res.ok) setOpen(false);
        });
      }}
    >
      <p className="text-sm font-semibold">{existing ? "Uredite recenziju" : "Ostavite recenziju"}</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Ocjena">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} od 5`}
            onClick={() => setRating(n)}
            className={`text-3xl leading-none ${n <= rating ? "text-gold-500" : "text-slate-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="input min-h-20"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        placeholder="Kako je prošlo? (neobavezno)"
      />
      {msg?.error && <p className="text-sm text-red-600">{msg.error}</p>}
      <button className="btn-primary btn-sm" disabled={pending || rating === 0}>
        {pending ? "Spremam…" : "Objavi recenziju"}
      </button>
    </form>
  );
}

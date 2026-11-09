"use client";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions/social";

export function FavoriteButton({ tutorId, initial }: { tutorId: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={pending}
      className={`btn-sm inline-flex items-center gap-1 rounded-lg text-sm font-semibold ${on ? "text-rose-600" : "text-slate-600"}`}
      onClick={() =>
        start(async () => {
          const next = !on;
          setOn(next);
          const res = await toggleFavorite(tutorId, next);
          if (res.error) setOn(!next);
        })
      }
    >
      <Heart className={`size-4 ${on ? "fill-current" : ""}`} aria-hidden />
      {on ? "U favoritima" : "Spremi u favorite"}
    </button>
  );
}

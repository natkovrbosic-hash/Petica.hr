import Link from "next/link";
import { CalendarClock, MapPin, Zap } from "lucide-react";
import type { SearchResult } from "@/lib/types";
import { levelsSummary, modeName } from "@/lib/subjects";
import { relativeSlot } from "@/lib/time";
import { Avatar, FeaturedBadge, Stars, SubjectChips, TestBadge, formatEur } from "./ui";

export function TutorCard({ t }: { t: SearchResult }) {
  return (
    <Link
      href={`/instruktor/${t.slug}`}
      className={`card flex flex-col gap-3 p-4 transition hover:border-brand-300 ${t.is_featured ? "border-2 border-gold-400 hover:border-gold-500" : ""}`}
    >
      <div className="flex items-center gap-3">
        <Avatar name={t.display_name} src={t.photo_url} size={56} round />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-sans text-[17px] font-bold">{t.display_name}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-slate-600">
            <Stars value={t.rating_avg} count={t.rating_count} />
          </div>
        </div>
        <span className="shrink-0 rounded-xl bg-paper px-2.5 py-1.5 text-right font-display text-lg font-extrabold">
          {formatEur(t.price_eur)}
          <span className="block font-sans text-[11px] font-medium text-slate-600">po satu</span>
        </span>
      </div>
      {t.headline && <p className="line-clamp-2 text-[15px] leading-snug text-slate-700">{t.headline}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        {t.is_hitno && (
          <span className="inline-flex items-center gap-1 rounded-full bg-board px-2.5 py-1 text-xs font-bold text-gold-400">
            <Zap className="size-3 fill-current" aria-hidden /> Slobodan sada
          </span>
        )}
        {t.is_featured && <FeaturedBadge />}
        {t.is_test && <TestBadge />}
        <SubjectChips subjects={t.subjects} max={3} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[13px] text-slate-600">
        <span className="flex min-w-0 items-center gap-1">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {t.city ?? "—"}
            {t.distance_km != null && t.distance_km > 0 ? ` · ${String(t.distance_km).replace(".", ",")} km` : ""} ·{" "}
            {t.modes.map((m) => modeName(m, true)).join(", ")}
            {t.levels.length > 0 && ` · ${levelsSummary(t.levels)}`}
          </span>
        </span>
        {t.next_slot && (
          <span className="flex items-center gap-1 font-semibold text-brand-600">
            <CalendarClock className="size-3.5" aria-hidden /> {relativeSlot(t.next_slot)}
          </span>
        )}
      </div>
    </Link>
  );
}

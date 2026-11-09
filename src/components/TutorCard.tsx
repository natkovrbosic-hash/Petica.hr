import Link from "next/link";
import { Zap } from "lucide-react";
import type { SearchResult } from "@/lib/types";
import { levelsSummary, modeName, subjectName } from "@/lib/subjects";
import { relativeSlot } from "@/lib/time";
import { Avatar, FeaturedBadge, Stars, TestBadge, formatEur } from "./ui";

export function TutorCard({ t }: { t: SearchResult }) {
  const place = [
    t.city,
    t.distance_km != null && t.distance_km > 0 ? `${String(t.distance_km).replace(".", ",")} km` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <Link
      href={`/instruktor/${t.slug}`}
      className={`card group flex gap-3.5 p-4 hover:border-slate-400 ${t.is_featured ? "border-gold-500" : ""}`}
    >
      <Avatar name={t.display_name} src={t.photo_url} size={60} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[17px] leading-snug group-hover:underline group-hover:underline-offset-[3px]">{t.display_name}</h3>
            <p className="text-[14px] text-slate-600">{t.subjects.map(subjectName).slice(0, 3).join(", ")}</p>
          </div>
          <p className="shrink-0 text-right text-[18px] font-bold">
            {formatEur(t.price_eur)}
            <span className="block text-[13px] font-normal text-slate-600">po satu</span>
          </p>
        </div>
        {t.headline && <p className="mt-1.5 line-clamp-2 text-[15px] leading-snug">{t.headline}</p>}
        <div className="mt-2 text-[14px]">
          <Stars value={t.rating_avg} count={t.rating_count} />
        </div>
        <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-[14px]">
          <dt className="text-slate-600">Mjesto</dt>
          <dd className="truncate">{place || "—"}</dd>
          <dt className="text-slate-600">Način</dt>
          <dd className="truncate">{t.modes.map((m) => modeName(m, true)).join(", ")}</dd>
          {t.levels.length > 0 && (
            <>
              <dt className="text-slate-600">Razine</dt>
              <dd className="truncate">{levelsSummary(t.levels)}</dd>
            </>
          )}
          {t.next_slot && (
            <>
              <dt className="text-slate-600">Prvi termin</dt>
              <dd className="font-bold">{relativeSlot(t.next_slot)}</dd>
            </>
          )}
        </dl>
        {(t.is_hitno || t.is_featured || t.is_test) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {t.is_hitno && (
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-board px-1.5 py-0.5 text-[13px] font-bold text-chalk">
                <Zap className="size-3 fill-gold-400 text-gold-400" aria-hidden /> Dostupno odmah
              </span>
            )}
            {t.is_featured && <FeaturedBadge />}
            {t.is_test && <TestBadge />}
          </div>
        )}
      </div>
    </Link>
  );
}

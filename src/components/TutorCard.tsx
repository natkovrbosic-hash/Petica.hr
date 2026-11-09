import Link from "next/link";
import type { SearchResult } from "@/lib/types";
import { levelsSummary, modeName } from "@/lib/subjects";
import { Avatar, FeaturedBadge, Stars, SubjectChips, TestBadge, formatEur } from "./ui";

export function TutorCard({ t }: { t: SearchResult }) {
  return (
    <Link
      href={`/instruktor/${t.slug}`}
      className={`card block p-4 transition hover:border-brand-300 hover:shadow-md ${t.is_featured ? "border-gold-400 ring-1 ring-gold-400" : ""}`}
    >
      <div className="flex gap-3">
        <Avatar name={t.display_name} src={t.photo_url} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-base font-bold text-slate-900">{t.display_name}</h3>
            {t.is_featured && <FeaturedBadge />}
            {t.is_test && <TestBadge />}
          </div>
          {t.headline && <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{t.headline}</p>}
          <div className="mt-1">
            <Stars value={t.rating_avg} count={t.rating_count} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold text-slate-900">{formatEur(t.price_eur)}</p>
          <p className="text-xs text-slate-500">po satu</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <SubjectChips subjects={t.subjects} />
        <p className="text-xs text-slate-600">
          📍 {t.city ?? "—"}
          {t.distance_km != null && t.distance_km > 0 ? ` · ${String(t.distance_km).replace(".", ",")} km` : ""} ·{" "}
          {t.modes.map((m) => modeName(m, true)).join(", ")}
          {t.levels.length > 0 && ` · ${levelsSummary(t.levels)}`}
        </p>
      </div>
    </Link>
  );
}

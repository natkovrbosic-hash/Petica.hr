import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { SUBJECTS } from "@/lib/subjects";
import { MAJOR_CITIES, citySlug } from "@/lib/cities";
import { subjectCityCounts } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/priprema-za-maturu`, lastModified: now, priority: 0.9 },
    { url: `${SITE_URL}/instrukcije`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/za-instruktore`, lastModified: now, priority: 0.5 },
    ...SUBJECTS.map((s) => ({ url: `${SITE_URL}/instrukcije/${s.slug}`, lastModified: now, priority: 0.8 })),
  ];

  // predmet + grad: svi veći gradovi + svaka kombinacija u kojoj postoji instruktor
  const combos = new Set<string>();
  for (const s of SUBJECTS) for (const c of MAJOR_CITIES) combos.add(`${s.slug}/${citySlug(c)}`);
  for (const r of await subjectCityCounts()) combos.add(`${r.subject}/${citySlug(r.city)}`);
  for (const path of combos) urls.push({ url: `${SITE_URL}/instrukcije/${path}`, lastModified: now, priority: 0.7 });

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { data } = await createPublicClient().from("tutors").select("slug, updated_at").eq("status", "odobren").eq("is_test", false);
    for (const t of data ?? []) urls.push({ url: `${SITE_URL}/instruktor/${t.slug}`, lastModified: new Date(t.updated_at), priority: 0.6 });
  }
  return urls;
}

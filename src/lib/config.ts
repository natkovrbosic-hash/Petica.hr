// Postavke platforme iz okoline (.env). Sve se može mijenjati bez promjene koda.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "Instrukcije24.hr";
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "podrska@instrukcije24.hr";

/** Cijena „Istaknutog profila” u €/mj (prikaz + cijena u Stripe Checkoutu kad STRIPE_PRICE_ID nije zadan). 5–9 €. */
export const FEATURED_PRICE_EUR = Math.min(9, Math.max(5, Number(process.env.NEXT_PUBLIC_FEATURED_PRICE_EUR || 7)));

/**
 * Feature flag: „Prva 3 mjeseca od lansiranja sve besplatno”.
 * NEXT_PUBLIC_LAUNCH_PROMO=true uključuje promociju, NEXT_PUBLIC_LAUNCH_DATE je datum lansiranja,
 * NEXT_PUBLIC_LAUNCH_PROMO_MONTHS trajanje (zadano 3). Dok traje, instruktor istaknuti profil uključuje bez plaćanja.
 */
export function launchPromo(now = new Date()) {
  const enabled = process.env.NEXT_PUBLIC_LAUNCH_PROMO === "true";
  const start = new Date(process.env.NEXT_PUBLIC_LAUNCH_DATE || "2026-12-01");
  const months = Number(process.env.NEXT_PUBLIC_LAUNCH_PROMO_MONTHS || 3);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return { active: enabled && now < end, until: end };
}

export const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);

/** Podaci o vlasniku platforme za pravne stranice. */
export const COMPANY = {
  name: process.env.COMPANY_NAME || "",
  oib: process.env.COMPANY_OIB || "",
  address: process.env.COMPANY_ADDRESS || "",
};

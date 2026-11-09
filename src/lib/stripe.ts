import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "./supabase/admin";

let client: Stripe | null = null;

/** null kad STRIPE_SECRET_KEY nije postavljen → pretplata radi u testnom (simuliranom) načinu, kao u Cehovi.hr */
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

const ACTIVE = new Set(["active", "trialing", "past_due"]);

/** Kraj tekućeg razdoblja: od API verzije 2025 nalazi se na stavkama pretplate. */
function periodEnd(sub: Stripe.Subscription) {
  const fromItems = sub.items?.data?.map((i) => i.current_period_end).filter(Boolean) ?? [];
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const ts = fromItems.length ? Math.max(...fromItems) : legacy;
  return ts ? new Date(ts * 1000) : null;
}

/** Spremi stanje Stripe pretplate i uskladi istaknutost profila. Poziva ga samo webhook. */
export async function syncSubscription(sub: Stripe.Subscription, tutorIdHint?: string | null) {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let tutorId = tutorIdHint || sub.metadata?.tutor_id || null;
  if (!tutorId) {
    const { data } = await admin.from("subscriptions").select("tutor_id").eq("stripe_customer_id", customerId).maybeSingle();
    tutorId = data?.tutor_id ?? null;
  }
  if (!tutorId) {
    console.error("[stripe] pretplata bez instruktora", sub.id);
    return;
  }
  const end = periodEnd(sub);
  const active = ACTIVE.has(sub.status);
  await admin.from("subscriptions").upsert({
    tutor_id: tutorId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: sub.items?.data?.[0]?.price?.id ?? null,
    current_period_end: end?.toISOString() ?? null,
    cancel_at_period_end: sub.cancel_at_period_end,
    source: "stripe",
    updated_at: new Date().toISOString(),
  });
  // Istaknutost traje do kraja plaćenog razdoblja. Otkaz „na kraju razdoblja” Stripe javlja kao deleted tek kad
  // razdoblje istekne, pa se tada istaknutost i gasi.
  await admin.from("tutors").update({ featured_until: active ? end?.toISOString() ?? null : null }).eq("id", tutorId);
}

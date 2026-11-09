import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { FEATURED_PRICE_EUR, SITE_URL, launchPromo } from "@/lib/config";

// Pokreće Stripe Checkout za „Istaknuti profil”. Bez Stripe ključa simulira pretplatu (testni način).
export async function POST(request: NextRequest) {
  const back = (q: string) => NextResponse.redirect(new URL(`/moj-profil?${q}#istaknuto`, request.url), 303);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL("/prijava?next=/moj-profil", request.url), 303);
  const { data: tutor } = await supabase.from("tutors").select("id, status, display_name").eq("id", auth.user.id).maybeSingle();
  if (!tutor) return back("pretplata=greska");
  if (tutor.status !== "odobren") return back("pretplata=neodobren");
  if (launchPromo().active) return back("pretplata=promo");

  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("*").eq("tutor_id", tutor.id).maybeSingle();
  if (sub?.source === "stripe" && ["active", "trialing", "past_due"].includes(sub.status)) return back("pretplata=vec-aktivna");

  const stripe = getStripe();
  if (!stripe) {
    // TESTNI NAČIN: nema Stripe ključa — pretplata se simulira na mjesec dana
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    await admin.from("subscriptions").upsert({
      tutor_id: tutor.id,
      status: "active",
      source: "test",
      current_period_end: end.toISOString(),
      updated_at: new Date().toISOString(),
    });
    await admin.from("tutors").update({ featured_until: end.toISOString() }).eq("id", tutor.id);
    return back("pretplata=test");
  }

  let customerId = sub?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: auth.user.email,
      name: tutor.display_name,
      metadata: { tutor_id: tutor.id },
    });
    customerId = customer.id;
    await admin.from("subscriptions").upsert({ tutor_id: tutor.id, stripe_customer_id: customerId, status: "incomplete", source: "stripe" });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: tutor.id,
    locale: "hr",
    // Načine plaćanja (kartice, Apple Pay / Google Pay, PayPal…) uključite u Stripe Dashboardu → Payment methods.
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(FEATURED_PRICE_EUR * 100),
              recurring: { interval: "month" },
              product_data: { name: "Istaknuti profil — Instrukcije24.hr" },
            },
          },
    ],
    subscription_data: { metadata: { tutor_id: tutor.id } },
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/moj-profil?pretplata=uspjeh#istaknuto`,
    cancel_url: `${SITE_URL}/moj-profil?pretplata=odustao#istaknuto`,
  });
  return NextResponse.redirect(session.url!, 303);
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/config";

// Stripe Customer Portal: kartica, računi, otkaz pretplate
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL("/prijava?next=/moj-profil", request.url), 303);
  const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("tutor_id", auth.user.id).maybeSingle();
  const stripe = getStripe();
  if (!stripe || !sub?.stripe_customer_id)
    return NextResponse.redirect(new URL("/moj-profil?pretplata=greska#istaknuto", request.url), 303);
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${SITE_URL}/moj-profil#istaknuto`,
    locale: "hr",
  });
  return NextResponse.redirect(session.url, 303);
}

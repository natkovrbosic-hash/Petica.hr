import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Klijent sa servisnim ključem — ZAOBILAZI RLS. Koristiti samo na serveru, nakon vlastite provjere ovlasti
 * (Stripe webhook, brisanje računa, aktivacija promo istaknutosti, admin dohvat emailova).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY nije postavljen.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

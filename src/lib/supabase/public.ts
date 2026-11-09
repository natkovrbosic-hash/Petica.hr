import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Anonimni klijent bez kolačića — za javne, keširane (ISR) stranice: SEO stranice, sitemap. */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { AUTH_COOKIE } from "./cookie";
import { cookies } from "next/headers";

/** Supabase klijent s prijavom trenutnog korisnika (poštuje RLS). Novi klijent za svaki zahtjev. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { name: AUTH_COOKIE },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Pozvano iz Server Componenta — sesiju osvježava proxy.ts
        }
      },
    },
  });
}

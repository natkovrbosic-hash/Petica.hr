"use client";
import { createBrowserClient } from "@supabase/ssr";
import { AUTH_COOKIE } from "./cookie";

/**
 * Kad je NEXT_PUBLIC_SUPABASE_PROXY=1, preglednik Supabaseu pristupa preko iste adrese kao aplikacija
 * (/sb → Supabase, vidi next.config.ts). Korisno kad baza nije izravno dostupna iz preglednika
 * (npr. pregled iz razvojnog okruženja).
 */
function browserUrl() {
  if (process.env.NEXT_PUBLIC_SUPABASE_PROXY === "1" && typeof window !== "undefined") return `${window.location.origin}/sb`;
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

export function createClient() {
  return createBrowserClient(browserUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { name: AUTH_COOKIE },
  });
}

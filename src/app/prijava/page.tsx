import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Prijava", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; greska?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">Prijava</h1>
      <p className="mt-1 text-sm text-slate-600">
        Nemate račun? <Link className="link" href={`/registracija${sp.next ? `?next=${encodeURIComponent(sp.next)}` : ""}`}>Registrirajte se</Link>
      </p>
      {sp.greska && (
        <div className="mt-4">
          <Notice kind="warn">Poveznica je istekla ili je već iskorištena. Prijavite se ili zatražite novu.</Notice>
        </div>
      )}
      <div className="card mt-6 p-5">
        <LoginForm next={sp.next ?? "/"} />
      </div>
    </div>
  );
}

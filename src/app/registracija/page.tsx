import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Registracija" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ uloga?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">Registracija</h1>
      <p className="mt-1 text-sm text-slate-600">
        Već imate račun? <Link className="link" href="/prijava">Prijavite se</Link>
      </p>
      <div className="card mt-6 p-5">
        <SignupForm initialRole={sp.uloga === "instruktor" ? "instruktor" : "korisnik"} next={sp.next ?? "/"} />
      </div>
    </div>
  );
}

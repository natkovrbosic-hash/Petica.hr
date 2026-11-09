"use client";
import Link from "next/link";
import { useState } from "react";
import { signUp } from "../actions/auth";
import { FormMessage, SubmitButton, useFormAction } from "@/components/forms";

export function SignupForm({ initialRole, next }: { initialRole: "korisnik" | "instruktor"; next: string }) {
  const { state, onSubmit, pending } = useFormAction(signUp);
  const [role, setRole] = useState(initialRole);
  const today = new Date().toISOString().slice(0, 10);

  if (state?.ok) return <FormMessage state={state} />;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <fieldset>
        <legend className="label">Registriram se kao</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["korisnik", "Roditelj / učenik", "Tražim instruktora"],
              ["instruktor", "Instruktor", "Držim instrukcije"],
            ] as const
          ).map(([id, title, sub]) => (
            <label
              key={id}
              className={`cursor-pointer rounded-xl border p-3 text-sm ${role === id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200" : "border-slate-300"}`}
            >
              <input type="radio" name="role" value={id} checked={role === id} onChange={() => setRole(id)} className="sr-only" />
              <span className="block font-bold">{title}</span>
              <span className="text-slate-600">{sub}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="full_name">Ime i prezime</label>
        <input className="input" id="full_name" name="full_name" autoComplete="name" required minLength={2} maxLength={80} />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Lozinka (najmanje 8 znakova)</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <label className="label" htmlFor="birth_date">Datum rođenja</label>
        <input className="input" id="birth_date" name="birth_date" type="date" max={today} required />
        <p className="mt-1 text-xs text-slate-500">Ne prikazuje se javno. Služi samo za provjeru dobi.</p>
      </div>
      {role === "instruktor" ? (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="adult" required className="mt-0.5 size-4" />
          <span>Potvrđujem da imam najmanje 18 godina.</span>
        </label>
      ) : (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="age_ok" required className="mt-0.5 size-4" />
          <span>Potvrđujem da sam roditelj/skrbnik ili učenik s najmanje 16 godina.</span>
        </label>
      )}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="terms" required className="mt-0.5 size-4" />
        <span>
          Prihvaćam <Link className="link" href="/uvjeti" target="_blank">Uvjete korištenja</Link> i potvrđujem da sam
          pročitao/la <Link className="link" href="/privatnost" target="_blank">Politiku privatnosti</Link>.
        </span>
      </label>
      {role === "instruktor" && (
        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          Kao instruktor sami ste odgovorni za svoje porezne i druge zakonske obveze. Petica.hr samo prodaje oglasni
          prostor i ne sudjeluje u plaćanju instrukcija.
        </p>
      )}
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Registriram…">Registracija</SubmitButton>
    </form>
  );
}

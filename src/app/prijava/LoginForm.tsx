"use client";
import Link from "next/link";
import { signIn } from "../actions/auth";
import { FormMessage, SubmitButton, useFormAction } from "@/components/forms";

export function LoginForm({ next }: { next: string }) {
  const { state, onSubmit, pending } = useFormAction(signIn);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Lozinka</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Prijavljujem…">Prijava</SubmitButton>
      <p className="text-center text-sm">
        <Link className="link" href="/zaboravljena-lozinka">Zaboravljena lozinka?</Link>
      </p>
    </form>
  );
}

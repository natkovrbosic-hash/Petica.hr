"use client";
import { updatePassword } from "../actions/auth";
import { FormMessage, SubmitButton, useFormAction } from "@/components/forms";

export default function NewPasswordPage() {
  const { state, onSubmit, pending } = useFormAction(updatePassword);
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-extrabold">Nova lozinka</h1>
      <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-5">
        <div>
          <label className="label" htmlFor="password">Nova lozinka (najmanje 8 znakova)</label>
          <input className="input" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        </div>
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Spremi lozinku</SubmitButton>
      </form>
    </div>
  );
}

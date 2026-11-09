"use client";
import { requestPasswordReset } from "../actions/auth";
import { FormMessage, SubmitButton, useFormAction } from "@/components/forms";

export default function ForgotPasswordPage() {
  const { state, onSubmit, pending } = useFormAction(requestPasswordReset);
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">Zaboravljena lozinka</h1>
      <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-5">
        <div>
          <label className="label" htmlFor="email">Email računa</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Pošalji poveznicu</SubmitButton>
      </form>
    </div>
  );
}

"use client";
import { startTransition, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Notice } from "./ui";

export function SubmitButton({ children, className = "btn-primary w-full", pendingText = "Šaljem…", pending: pendingProp }: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: { error?: string; ok?: string } | null }) {
  if (!state) return null;
  if (state.error) return <Notice kind="error">{state.error}</Notice>;
  if (state.ok) return <Notice kind="ok">{state.ok}</Notice>;
  return null;
}

type State = { error?: string; ok?: string } | null;

/**
 * Kao useActionState, ali obrazac se NE prazni nakon slanja (React 19 resetira obrasce poslane preko `action`,
 * pa bi korisnik nakon greške izgubio sve upisano). Uključuje i gumb kojim je obrazac poslan (name/value).
 */
export function useFormAction(fn: (prev: State, form: FormData) => Promise<State>) {
  const [state, dispatch, pending] = useActionState(fn, null);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(data));
  };
  return { state, onSubmit, pending };
}

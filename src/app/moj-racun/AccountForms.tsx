"use client";
import { deleteAccount, updateAccount } from "../actions/account";
import { FormMessage, SubmitButton, useFormAction } from "@/components/forms";

export function AccountForm({ fullName, emailNotifications }: { fullName: string; emailNotifications: boolean }) {
  const { state, onSubmit, pending } = useFormAction(updateAccount);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="full_name">Ime i prezime</label>
        <input className="input" id="full_name" name="full_name" defaultValue={fullName} required maxLength={80} />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="email_notifications" defaultChecked={emailNotifications} className="mt-0.5 size-4" />
        <span>Email obavijesti (nove poruke, recenzije, odobrenje profila)</span>
      </label>
      <p className="text-xs text-slate-500">SMS obavijesti uskoro.</p>
      <FormMessage state={state} />
      <SubmitButton pending={pending} className="btn-primary">Spremi</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm() {
  const { state, onSubmit, pending } = useFormAction(deleteAccount);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-slate-600">
        Trajno brišemo račun, profil, poruke, recenzije i favorite. Aktivna pretplata se otkazuje. Ova radnja se ne može
        poništiti.
      </p>
      <label className="label" htmlFor="confirm">Za potvrdu upišite OBRIŠI</label>
      <input className="input" id="confirm" name="confirm" autoComplete="off" />
      <FormMessage state={state} />
      <SubmitButton pending={pending} className="btn-danger" pendingText="Brišem…">Trajno obriši račun</SubmitButton>
    </form>
  );
}

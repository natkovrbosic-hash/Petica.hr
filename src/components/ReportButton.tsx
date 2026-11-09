"use client";
import { useState, useTransition } from "react";
import { submitReport } from "@/app/actions/social";

export function ReportButton({
  targetType,
  targetId,
  compact = false,
}: {
  targetType: "recenzija" | "profil" | "poruka";
  targetId: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (msg) return <span className="text-xs text-slate-500">{msg}</span>;
  if (!open)
    return (
      <button type="button" className={`text-slate-500 underline ${compact ? "text-xs" : "text-sm"}`} onClick={() => setOpen(true)}>
        Prijavi
      </button>
    );
  return (
    <form
      className="mt-2 w-full space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await submitReport(targetType, targetId, reason);
          setMsg(res.ok ?? res.error ?? null);
        });
      }}
    >
      <textarea
        className="input min-h-16 text-sm"
        placeholder="Zašto prijavljujete? (npr. uvredljivo, lažno, spam)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={1000}
        required
      />
      <div className="flex gap-2">
        <button className="btn-danger btn-sm" disabled={pending}>Pošalji prijavu</button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(false)}>Odustani</button>
      </div>
    </form>
  );
}

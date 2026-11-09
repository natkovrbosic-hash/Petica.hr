"use client";
import { useState, useTransition } from "react";
import { cancelBooking } from "../actions/bookings";

export function CancelButton({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (msg) return <span className="text-sm text-slate-600">{msg}</span>;
  if (!open)
    return (
      <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(true)}>
        Otkaži
      </button>
    );
  return (
    <div className="mt-2 w-full space-y-2">
      <input
        className="input text-sm"
        placeholder="Razlog (neobavezno, druga strana ga vidi)"
        value={reason}
        maxLength={300}
        onChange={(e) => setReason(e.target.value)}
        aria-label="Razlog otkazivanja"
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-danger btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await cancelBooking(bookingId, reason);
              setMsg(res.ok ?? res.error ?? null);
            })
          }
        >
          {pending ? "Otkazujem…" : "Potvrdi otkazivanje"}
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(false)}>
          Natrag
        </button>
      </div>
    </div>
  );
}

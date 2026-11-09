"use client";
import { useState, useTransition } from "react";
import {
  deleteReviewAdmin,
  resolveReport,
  setFeaturedManually,
  setReviewStatus,
  setTutorStatus,
} from "../actions/admin";

type Res = { ok?: string; error?: string };

function useAct() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Res | null>(null);
  const run = (fn: () => Promise<Res>) => start(async () => setMsg(await fn()));
  const out = msg ? <span className={`text-xs ${msg.error ? "text-red-600" : "text-emerald-700"}`}>{msg.error ?? msg.ok}</span> : null;
  return { pending, run, out };
}

export function TutorModeration({ tutorId, status }: { tutorId: string; status: string }) {
  const { pending, run, out } = useAct();
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "odobren" && (
        <button className="btn-primary btn-sm" disabled={pending} onClick={() => run(() => setTutorStatus(tutorId, "odobren"))}>
          Odobri
        </button>
      )}
      {status === "odobren" && (
        <button className="btn-secondary btn-sm" disabled={pending} onClick={() => run(() => setTutorStatus(tutorId, "na_cekanju"))}>
          Skini iz pretrage
        </button>
      )}
      {!rejecting ? (
        <button className="btn-secondary btn-sm text-red-700" disabled={pending} onClick={() => setRejecting(true)}>
          Odbij
        </button>
      ) : (
        <span className="flex w-full flex-col gap-2 sm:flex-row">
          <input className="input py-1.5 text-sm" placeholder="Razlog (instruktor ga dobiva emailom)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="btn-danger btn-sm" disabled={pending} onClick={() => run(() => setTutorStatus(tutorId, "odbijen", reason))}>
            Potvrdi odbijanje
          </button>
        </span>
      )}
      {out}
    </div>
  );
}

export function FeatureToggle({ tutorId, featured }: { tutorId: string; featured: boolean }) {
  const { pending, run, out } = useAct();
  return (
    <span className="inline-flex items-center gap-2">
      {featured ? (
        <button className="text-xs underline" disabled={pending} onClick={() => run(() => setFeaturedManually(tutorId, 0))}>Ukloni istaknutost</button>
      ) : (
        <button className="text-xs underline" disabled={pending} onClick={() => run(() => setFeaturedManually(tutorId, 30))}>Istakni 30 dana (ručno)</button>
      )}
      {out}
    </span>
  );
}

export function ReviewModeration({ reviewId, status }: { reviewId: string; status: string }) {
  const { pending, run, out } = useAct();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "objavljena" ? (
        <button className="btn-secondary btn-sm" disabled={pending} onClick={() => run(() => setReviewStatus(reviewId, "skrivena"))}>Sakrij</button>
      ) : (
        <button className="btn-secondary btn-sm" disabled={pending} onClick={() => run(() => setReviewStatus(reviewId, "objavljena"))}>Objavi</button>
      )}
      <button
        className="btn-sm text-sm text-red-700 underline"
        disabled={pending}
        onClick={() => confirm("Trajno obrisati recenziju?") && run(() => deleteReviewAdmin(reviewId))}
      >
        Obriši
      </button>
      {out}
    </div>
  );
}

export function ReportResolution({ reportId }: { reportId: string }) {
  const { pending, run, out } = useAct();
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input className="input py-1.5 text-sm" placeholder="Bilješka (neobavezno)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn-primary btn-sm" disabled={pending} onClick={() => run(() => resolveReport(reportId, "rijesena", note))}>Riješeno</button>
      <button className="btn-secondary btn-sm" disabled={pending} onClick={() => run(() => resolveReport(reportId, "odbacena", note))}>Odbaci</button>
      {out}
    </div>
  );
}

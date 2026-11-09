"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-xl font-bold">Došlo je do pogreške</h1>
      <p className="mt-2 text-slate-600">Zahtjev nije moguće obraditi. Pokušajte ponovno za nekoliko trenutaka.</p>
      <button className="btn-primary mt-6" onClick={reset}>Pokušaj ponovno</button>
    </div>
  );
}

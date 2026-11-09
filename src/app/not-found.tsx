import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-2 text-xl font-bold">Stranica nije pronađena</h1>
      <p className="mt-2 text-slate-600">Možda je instruktor uklonio profil ili je poveznica neispravna.</p>
      <Link href="/pretraga" className="btn-primary mt-6">Pretraži instruktore</Link>
    </div>
  );
}

import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Petica.hr — početna">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-lg font-extrabold text-gold-400">5</span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Petica<span className="text-brand-600">.hr</span>
      </span>
    </Link>
  );
}

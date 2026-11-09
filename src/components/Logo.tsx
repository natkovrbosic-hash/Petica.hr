import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Petica.hr — početna">
      <span className="grid size-8 place-items-center rounded-[9px] bg-gold-400 font-display text-lg font-extrabold text-board">5</span>
      <span className="font-display text-[21px] font-extrabold tracking-tight text-chalk">Petica</span>
    </Link>
  );
}

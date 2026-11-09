import Link from "next/link";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm font-semibold text-slate-700 sm:gap-2">
          <Link href="/pretraga" className="rounded-lg px-2.5 py-2 hover:bg-slate-100">
            Pretraga
          </Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}

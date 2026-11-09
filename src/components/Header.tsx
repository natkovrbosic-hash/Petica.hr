import Link from "next/link";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-board text-chalk">
      <div className="mx-auto flex h-15 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
          <Link href="/pretraga" className="hidden rounded-full px-3 py-2 hover:bg-white/10 sm:block">
            Pretraga
          </Link>
          <Link href="/pretraga?hitno=1" className="rounded-full px-3 py-2 text-gold-400 hover:bg-white/10">
            Hitno
          </Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}

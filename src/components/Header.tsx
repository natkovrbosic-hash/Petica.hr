import Link from "next/link";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-board text-chalk">
      <div className="mx-auto flex h-15 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <nav className="flex items-center gap-0.5 text-[15px] font-bold sm:gap-1">
          <Link href="/pretraga" className="hidden rounded-md px-2 py-2 hover:bg-white/10 sm:px-3 sm:block">
            Pretraga
          </Link>
          <Link href="/pretraga?hitno=1" className="rounded-md px-2 py-2 hover:bg-white/10 sm:px-3">
            Hitno
          </Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}

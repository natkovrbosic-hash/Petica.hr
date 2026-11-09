import Link from "next/link";

/** Ocjena „5” zaokružena crvenom olovkom, na listu papira — kao u bilježnici. */
export function GradeMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <rect x="1" y="1" width="32" height="32" rx="4" fill="#ffffff" />
      <text x="17" y="24.5" textAnchor="middle" fontFamily="inherit" fontWeight="700" fontSize="20" fill="#c23b2e">
        5
      </text>
      <path
        d="M9.2 9.6c3.6-3.4 11.6-3.6 15.4.4 3.3 3.5 2.6 10.6-1.6 13.6-4.1 2.9-11 2.6-14.1-1.1-2.7-3.3-2.5-8.6.9-11.9l1.6-1.2"
        fill="none"
        stroke="#c23b2e"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-md" aria-label="Instrukcije24.hr, početna stranica">
      <GradeMark size={30} />
      <span className="text-[17px] font-bold tracking-tight text-chalk sm:text-[20px]">Instrukcije24</span>
    </Link>
  );
}

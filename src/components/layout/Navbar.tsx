import Link from "next/link";
import SearchBar from "@/src/components/shared/SearchBar";

type NavbarProps = {
  totalTools: number;
};

export default function Navbar({ totalTools }: NavbarProps) {
  return (
    <header className="sticky top-3 z-20 rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_oklab,var(--background)_80%,transparent)] px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-[color:color-mix(in_oklab,var(--background)_65%,transparent)]">
      <div className="grid items-center gap-3 lg:grid-cols-[1fr_minmax(320px,420px)_1fr]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--text-primary)] text-xs font-semibold tracking-wide text-[var(--background)]"
          >
            I0
          </Link>
          <div>
            <p className="text-sm font-semibold tracking-tight">img0.xyz</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Minimalist Image Studio
            </p>
          </div>
        </div>

        <SearchBar className="hidden lg:block" />

        <div className="flex items-center justify-end gap-2">
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            {totalTools} tools planned
          </span>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            100% client-side
          </span>
        </div>
      </div>
    </header>
  );
}


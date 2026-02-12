"use client";

import ThemeToggle from "@/components/layout/ThemeToggle";

function GlobeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h11v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
      <path d="M15 11h2a2 2 0 1 1 0 4h-2" />
      <path d="M6 4v2" />
      <path d="M10 4v2" />
      <path d="M14 4v2" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M12 2A10 10 0 0 0 8.84 21.5c.5.08.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.2-3.37-1.2-.46-1.15-1.12-1.46-1.12-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.84.09-.66.35-1.1.64-1.35-2.22-.25-4.55-1.1-4.55-4.93 0-1.09.39-1.98 1.03-2.67-.11-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.69 1.03 1.58 1.03 2.67 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86l-.01 2.75c0 .27.18.57.69.47A10 10 0 0 0 12 2z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

const linkClassName =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--text-primary)]";

type LandingHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
};

export default function LandingHeader({
  searchValue,
  onSearchChange,
}: LandingHeaderProps) {
  return (
    <header className="sticky top-3 z-20">
      <div className="rounded-xl border border-[var(--border)] bg-[color:color-mix(in_oklab,var(--background)_90%,transparent)] px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-[color:color-mix(in_oklab,var(--background)_78%,transparent)]">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--text-primary)] text-xs font-semibold tracking-wide text-[var(--background)]">
              I0
            </span>
            <span className="text-sm font-semibold tracking-tight">img0.xyz</span>
            <div className="min-w-0 flex-1 sm:flex-none sm:w-[260px] md:w-[320px]">
              <label htmlFor="landing-tool-search" className="sr-only">
                Search tools
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2.5 inline-flex items-center text-[var(--text-secondary)]">
                  <SearchIcon />
                </span>
                <input
                  id="landing-tool-search"
                  type="text"
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search tools..."
                  className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-8 pr-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:justify-self-end">
            <ThemeToggle />
            <a
              href="https://moayaan.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit website"
              className={linkClassName}
            >
              <GlobeIcon />
            </a>
            <a
              href="https://moayaan.com/donate"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Donate"
              className={linkClassName}
            >
              <CoffeeIcon />
            </a>
            <a
              href="https://github.com/moayaan1911/img0"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className={linkClassName}
            >
              <GitHubIcon />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

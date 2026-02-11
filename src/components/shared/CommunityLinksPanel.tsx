"use client";

import { useEffect, useState } from "react";

function GlobeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
      fill="currentColor"
    >
      <path d="M12 2A10 10 0 0 0 8.84 21.5c.5.08.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.2-3.37-1.2-.46-1.15-1.12-1.46-1.12-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.84.09-.66.35-1.1.64-1.35-2.22-.25-4.55-1.1-4.55-4.93 0-1.09.39-1.98 1.03-2.67-.11-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.69 1.03 1.58 1.03 2.67 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86l-.01 2.75c0 .27.18.57.69.47A10 10 0 0 0 12 2z" />
    </svg>
  );
}

const cardClassName =
  "flex w-full items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-left transition hover:bg-[var(--surface-strong)]";

export default function CommunityLinksPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [isModalOpen]);

  return (
    <>
      <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 sm:w-[320px]">
        <a
          href="https://moayaan.com"
          target="_blank"
          rel="noopener noreferrer"
          className={cardClassName}
        >
          <span className="mt-0.5 text-[var(--text-primary)]">
            <GlobeIcon />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[var(--text-primary)]">
              Connect with Dev
            </span>
            <span className="block text-xs text-[var(--text-secondary)]">
              Visit moayaan.com
            </span>
          </span>
        </a>

        <a
          href="https://moayaan.com/donate"
          target="_blank"
          rel="noopener noreferrer"
          className={cardClassName}
        >
          <span className="mt-0.5 text-[var(--text-primary)]">
            <CoffeeIcon />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[var(--text-primary)]">
              Donate to Dev
            </span>
            <span className="block text-xs text-[var(--text-secondary)]">
              Support this project
            </span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`${cardClassName} cursor-pointer`}
        >
          <span className="mt-0.5 text-[var(--text-primary)]">
            <GitHubIcon />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[var(--text-primary)]">
              GitHub
            </span>
            <span className="block text-xs text-[var(--text-secondary)]">
              Contribute to the repo
            </span>
          </span>
        </button>
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="github-contribution-title"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="github-contribution-title"
              className="text-xl font-semibold text-[var(--text-primary)]"
            >
              Build this with us
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              img0.xyz is a non-profit open-source community project. If this
              toolset helped you, please contribute a fix, improvement, or a new
              tool so we can ship faster together.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/moayaan1911/img0"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
              >
                Go to GitHub Repo
              </a>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

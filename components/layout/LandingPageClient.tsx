"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import LandingFooter from "@/components/layout/LandingFooter";
import LandingHeader from "@/components/layout/LandingHeader";

type ToolItem = {
  name: string;
  description: string;
  route?: string;
};

type ToolSection = {
  title: string;
  tools: ToolItem[];
};

type LandingPageClientProps = {
  toolSections: ToolSection[];
  trustPills: string[];
};

function matchesSearch(tool: ToolItem, search: string): boolean {
  const haystack = `${tool.name} ${tool.description}`.toLowerCase();
  return haystack.includes(search);
}

export default function LandingPageClient({
  toolSections,
  trustPills,
}: LandingPageClientProps) {
  const [searchValue, setSearchValue] = useState("");
  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!normalizedSearch) {
      return toolSections;
    }

    return toolSections
      .map((section) => {
        const sectionMatch = section.title
          .toLowerCase()
          .includes(normalizedSearch);
        const tools = sectionMatch
          ? section.tools
          : section.tools.filter((tool) =>
              matchesSearch(tool, normalizedSearch),
            );

        return {
          ...section,
          tools,
        };
      })
      .filter((section) => section.tools.length > 0);
  }, [normalizedSearch, toolSections]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-[-260px] -z-10 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--text-primary)_13%,transparent)_0%,transparent_76%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-14 pt-4 sm:px-6 lg:px-8">
        <LandingHeader
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        <main className="space-y-12">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center sm:px-10">
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Minimalist Image Studio in your browser.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
              Edit, optimize, and export images directly in your browser with a
              clean, distraction-free interface.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {trustPills.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            {filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                <h2 className="text-xl font-semibold tracking-tight">
                  No tools found
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Try another keyword for tool name or functionality.
                </p>
              </div>
            ) : null}

            {filteredSections.map((section) => (
              <div
                key={section.title}
                className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {section.title}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {section.tools.map((tool) => (
                    <article
                      key={tool.name}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                        {tool.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {tool.description}
                      </p>
                      {tool.route ? (
                        <Link
                          href={tool.route}
                          className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-strong)]"
                        >
                          Open Tool
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="mt-4 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]"
                        >
                          Coming Soon
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>

        <LandingFooter />
      </div>
    </div>
  );
}

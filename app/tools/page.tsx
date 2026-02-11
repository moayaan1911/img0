import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Footer from "@/src/components/layout/Footer";
import Navbar from "@/src/components/layout/Navbar";
import SearchBar from "@/src/components/shared/SearchBar";
import ToolCard from "@/src/components/shared/ToolCard";
import { TOOLS_REGISTRY } from "@/src/lib/tools-registry";

export const metadata: Metadata = {
  title: "All Tools",
  description:
    "Browse all image tools on img0.xyz.",
};

type ToolsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query);
}

export default async function ToolsIndexPage({ searchParams }: ToolsPageProps) {
  const { q } = await searchParams;
  const queryRaw = Array.isArray(q) ? q[0] ?? "" : q ?? "";
  const query = queryRaw.trim().toLowerCase();
  const visibleTools = query
    ? TOOLS_REGISTRY.filter((tool) =>
        [
          tool.name,
          tool.slug,
          tool.category,
          tool.description,
          tool.route,
        ].some((field) => matchesQuery(field, query)),
      )
    : TOOLS_REGISTRY;

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <Navbar totalTools={TOOLS_REGISTRY.length} />

        <main className="flex flex-col gap-8">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10">
            <p className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              Complete Tools Catalog
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              All image tools in one place.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              Search and open any tool directly.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
            >
              Back to Landing
            </Link>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">
                Explore Tools
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {TOOLS_REGISTRY.length} tools
              </p>
            </div>
            <Suspense
              fallback={
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <p className="text-sm text-[var(--text-secondary)]">Search all tools...</p>
                </div>
              }
            >
              <SearchBar
                id="tools-search-input"
                placeholder="Search all tools..."
                targetPath="/tools"
              />
            </Suspense>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
            {visibleTools.length === 0 ? (
              <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                No tools matched &quot;{queryRaw}&quot;.
              </p>
            ) : null}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

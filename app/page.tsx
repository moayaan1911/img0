import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/src/components/layout/Footer";
import Navbar from "@/src/components/layout/Navbar";
import CommunityLinksPanel from "@/src/components/shared/CommunityLinksPanel";
import ToolCard from "@/src/components/shared/ToolCard";
import { FEATURED_TOOLS, TOOLS_REGISTRY } from "@/src/lib/tools-registry";

export const metadata: Metadata = {
  title: "img0.xyz — Minimalist Image Studio",
  description:
    "Minimalist Image Studio in your browser. Edit, optimize, and export images with zero signup.",
};

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <Navbar totalTools={TOOLS_REGISTRY.length} />

        <main className="flex flex-col gap-10">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-5">
                <p className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  Minimalist Image Studio
                </p>
                <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                  Free image toolkit built for speed, privacy, and clean output.
                </h1>
                <p className="max-w-xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                  Powerful browser-based tools for compression, conversion,
                  editing, and export in one place.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#tools-preview"
                    className="rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
                  >
                    Explore Tools
                  </a>
                  <Link
                    href="/tools"
                    className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                  >
                    Browse All Tools
                  </Link>
                </div>
              </div>

              <CommunityLinksPanel />
            </div>
          </section>

          <section id="tools-preview" className="space-y-4">
            <div className="flex items-end">
              <h2 className="text-2xl font-semibold tracking-tight">
                Tool Spotlight
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {FEATURED_TOOLS.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </div>
  );
}

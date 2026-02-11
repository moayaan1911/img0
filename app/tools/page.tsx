import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/src/components/layout/Footer";
import Navbar from "@/src/components/layout/Navbar";
import ToolCard from "@/src/components/shared/ToolCard";
import { TOOLS_REGISTRY } from "@/src/lib/tools-registry";

export const metadata: Metadata = {
  title: "All Tools",
  description:
    "Browse live and upcoming image tools on img0.xyz.",
};

export default function ToolsIndexPage() {
  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <Navbar totalTools={TOOLS_REGISTRY.length} />

        <main className="flex flex-col gap-8">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10">
            <p className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              Live + Upcoming Tool Routes
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              All planned tools, one clean registry.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              Phase 1 and Phase 2 tools are now live, and remaining tools stay in
              placeholder mode until their implementation phase.
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
                Tools Registry Preview
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {TOOLS_REGISTRY.length} routes • live + planned
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {TOOLS_REGISTRY.map((tool) => (
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

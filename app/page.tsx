import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/src/components/layout/Footer";
import Navbar from "@/src/components/layout/Navbar";
import SearchBar from "@/src/components/shared/SearchBar";
import ToolCard from "@/src/components/shared/ToolCard";
import { FEATURED_TOOLS, TOOLS_REGISTRY } from "@/src/lib/tools-registry";

export const metadata: Metadata = {
  title: "Free Image Toolkit Landing",
  description:
    "Preview the upcoming img0.xyz client-side image studio. Tools are listed in coming-soon mode for UI review.",
};

export default function Home() {
  const stats = [
    ["Tools Planned", `${TOOLS_REGISTRY.length}`],
    ["Backend", "0"],
    ["Signups", "0"],
    ["Payments", "0"],
    ["Image Upload", "No"],
    ["Privacy Score", "A+"],
  ];

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <Navbar totalTools={TOOLS_REGISTRY.length} />

        <main className="flex flex-col gap-10">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-5">
                <p className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  Launch Preview • Landing UI Only
                </p>
                <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                  Free image toolkit built for speed, privacy, and clean output.
                </h1>
                <p className="max-w-xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                  No uploads. No signups. No server-side image processing. Just
                  open the site, edit your file, and download.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#tools-preview"
                    className="rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
                  >
                    Explore Tool Layout
                  </a>
                  <Link
                    href="/tools"
                    className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                  >
                    View All Placeholders
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 sm:w-[320px]">
                {stats.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-3 text-center"
                  >
                    <p className="text-xs text-[var(--text-secondary)]">{label}</p>
                    <p className="mt-1 text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tool Discovery Preview</h2>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                Non-functional for now
              </span>
            </div>
            <SearchBar id="landing-tools-search" />
          </section>

          <section id="tools-preview" className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">
                Upcoming Tools
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Every card is disabled intentionally
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {FEATURED_TOOLS.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Upload",
                detail: "Drag and drop image input across every tool page.",
              },
              {
                step: "2",
                title: "Edit",
                detail: "Adjust controls with real-time preview and validation.",
              },
              {
                step: "3",
                title: "Download",
                detail: "Export final output directly without sending data anywhere.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
              >
                <p className="text-xs font-medium text-[var(--text-secondary)]">
                  Step {item.step}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {item.detail}
                </p>
              </div>
            ))}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

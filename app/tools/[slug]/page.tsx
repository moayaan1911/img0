import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/src/components/layout/Footer";
import Navbar from "@/src/components/layout/Navbar";
import { getToolBySlug, TOOLS_REGISTRY } from "@/src/lib/tools-registry";

type ToolPageParams = {
  slug: string;
};

type ToolPageProps = {
  params: Promise<ToolPageParams>;
};

export async function generateStaticParams() {
  return TOOLS_REGISTRY.map((tool) => ({ slug: tool.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {
      title: "Tool Not Found",
    };
  }

  return {
    title: `${tool.name} (Coming Soon)`,
    description: `${tool.name} is in planned mode and currently disabled for implementation preview.`,
  };
}

export default async function ToolPlaceholderPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <Navbar totalTools={TOOLS_REGISTRY.length} />

        <main className="flex flex-col gap-8">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-10">
            <p className="inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              Phase {tool.phase} • {tool.category}
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {tool.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              {tool.description}
            </p>

            <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-4 font-mono text-sm text-[var(--text-secondary)]">
              Route: {tool.route}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                Status: Coming Soon
              </span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                Processing: Disabled
              </span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                Upload: Disabled
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
              >
                Back to Landing
              </Link>
              <Link
                href="/tools"
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
              >
                View All Tools
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}


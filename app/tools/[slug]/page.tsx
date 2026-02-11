import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/src/components/layout/Footer";
import Navbar from "@/src/components/layout/Navbar";
import ToolShell from "@/src/components/tools/ToolShell";
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
          <ToolShell
            toolName={tool.name}
            toolDescription={tool.description}
            category={tool.category}
            phase={tool.phase}
            route={tool.route}
          />

          <section className="flex flex-wrap items-center gap-3">
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
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

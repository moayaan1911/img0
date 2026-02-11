import type { Metadata } from "next";
import Link from "next/link";
import BlurCensorTool from "@/src/components/tools/phase5/BlurCensorTool";
import ToolPageFrame from "@/src/components/tools/ToolPageFrame";

export const metadata: Metadata = {
  title: "Blur / Censor Tool",
  description:
    "Draw regions to blur or pixelate sensitive areas directly in your browser.",
};

export default function BlurCensorPage() {
  return (
    <ToolPageFrame>
      <BlurCensorTool />
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
    </ToolPageFrame>
  );
}


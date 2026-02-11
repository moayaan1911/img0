import type { Metadata } from "next";
import Link from "next/link";
import GifMakerTool from "@/src/components/tools/phase6/GifMakerTool";
import ToolPageFrame from "@/src/components/tools/ToolPageFrame";

export const metadata: Metadata = {
  title: "GIF Maker",
  description: "Create animated GIFs from multiple images with frame delay and loop controls.",
};

export default function GifMakerPage() {
  return (
    <ToolPageFrame>
      <GifMakerTool />
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


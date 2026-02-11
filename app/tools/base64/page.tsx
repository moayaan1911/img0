import type { Metadata } from "next";
import Link from "next/link";
import Base64Tool from "@/src/components/tools/phase5/Base64Tool";
import ToolPageFrame from "@/src/components/tools/ToolPageFrame";

export const metadata: Metadata = {
  title: "Image to Base64",
  description: "Convert image to Base64 and decode Base64 to image in your browser.",
};

export default function Base64Page() {
  return (
    <ToolPageFrame>
      <Base64Tool />
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


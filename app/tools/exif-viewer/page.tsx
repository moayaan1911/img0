import type { Metadata } from "next";
import Link from "next/link";
import ExifViewerTool from "@/src/components/tools/phase5/ExifViewerTool";
import ToolPageFrame from "@/src/components/tools/ToolPageFrame";

export const metadata: Metadata = {
  title: "EXIF Viewer & Remover",
  description:
    "Inspect image metadata details and export metadata-clean image output in browser.",
};

export default function ExifViewerPage() {
  return (
    <ToolPageFrame>
      <ExifViewerTool />
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


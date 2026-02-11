import type { Metadata } from "next";
import Link from "next/link";
import RoundCornersTool from "@/src/components/tools/phase5/RoundCornersTool";
import ToolPageFrame from "@/src/components/tools/ToolPageFrame";

export const metadata: Metadata = {
  title: "Round Corners",
  description:
    "Apply rounded corners or circle crop and export transparent PNG output.",
};

export default function RoundCornersPage() {
  return (
    <ToolPageFrame>
      <RoundCornersTool />
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


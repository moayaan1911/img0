import type { Metadata } from "next";
import Link from "next/link";
import WatermarkTool from "@/src/components/tools/phase3/WatermarkTool";
import ToolPageFrame from "@/src/components/tools/ToolPageFrame";

export const metadata: Metadata = {
  title: "Add Text / Watermark",
  description:
    "Add text or logo watermark overlays with opacity, rotation, position, and tiled pattern controls.",
};

export default function WatermarkPage() {
  return (
    <ToolPageFrame>
      <WatermarkTool />
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

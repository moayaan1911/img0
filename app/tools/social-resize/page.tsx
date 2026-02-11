import type { Metadata } from "next";
import Link from "next/link";
import SocialResizeTool from "@/src/components/tools/phase5/SocialResizeTool";
import ToolPageFrame from "@/src/components/tools/ToolPageFrame";

export const metadata: Metadata = {
  title: "Social Media Resizer",
  description:
    "Resize image to social platform presets with center smart crop.",
};

export default function SocialResizePage() {
  return (
    <ToolPageFrame>
      <SocialResizeTool />
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


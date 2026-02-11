import type { Metadata } from "next";
import Link from "next/link";
import PdfToImageTool from "@/src/components/tools/phase4/PdfToImageTool";
import ToolPageFrame from "@/src/components/tools/ToolPageFrame";

export const metadata: Metadata = {
  title: "PDF to Image",
  description:
    "Convert PDF pages to PNG or JPG directly in your browser with page-range selection.",
};

export default function PdfToImagePage() {
  return (
    <ToolPageFrame>
      <PdfToImageTool />
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

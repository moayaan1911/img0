import type { Metadata } from "next";
import Link from "next/link";
import QRCodeGeneratorTool from "@/components/tools/QRCodeGeneratorTool";
import LandingFooter from "@/components/layout/LandingFooter";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description:
    "Generate QR codes for text and URLs directly in your browser. No signup, no upload, fully private.",
};

export default function QrCodeGeneratorPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-[-260px] -z-10 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--text-primary)_13%,transparent)_0%,transparent_76%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-14 pt-4 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-[var(--border)] bg-[color:color-mix(in_oklab,var(--background)_90%,transparent)] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tracking-tight">img0.xyz</p>
              <p className="text-xs text-[var(--text-secondary)]">
                QR Code Generator
              </p>
            </div>
            <Link
              href="/"
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
            >
              Back to Home
            </Link>
          </div>
        </header>

        <main className="space-y-6">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-6 sm:px-10">
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              QR Code Generator
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
              Generate QR codes from text or URLs with full control over size, colors, margin, and error correction.
            </p>
          </section>

          <QRCodeGeneratorTool />
        </main>

        <LandingFooter />
      </div>
    </div>
  );
}

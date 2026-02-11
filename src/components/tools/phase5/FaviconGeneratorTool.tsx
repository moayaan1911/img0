"use client";

import { useEffect, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, fileToImage } from "@/src/lib/image-utils";

type IconOutput = {
  size: number;
  blob: Blob;
  url: string;
  fileName: string;
};

const ICON_SIZES = [16, 32, 48, 64, 128, 192, 512];

export default function FaviconGeneratorTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [outputs, setOutputs] = useState<IconOutput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const outputUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      outputUrlsRef.current = [];
    };
  }, []);

  const clearOutputs = () => {
    outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    outputUrlsRef.current = [];
    setOutputs([]);
  };

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    clearOutputs();
    setSourceFile(file);
  };

  const handleGenerate = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    clearOutputs();

    try {
      const image = await fileToImage(sourceFile);
      const baseName = sourceFile.name.replace(/\.[^.]+$/u, "");
      const generated: IconOutput[] = [];

      for (const size of ICON_SIZES) {
        const canvas = createCanvas(size, size);
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Canvas context is not available in this browser.");
        }

        context.imageSmoothingEnabled = true;
        context.drawImage(image, 0, 0, size, size);
        const blob = await canvasToBlob(canvas, "image/png", 0.92);
        const url = URL.createObjectURL(blob);
        outputUrlsRef.current.push(url);
        generated.push({
          size,
          blob,
          url,
          fileName: `${baseName}-${size}x${size}.png`,
        });
      }

      setOutputs(generated);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate favicon sizes.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 5 • Utility
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Favicon / App Icon Generator
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Generate common favicon and app icon PNG sizes from one source image.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Generating icon sizes..." />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload
            </h2>
            <ImageUploader
              onFileSelect={handleFileSelect}
              title="Drop icon source image"
              description="Square image works best for favicon generation."
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Generate Sizes
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Sizes: {ICON_SIZES.map((size) => `${size}x${size}`).join(", ")}
            </p>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate Icons
            </button>
          </section>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              3. Output Preview
            </h2>
            {outputs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Generated icons will appear here.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {outputs.map((item) => (
                  <li key={item.fileName} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={`${item.size}x${item.size}`}
                      className="mx-auto h-14 w-14 rounded border border-[var(--border)] object-contain"
                    />
                    <p className="mt-2 text-center text-xs text-[var(--text-secondary)]">
                      {item.size}x{item.size}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            {outputs.length === 0 ? (
              <DownloadButton blob={null} label="Download 32x32" disabledReason="Generate icons first." />
            ) : (
              <ul className="space-y-2">
                {outputs.map((item) => (
                  <li key={`${item.fileName}-download`} className="rounded-lg border border-[var(--border)] p-2">
                    <DownloadButton
                      blob={item.blob}
                      fileName={item.fileName}
                      label={`Download ${item.size}x${item.size}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { formatFileSize } from "@/src/lib/image-utils";

type OutputImage = {
  pageNumber: number;
  blob: Blob;
  url: string;
  fileName: string;
};

type OutputFormat = "image/png" | "image/jpeg";

function parsePageSelection(input: string, totalPages: number): number[] {
  const text = input.trim();
  if (!text || text.toLowerCase() === "all") {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const selected = new Set<number>();
  const chunks = text.split(",").map((item) => item.trim()).filter(Boolean);

  for (const chunk of chunks) {
    if (chunk.includes("-")) {
      const [startRaw, endRaw] = chunk.split("-").map((value) => Number(value.trim()));
      if (!Number.isFinite(startRaw) || !Number.isFinite(endRaw)) {
        continue;
      }
      const start = Math.max(1, Math.min(startRaw, endRaw));
      const end = Math.min(totalPages, Math.max(startRaw, endRaw));
      for (let value = start; value <= end; value += 1) {
        selected.add(value);
      }
      continue;
    }

    const page = Number(chunk);
    if (Number.isFinite(page) && page >= 1 && page <= totalPages) {
      selected.add(page);
    }
  }

  return Array.from(selected).sort((a, b) => a - b);
}

export default function PdfToImageTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/png");
  const [scale, setScale] = useState(1.8);
  const [pageSelection, setPageSelection] = useState("all");
  const [outputs, setOutputs] = useState<OutputImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("Preparing...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current = [];
    };
  }, []);

  const clearOutputs = () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
    setOutputs([]);
  };

  const handleSourceSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setErrorMessage("Please upload a valid PDF file.");
      return;
    }

    setErrorMessage(null);
    clearOutputs();
    setSourceFile(file);

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();

      const buffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      setTotalPages(pdf.numPages);
      await pdf.destroy();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to read PDF metadata.";
      setErrorMessage(message);
      setTotalPages(0);
    }
  };

  const handleConvert = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    clearOutputs();

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();

      const buffer = await sourceFile.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      const pages = parsePageSelection(pageSelection, pdf.numPages);

      if (pages.length === 0) {
        throw new Error("No valid pages selected. Use format like all, 1,3,5-8.");
      }

      const generated: OutputImage[] = [];
      const extension = outputFormat === "image/png" ? "png" : "jpg";
      const baseName = sourceFile.name.replace(/\.[^.]+$/u, "");

      for (let index = 0; index < pages.length; index += 1) {
        const pageNumber = pages[index];
        setProgressMessage(`Rendering page ${index + 1}/${pages.length}...`);

        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Canvas context is not available in this browser.");
        }

        await page.render({ canvasContext: context, viewport, canvas }).promise;

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (!result) {
                reject(new Error("Failed to render page image."));
                return;
              }
              resolve(result);
            },
            outputFormat,
            0.92,
          );
        });

        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        generated.push({
          pageNumber,
          blob,
          url,
          fileName: `${baseName}-page-${String(pageNumber).padStart(2, "0")}.${extension}`,
        });
      }

      setOutputs(generated);
      await pdf.destroy();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to convert PDF.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
      setProgressMessage("Preparing...");
    }
  };

  const firstOutput = useMemo(() => (outputs.length > 0 ? outputs[0] : null), [outputs]);

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 4 • PDF & Document
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">PDF to Image</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Convert selected PDF pages to PNG or JPG directly in your browser.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message={progressMessage} />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload PDF
            </h2>
            <label className="block rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
              <p className="text-base font-semibold">Drop PDF here or choose file</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                PDF never leaves your device.
              </p>
              <span className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]">
                Choose PDF
              </span>
              <input type="file" accept="application/pdf" onChange={handleSourceSelect} className="sr-only" />
            </label>

            {sourceFile ? (
              <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs sm:grid-cols-3">
                <div>
                  <p className="text-[var(--text-secondary)]">File</p>
                  <p className="mt-1 truncate font-medium">{sourceFile.name}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Size</p>
                  <p className="mt-1 font-medium">{formatFileSize(sourceFile.size)}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Pages</p>
                  <p className="mt-1 font-medium">{totalPages || "-"}</p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Conversion Settings
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--text-secondary)]">
                Output Format
                <select
                  value={outputFormat}
                  onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPG</option>
                </select>
              </label>

              <label className="text-xs text-[var(--text-secondary)]">
                Scale: {scale.toFixed(1)}x
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={scale}
                  onChange={(event) => setScale(Number(event.target.value))}
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
            </div>

            <label className="block text-xs text-[var(--text-secondary)]">
              Pages (example: all, 1,3,5-8)
              <input
                type="text"
                value={pageSelection}
                onChange={(event) => setPageSelection(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleConvert()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Convert PDF
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
              3. Preview
            </h2>
            {firstOutput ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={firstOutput.url}
                  alt={`Preview page ${firstOutput.pageNumber}`}
                  className="max-h-[420px] w-full rounded-xl border border-[var(--border)] object-contain"
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  Showing page {firstOutput.pageNumber} preview
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                Converted images preview appears here.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            {outputs.length === 0 ? (
              <DownloadButton
                blob={null}
                label="Download First Image"
                disabledReason="Convert PDF first."
              />
            ) : (
              <ul className="space-y-2">
                {outputs.map((item) => (
                  <li key={item.fileName} className="rounded-lg border border-[var(--border)] p-2">
                    <DownloadButton blob={item.blob} fileName={item.fileName} label={`Download ${item.fileName}`} />
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

"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";

type ExtractedPage = {
  pageNumber: number;
  width: number;
  height: number;
  size: number;
  url: string;
};

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}

function ExtractIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  );
}

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
}

function toBaseName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return base.trim() || "img0-pages";
}

function toMimeType(format: OutputFormat): string {
  if (format === "jpg") {
    return "image/jpeg";
  }
  if (format === "webp") {
    return "image/webp";
  }
  return "image/png";
}

function toPageName(baseName: string, pageNumber: number, format: OutputFormat): string {
  return `${baseName}-page-${String(pageNumber).padStart(2, "0")}.${format}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  const mimeType = toMimeType(format);
  const exportQuality =
    format === "jpg" || format === "webp" ? quality / 100 : undefined;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas export failed"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      exportQuality,
    );
  });
}

function triggerDownload(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function PdfToImageTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [scale, setScale] = useState(1.5);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<ExtractedPage[]>([]);
  const extractRunRef = useRef(0);
  const pagesRef = useRef<ExtractedPage[]>([]);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    return () => {
      pagesRef.current.forEach((page) => URL.revokeObjectURL(page.url));
    };
  }, []);

  const baseFileName = useMemo(
    () => (sourceFile ? toBaseName(sourceFile.name) : "img0-pages"),
    [sourceFile],
  );

  function clearPages() {
    setPages((prev) => {
      prev.forEach((page) => URL.revokeObjectURL(page.url));
      return [];
    });
  }

  async function extractFromFile(file: File) {
    setError(null);
    setIsExtracting(true);
    clearPages();

    const runId = Date.now();
    extractRunRef.current = runId;

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const sourceBytes = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: sourceBytes });
      const pdf = await loadingTask.promise;
      const nextPages: ExtractedPage[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        if (extractRunRef.current !== runId) {
          return;
        }

        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas unavailable");
        }

        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const blob = await canvasToBlob(canvas, outputFormat, quality);
        const url = URL.createObjectURL(blob);

        nextPages.push({
          pageNumber,
          width: canvas.width,
          height: canvas.height,
          size: blob.size,
          url,
        });

        setPages([...nextPages]);
      }
    } catch {
      clearPages();
      setError("Could not process this PDF. Try another file.");
    } finally {
      if (extractRunRef.current === runId) {
        setIsExtracting(false);
      }
    }
  }

  async function handlePdf(file: File | null) {
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    setSourceFile(file);
    await extractFromFile(file);
  }

  function handleDownloadAll() {
    if (pages.length === 0) {
      return;
    }

    pages.forEach((page) => {
      triggerDownload(
        page.url,
        toPageName(baseFileName, page.pageNumber, outputFormat),
      );
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="pdf-to-image-input"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            void handlePdf(file);
          }}
          className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition ${
            isDragActive
              ? "border-[var(--text-primary)] bg-[var(--surface-strong)]"
              : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-strong)]"
          }`}
        >
          <div className="mb-2 inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-secondary)]">
            <UploadIcon />
          </div>
          <p className="text-sm font-semibold">Upload PDF</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Drag and drop or click to select a PDF file
          </p>
          <input
            id="pdf-to-image-input"
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handlePdf(file);
              event.target.value = "";
            }}
          />
        </label>

        {sourceFile ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="text-sm font-medium">{sourceFile.name}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {formatBytes(sourceFile.size)} • {pages.length} page
              {pages.length === 1 ? "" : "s"} extracted
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Output format
            </span>
            <select
              value={outputFormat}
              onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Quality: {quality}
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={quality}
              disabled={outputFormat === "png"}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Render scale: {scale.toFixed(1)}x
            </span>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              className="mt-2 w-full cursor-pointer"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!sourceFile) {
                return;
              }
              void extractFromFile(sourceFile);
            }}
            disabled={!sourceFile || isExtracting}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceFile && !isExtracting
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isExtracting ? null : <ExtractIcon />}
            {isExtracting ? "Extracting..." : "Extract Pages"}
          </button>

          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={pages.length === 0 || isExtracting}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              pages.length > 0 && !isExtracting
                ? "cursor-pointer border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] transition hover:bg-[var(--surface-strong)]"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            <DownloadIcon />
            Download All
          </button>
        </div>

        {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Extracted Pages</p>
        <div className="mt-4 min-h-[300px] rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          {isExtracting ? (
            <p className="text-sm text-[var(--text-secondary)]">Rendering pages...</p>
          ) : null}

          {!isExtracting && pages.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Upload a PDF to preview extracted pages here.
            </p>
          ) : null}

          {!isExtracting && pages.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {pages.map((page) => (
                <article
                  key={page.pageNumber}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2"
                >
                  <Image
                    src={page.url}
                    alt={`PDF page ${page.pageNumber}`}
                    width={Math.max(page.width, 1)}
                    height={Math.max(page.height, 1)}
                    unoptimized
                    className="h-auto max-h-[210px] w-full rounded-md border border-[var(--border)] object-contain bg-white"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium">Page {page.pageNumber}</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {page.width} x {page.height} • {formatBytes(page.size)}
                      </p>
                    </div>
                    <a
                      href={page.url}
                      download={toPageName(baseFileName, page.pageNumber, outputFormat)}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text-primary)] transition hover:bg-[var(--surface-strong)]"
                    >
                      <DownloadIcon />
                      Save
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

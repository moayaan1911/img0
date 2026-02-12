"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";

const MAX_DIMENSION = 12000;
const scalePresets = [25, 50, 75, 100, 150, 200];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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

function getMimeType(format: OutputFormat): string {
  if (format === "jpg") {
    return "image/jpeg";
  }
  if (format === "webp") {
    return "image/webp";
  }
  return "image/png";
}

function outputName(originalName: string, format: OutputFormat): string {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  return `${base || "img0-resized"}.${format}`;
}

function createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

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

function ResizeIcon() {
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
      <path d="M4 14V4h10" />
      <path d="m4 4 8 8" />
      <path d="M20 10v10H10" />
      <path d="m20 20-8-8" />
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

export default function ResizeImageTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState("");

  useEffect(() => {
    return () => {
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [outputUrl]);

  const downloadFileName = useMemo(() => {
    if (!sourceFile) {
      return `img0-resized.${outputFormat}`;
    }
    return outputName(sourceFile.name, outputFormat);
  }, [outputFormat, sourceFile]);

  function clearOutput() {
    setOutputBlob(null);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl("");
    }
  }

  function updateFromWidth(nextWidth: number) {
    const safeWidth = clamp(Math.round(nextWidth), 1, MAX_DIMENSION);
    setTargetWidth(safeWidth);

    if (!lockAspect || sourceWidth <= 0 || sourceHeight <= 0) {
      return;
    }

    const nextHeight = clamp(
      Math.round((safeWidth / sourceWidth) * sourceHeight),
      1,
      MAX_DIMENSION,
    );
    setTargetHeight(nextHeight);
  }

  function updateFromHeight(nextHeight: number) {
    const safeHeight = clamp(Math.round(nextHeight), 1, MAX_DIMENSION);
    setTargetHeight(safeHeight);

    if (!lockAspect || sourceWidth <= 0 || sourceHeight <= 0) {
      return;
    }

    const nextWidth = clamp(
      Math.round((safeHeight / sourceHeight) * sourceWidth),
      1,
      MAX_DIMENSION,
    );
    setTargetWidth(nextWidth);
  }

  function applyScale(percent: number) {
    if (!sourceFile || sourceWidth <= 0 || sourceHeight <= 0) {
      return;
    }

    const width = clamp(
      Math.round((sourceWidth * percent) / 100),
      1,
      MAX_DIMENSION,
    );
    const height = clamp(
      Math.round((sourceHeight * percent) / 100),
      1,
      MAX_DIMENSION,
    );

    setTargetWidth(width);
    setTargetHeight(height);
  }

  async function handleFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setError(null);
    setSourceFile(file);
    clearOutput();

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = String(reader.result ?? "");
        const image = await createImageFromDataUrl(dataUrl);
        setSourceDataUrl(dataUrl);
        setSourceWidth(image.naturalWidth);
        setSourceHeight(image.naturalHeight);
        setTargetWidth(image.naturalWidth);
        setTargetHeight(image.naturalHeight);
        setLockAspect(true);
      } catch {
        setSourceDataUrl("");
        setSourceWidth(0);
        setSourceHeight(0);
        setTargetWidth(0);
        setTargetHeight(0);
        setError("Failed to read this image. Try another file.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read this image.");
    };
    reader.readAsDataURL(file);
  }

  async function handleResize() {
    if (!sourceFile || !sourceDataUrl) {
      setError("Upload an image first.");
      return;
    }

    if (targetWidth < 1 || targetHeight < 1) {
      setError("Enter a valid width and height.");
      return;
    }

    setError(null);
    setIsResizing(true);
    try {
      const source = await createImageFromDataUrl(sourceDataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas unavailable");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

      const mimeType = getMimeType(outputFormat);
      const exportQuality =
        outputFormat === "jpg" || outputFormat === "webp"
          ? quality / 100
          : undefined;
      const blob = await canvasToBlob(canvas, mimeType, exportQuality);

      clearOutput();
      const url = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(url);
    } catch {
      setError("Resize failed. Try another image or size.");
    } finally {
      setIsResizing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="resize-input-file"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            void handleFile(file);
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
          <p className="text-sm font-semibold">Upload image</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Drag and drop, or click to choose a file
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">JPG, PNG, WebP and more</p>
          <input
            id="resize-input-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handleFile(file);
            }}
          />
        </label>

        {sourceFile ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="text-sm font-medium">{sourceFile.name}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {formatBytes(sourceFile.size)} • {sourceWidth} x {sourceHeight}
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Width (px)
            </span>
            <input
              type="number"
              min={1}
              max={MAX_DIMENSION}
              inputMode="numeric"
              value={sourceFile ? targetWidth : ""}
              disabled={!sourceFile}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isNaN(next)) {
                  return;
                }
                updateFromWidth(next);
              }}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Height (px)
            </span>
            <input
              type="number"
              min={1}
              max={MAX_DIMENSION}
              inputMode="numeric"
              value={sourceFile ? targetHeight : ""}
              disabled={!sourceFile}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isNaN(next)) {
                  return;
                }
                updateFromHeight(next);
              }}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>
        </div>

        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={lockAspect}
            onChange={(event) => setLockAspect(event.target.checked)}
            className="h-4 w-4 cursor-pointer accent-[var(--text-primary)]"
          />
          Keep aspect ratio
        </label>

        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Quick scale
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {scalePresets.map((percent) => (
              <button
                key={percent}
                type="button"
                onClick={() => applyScale(percent)}
                disabled={!sourceFile}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  sourceFile
                    ? "cursor-pointer border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                    : "cursor-not-allowed border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Output format
            </span>
            <select
              value={outputFormat}
              onChange={(event) =>
                setOutputFormat(event.target.value as OutputFormat)
              }
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
              onChange={(event) => setQuality(Number(event.target.value))}
              className="mt-2 w-full cursor-pointer"
              disabled={outputFormat === "png"}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleResize()}
            disabled={!sourceFile || isResizing || targetWidth < 1 || targetHeight < 1}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceFile && !isResizing && targetWidth > 0 && targetHeight > 0
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isResizing ? null : <ResizeIcon />}
            {isResizing ? "Resizing..." : "Resize"}
          </button>
          {sourceFile ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Output: {targetWidth} x {targetHeight}
            </p>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Output Preview</p>
        <div className="mt-4 flex min-h-[300px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          {!outputUrl ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Resize an image to preview output here.
            </p>
          ) : (
            <Image
              src={outputUrl}
              alt="Resized output preview"
              width={Math.max(targetWidth, 1)}
              height={Math.max(targetHeight, 1)}
              unoptimized
              className="h-auto max-h-[260px] w-auto max-w-full rounded-md"
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={outputUrl || undefined}
            download={downloadFileName}
            aria-disabled={!outputUrl}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              outputUrl
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            <DownloadIcon />
            Download
          </a>
          {outputBlob ? (
            <p className="text-xs text-[var(--text-secondary)]">
              {downloadFileName} • {formatBytes(outputBlob.size)}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

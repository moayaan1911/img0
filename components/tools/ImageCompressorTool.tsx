"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OutputFormat = "jpg" | "webp" | "png";

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

function inferFormatFromMime(mime: string): OutputFormat {
  if (mime === "image/png") {
    return "png";
  }
  if (mime === "image/webp") {
    return "webp";
  }
  return "jpg";
}

function outputName(originalName: string, format: OutputFormat): string {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  return `${base || "img0-image"}-compressed.${format}`;
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

function CompressIcon() {
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
      <path d="M20 12H4" />
      <path d="M12 20V4" />
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="2"
      />
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

export default function ImageCompressorTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpg");
  const [quality, setQuality] = useState(75);
  const [scalePercent, setScalePercent] = useState(100);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState("");
  const [outputWidth, setOutputWidth] = useState(0);
  const [outputHeight, setOutputHeight] = useState(0);

  useEffect(() => {
    return () => {
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [outputUrl]);

  const downloadFileName = useMemo(() => {
    if (!sourceFile) {
      return `img0-compressed.${outputFormat}`;
    }
    return outputName(sourceFile.name, outputFormat);
  }, [outputFormat, sourceFile]);

  const sizeComparison = useMemo(() => {
    if (!sourceFile || !outputBlob) {
      return null;
    }

    const delta = sourceFile.size - outputBlob.size;
    const percent = (Math.abs(delta) / Math.max(sourceFile.size, 1)) * 100;
    return {
      isReduced: delta >= 0,
      deltaText: `${formatBytes(Math.abs(delta))} (${percent.toFixed(1)}%)`,
    };
  }, [outputBlob, sourceFile]);

  function clearOutput() {
    setOutputBlob(null);
    setOutputWidth(0);
    setOutputHeight(0);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl("");
    }
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
    setScalePercent(100);
    setOutputFormat(inferFormatFromMime(file.type));
    setQuality(75);
    clearOutput();

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = String(reader.result ?? "");
        const image = await createImageFromDataUrl(dataUrl);
        setSourceDataUrl(dataUrl);
        setSourceWidth(image.naturalWidth);
        setSourceHeight(image.naturalHeight);
      } catch {
        setSourceDataUrl("");
        setSourceWidth(0);
        setSourceHeight(0);
        setError("Failed to read this image. Try another file.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read this image.");
    };
    reader.readAsDataURL(file);
  }

  async function handleCompress() {
    if (!sourceFile || !sourceDataUrl) {
      setError("Upload an image first.");
      return;
    }

    setError(null);
    setIsCompressing(true);
    try {
      const source = await createImageFromDataUrl(sourceDataUrl);
      const targetWidth = Math.max(1, Math.round((source.naturalWidth * scalePercent) / 100));
      const targetHeight = Math.max(
        1,
        Math.round((source.naturalHeight * scalePercent) / 100),
      );

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas unavailable");
      }

      if (outputFormat === "jpg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
      setOutputWidth(targetWidth);
      setOutputHeight(targetHeight);
    } catch {
      setError("Compression failed. Try another image.");
    } finally {
      setIsCompressing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="compress-input-file"
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
            id="compress-input-file"
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
              Output format
            </span>
            <select
              value={outputFormat}
              onChange={(event) => {
                setOutputFormat(event.target.value as OutputFormat);
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
              <option value="png">PNG</option>
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
              onChange={(event) => {
                setQuality(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>
        </div>

        <div className="mt-4">
          <label
            htmlFor="compress-scale"
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Resize before compress: {scalePercent}%
          </label>
          <input
            id="compress-scale"
            type="range"
            min={10}
            max={100}
            step={1}
            value={scalePercent}
            onChange={(event) => {
              setScalePercent(Number(event.target.value));
              clearOutput();
            }}
            className="mt-2 w-full cursor-pointer"
          />
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Resolution output:{" "}
            {sourceFile
              ? `${Math.max(1, Math.round((sourceWidth * scalePercent) / 100))} x ${Math.max(
                  1,
                  Math.round((sourceHeight * scalePercent) / 100),
                )}`
              : "—"}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleCompress()}
            disabled={!sourceFile || isCompressing}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceFile && !isCompressing
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isCompressing ? null : <CompressIcon />}
            {isCompressing ? "Compressing..." : "Compress"}
          </button>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Output Preview</p>
        <div className="mt-4 flex min-h-[300px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          {!outputUrl ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Compress an image to preview output here.
            </p>
          ) : (
            <Image
              src={outputUrl}
              alt="Compressed output preview"
              width={Math.max(outputWidth, 1)}
              height={Math.max(outputHeight, 1)}
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
          {outputBlob && sourceFile ? (
            <p className="text-xs text-[var(--text-secondary)]">
              {downloadFileName} • {formatBytes(outputBlob.size)} •{" "}
              {sizeComparison
                ? sizeComparison.isReduced
                  ? `Saved ${sizeComparison.deltaText}`
                  : `Increased ${sizeComparison.deltaText}`
                : ""}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";

const rotationOptions = [0, 90, 180, 270] as const;

function normalizeRotation(value: number): number {
  return ((value % 360) + 360) % 360;
}

function getTransformedDimensions(
  width: number,
  height: number,
  rotation: number,
): { width: number; height: number } {
  const normalized = normalizeRotation(rotation);
  if (normalized % 180 === 0) {
    return { width, height };
  }

  return { width: height, height: width };
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
  return `${base || "img0-image"}-rotated-flipped.${format}`;
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

function RotateIcon() {
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
      <path d="M21 12a9 9 0 1 1-3.2-6.9" />
      <path d="M21 3v6h-6" />
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

export default function RotateFlipTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [isProcessing, setIsProcessing] = useState(false);
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
      return `img0-rotated.${outputFormat}`;
    }
    return outputName(sourceFile.name, outputFormat);
  }, [outputFormat, sourceFile]);

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
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
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

  function setRotationPreset(nextRotation: number) {
    setRotation(normalizeRotation(nextRotation));
    clearOutput();
  }

  function toggleFlipX() {
    setFlipX((prev) => !prev);
    clearOutput();
  }

  function toggleFlipY() {
    setFlipY((prev) => !prev);
    clearOutput();
  }

  function resetTransforms() {
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    clearOutput();
  }

  async function handleApplyTransform() {
    if (!sourceFile || !sourceDataUrl) {
      setError("Upload an image first.");
      return;
    }

    setError(null);
    setIsProcessing(true);
    try {
      const source = await createImageFromDataUrl(sourceDataUrl);
      const normalizedRotation = normalizeRotation(rotation);
      const size = getTransformedDimensions(
        source.naturalWidth,
        source.naturalHeight,
        normalizedRotation,
      );

      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas unavailable");
      }

      if (outputFormat === "jpg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((normalizedRotation * Math.PI) / 180);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        source,
        -source.naturalWidth / 2,
        -source.naturalHeight / 2,
        source.naturalWidth,
        source.naturalHeight,
      );

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
      setOutputWidth(canvas.width);
      setOutputHeight(canvas.height);
    } catch {
      setError("Rotate/Flip failed. Try another image.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="rotate-input-file"
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
            id="rotate-input-file"
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

        <div className="mt-5">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Rotate preset
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {rotationOptions.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRotationPreset(value)}
                disabled={!sourceFile}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  sourceFile
                    ? rotation === value
                      ? "cursor-pointer border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--background)]"
                      : "cursor-pointer border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                    : "cursor-not-allowed border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
                }`}
              >
                {value}°
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-secondary)]">Flip</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleFlipX}
              disabled={!sourceFile}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                sourceFile
                  ? flipX
                    ? "cursor-pointer border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--background)]"
                    : "cursor-pointer border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                  : "cursor-not-allowed border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
              }`}
            >
              Horizontal
            </button>
            <button
              type="button"
              onClick={toggleFlipY}
              disabled={!sourceFile}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                sourceFile
                  ? flipY
                    ? "cursor-pointer border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--background)]"
                    : "cursor-pointer border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                  : "cursor-not-allowed border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
              }`}
            >
              Vertical
            </button>
            <button
              type="button"
              onClick={resetTransforms}
              disabled={!sourceFile}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                sourceFile
                  ? "cursor-pointer border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                  : "cursor-not-allowed border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
              }`}
            >
              Reset
            </button>
          </div>
        </div>

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
              onChange={(event) => {
                setQuality(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
              disabled={outputFormat === "png"}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleApplyTransform()}
            disabled={!sourceFile || isProcessing}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceFile && !isProcessing
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isProcessing ? null : <RotateIcon />}
            {isProcessing ? "Processing..." : "Apply Rotate & Flip"}
          </button>
          {sourceFile ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Rotation: {normalizeRotation(rotation)}° • H: {flipX ? "On" : "Off"} • V:{" "}
              {flipY ? "On" : "Off"}
            </p>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Preview</p>
        <div className="mt-4 flex min-h-[320px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          {!sourceDataUrl ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Upload an image to preview transformations.
            </p>
          ) : outputUrl ? (
            <Image
              src={outputUrl}
              alt="Rotated and flipped output preview"
              width={Math.max(outputWidth, 1)}
              height={Math.max(outputHeight, 1)}
              unoptimized
              className="h-auto max-h-[280px] w-auto max-w-full rounded-md"
            />
          ) : (
            <Image
              src={sourceDataUrl}
              alt="Live rotate and flip preview"
              width={Math.max(sourceWidth, 1)}
              height={Math.max(sourceHeight, 1)}
              unoptimized
              className="h-auto max-h-[280px] w-auto max-w-full rounded-md transition-transform"
              style={{
                transform: `rotate(${normalizeRotation(rotation)}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
              }}
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
              {downloadFileName} • {formatBytes(outputBlob.size)} • {outputWidth} x{" "}
              {outputHeight}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

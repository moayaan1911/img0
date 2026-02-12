"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";

type CircleCrop = {
  centerX: number;
  centerY: number;
  radius: number;
};

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

function outputName(originalName: string, format: OutputFormat): string {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  return `${base || "img0-image"}-circle.${format}`;
}

function mimeFromFormat(format: OutputFormat): string {
  if (format === "jpg") {
    return "image/jpeg";
  }
  if (format === "webp") {
    return "image/webp";
  }
  return "image/png";
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

function getCircleCrop(
  width: number,
  height: number,
  radiusPercent: number,
  offsetXPercent: number,
  offsetYPercent: number,
): CircleCrop {
  const maxRadius = Math.max(Math.min(width, height) / 2, 1);
  const radius = clamp((maxRadius * radiusPercent) / 100, 1, maxRadius);

  const travelX = Math.max(width / 2 - radius, 0);
  const travelY = Math.max(height / 2 - radius, 0);

  const centerX = width / 2 + (travelX * clamp(offsetXPercent, -100, 100)) / 100;
  const centerY = height / 2 + (travelY * clamp(offsetYPercent, -100, 100)) / 100;

  return { centerX, centerY, radius };
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

function CircleIcon() {
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
      <circle cx="12" cy="12" r="8" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
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

export default function CircularCropTool() {
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);

  const [radiusPercent, setRadiusPercent] = useState(100);
  const [offsetXPercent, setOffsetXPercent] = useState(0);
  const [offsetYPercent, setOffsetYPercent] = useState(0);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [isCropping, setIsCropping] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState("");
  const [outputSize, setOutputSize] = useState(0);

  useEffect(() => {
    return () => {
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [outputUrl]);

  const downloadFileName = useMemo(() => {
    if (!sourceFile) {
      return `img0-circle.${outputFormat}`;
    }
    return outputName(sourceFile.name, outputFormat);
  }, [sourceFile, outputFormat]);

  const currentCircle = useMemo(() => {
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      return null;
    }
    return getCircleCrop(
      sourceWidth,
      sourceHeight,
      radiusPercent,
      offsetXPercent,
      offsetYPercent,
    );
  }, [sourceWidth, sourceHeight, radiusPercent, offsetXPercent, offsetYPercent]);

  const overlayStyle = useMemo(() => {
    if (!currentCircle) {
      return null;
    }

    const image = imageRef.current;
    if (!image || image.clientWidth <= 0 || image.clientHeight <= 0) {
      return null;
    }

    const scaleX = image.clientWidth / sourceWidth;
    const scaleY = image.clientHeight / sourceHeight;
    const diameter = currentCircle.radius * 2;

    return {
      left: image.offsetLeft + (currentCircle.centerX - currentCircle.radius) * scaleX,
      top: image.offsetTop + (currentCircle.centerY - currentCircle.radius) * scaleY,
      width: diameter * scaleX,
      height: diameter * scaleY,
    };
  }, [currentCircle, sourceWidth, sourceHeight]);

  function clearOutput() {
    setOutputBlob(null);
    setOutputSize(0);
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
    setSourceDataUrl("");
    setSourceWidth(0);
    setSourceHeight(0);
    setRadiusPercent(100);
    setOffsetXPercent(0);
    setOffsetYPercent(0);
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

  async function handleCircularCrop() {
    if (!sourceDataUrl || !currentCircle) {
      setError("Upload an image first.");
      return;
    }

    setError(null);
    setIsCropping(true);
    try {
      const source = await createImageFromDataUrl(sourceDataUrl);
      const diameter = Math.max(1, Math.round(currentCircle.radius * 2));
      const maxSx = Math.max(source.naturalWidth - diameter, 0);
      const maxSy = Math.max(source.naturalHeight - diameter, 0);

      const sx = clamp(
        Math.round(currentCircle.centerX - currentCircle.radius),
        0,
        maxSx,
      );
      const sy = clamp(
        Math.round(currentCircle.centerY - currentCircle.radius),
        0,
        maxSy,
      );

      const canvas = document.createElement("canvas");
      canvas.width = diameter;
      canvas.height = diameter;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas unavailable");
      }

      if (outputFormat === "jpg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, diameter, diameter);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.beginPath();
      ctx.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(source, sx, sy, diameter, diameter, 0, 0, diameter, diameter);

      const mimeType = mimeFromFormat(outputFormat);
      const exportQuality =
        outputFormat === "jpg" || outputFormat === "webp"
          ? quality / 100
          : undefined;
      const blob = await canvasToBlob(canvas, mimeType, exportQuality);
      const url = URL.createObjectURL(blob);

      clearOutput();
      setOutputBlob(blob);
      setOutputUrl(url);
      setOutputSize(diameter);
    } catch {
      setError("Circular crop failed. Try another image.");
    } finally {
      setIsCropping(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="circular-crop-input-file"
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
            id="circular-crop-input-file"
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

        <p className="mt-4 text-xs text-[var(--text-secondary)]">
          For transparent corners use PNG or WebP. JPG fills outside-circle area white.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Radius: {radiusPercent}%
            </span>
            <input
              type="range"
              min={20}
              max={100}
              step={1}
              value={radiusPercent}
              onChange={(event) => {
                setRadiusPercent(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

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
              Horizontal position: {offsetXPercent}
            </span>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={offsetXPercent}
              onChange={(event) => {
                setOffsetXPercent(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Vertical position: {offsetYPercent}
            </span>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={offsetYPercent}
              onChange={(event) => {
                setOffsetYPercent(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm sm:col-span-2">
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

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleCircularCrop()}
            disabled={!sourceDataUrl || isCropping}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceDataUrl && !isCropping
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isCropping ? null : <CircleIcon />}
            {isCropping ? "Cropping..." : "Apply Circular Crop"}
          </button>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Preview</p>

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Crop Selection</p>
          <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            {!sourceDataUrl ? (
              <p className="text-center text-xs text-[var(--text-secondary)]">
                Upload an image to place the circle.
              </p>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={sourceDataUrl}
                  alt="Source image for circular crop"
                  className="max-h-[250px] w-auto max-w-full rounded-md object-contain"
                />
                {overlayStyle ? (
                  <>
                    <div
                      className="pointer-events-none absolute border border-[var(--text-primary)]/30 bg-[color:color-mix(in_oklab,var(--text-primary)_15%,transparent)]"
                      style={{
                        left: overlayStyle.left,
                        top: overlayStyle.top,
                        width: overlayStyle.width,
                        height: overlayStyle.height,
                        borderRadius: "9999px",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute border border-dashed border-[var(--text-primary)]"
                      style={{
                        left: overlayStyle.left,
                        top: overlayStyle.top,
                        width: overlayStyle.width,
                        height: overlayStyle.height,
                        borderRadius: "9999px",
                      }}
                    />
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Circular Output</p>
          <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[var(--border)] bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%)] bg-[length:24px_24px] bg-[position:0_0,12px_12px] p-2 dark:bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%),linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%)]">
            {!outputUrl ? (
              <p className="text-center text-xs text-[var(--text-secondary)]">
                Apply circular crop to preview result.
              </p>
            ) : (
              <Image
                src={outputUrl}
                alt="Circular crop output preview"
                width={Math.max(outputSize, 1)}
                height={Math.max(outputSize, 1)}
                unoptimized
                className="h-auto max-h-[200px] w-auto max-w-full rounded-md"
              />
            )}
          </div>
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
              {downloadFileName} • {formatBytes(outputBlob.size)} • {outputSize} x{" "}
              {outputSize}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";

export type ColorFilterMode =
  | "brightness"
  | "contrast"
  | "saturation"
  | "hue"
  | "grayscale"
  | "sepia"
  | "invert"
  | "color-replacement"
  | "auto-enhance";

type ColorFilterToolProps = {
  mode: ColorFilterMode;
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

function outputName(originalName: string, format: OutputFormat, mode: ColorFilterMode): string {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  return `${base || "img0-image"}-${mode}.${format}`;
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

function inferFormatFromMime(mime: string): OutputFormat {
  if (mime === "image/png") {
    return "png";
  }
  if (mime === "image/webp") {
    return "webp";
  }
  return "jpg";
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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.trim().replace("#", "");
  const safe =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized.padStart(6, "0").slice(0, 6);
  const value = Number.parseInt(safe, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function getModeLabel(mode: ColorFilterMode): string {
  switch (mode) {
    case "brightness":
      return "Adjust Brightness";
    case "contrast":
      return "Adjust Contrast";
    case "saturation":
      return "Adjust Saturation";
    case "hue":
      return "Hue Shifter";
    case "grayscale":
      return "Grayscale Converter";
    case "sepia":
      return "Sepia Filter";
    case "invert":
      return "Invert Colors";
    case "color-replacement":
      return "Color Replacement";
    case "auto-enhance":
      return "Auto Enhance";
    default:
      return "Color Filter";
  }
}

function getModeButtonLabel(mode: ColorFilterMode): string {
  switch (mode) {
    case "brightness":
      return "Apply Brightness";
    case "contrast":
      return "Apply Contrast";
    case "saturation":
      return "Apply Saturation";
    case "hue":
      return "Apply Hue Shift";
    case "grayscale":
      return "Convert to Grayscale";
    case "sepia":
      return "Apply Sepia";
    case "invert":
      return "Invert Colors";
    case "color-replacement":
      return "Replace Color";
    case "auto-enhance":
      return "Auto Enhance";
    default:
      return "Apply";
  }
}

function getFilterString(
  mode: ColorFilterMode,
  value: number,
  autoStrength: number,
): string {
  if (mode === "brightness") {
    return `brightness(${100 + value}%)`;
  }
  if (mode === "contrast") {
    return `contrast(${100 + value}%)`;
  }
  if (mode === "saturation") {
    return `saturate(${100 + value}%)`;
  }
  if (mode === "hue") {
    return `hue-rotate(${value}deg)`;
  }
  if (mode === "grayscale") {
    return "grayscale(100%)";
  }
  if (mode === "sepia") {
    return "sepia(100%)";
  }
  if (mode === "invert") {
    return "invert(100%)";
  }
  if (mode === "auto-enhance") {
    const normalized = clamp(autoStrength, 0, 100);
    const brightness = 100 + normalized * 0.12;
    const contrast = 100 + normalized * 0.35;
    const saturation = 100 + normalized * 0.45;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  }
  return "none";
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

function FilterIcon() {
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
      <path d="M3 4h18" />
      <path d="M5 9h14" />
      <path d="M8 14h8" />
      <path d="M10 19h4" />
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

export default function ColorFilterTool({ mode }: ColorFilterToolProps) {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [isApplying, setIsApplying] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState("");
  const [outputWidth, setOutputWidth] = useState(0);
  const [outputHeight, setOutputHeight] = useState(0);

  const [value, setValue] = useState(0);
  const [autoStrength, setAutoStrength] = useState(62);
  const [sourceColor, setSourceColor] = useState("#ffffff");
  const [targetColor, setTargetColor] = useState("#00ff8c");
  const [tolerance, setTolerance] = useState(62);
  const [softness, setSoftness] = useState(24);

  useEffect(() => {
    return () => {
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [outputUrl]);

  useEffect(() => {
    setValue(0);
    setAutoStrength(62);
    setSourceColor("#ffffff");
    setTargetColor("#00ff8c");
    setTolerance(62);
    setSoftness(24);
    setError(null);
    setOutputBlob(null);
    setOutputWidth(0);
    setOutputHeight(0);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl("");
    }
  }, [mode, outputUrl]);

  const toolLabel = getModeLabel(mode);
  const actionLabel = getModeButtonLabel(mode);

  const downloadFileName = useMemo(() => {
    if (!sourceFile) {
      return `img0-${mode}.${outputFormat}`;
    }
    return outputName(sourceFile.name, outputFormat, mode);
  }, [mode, outputFormat, sourceFile]);

  const sliderConfig = useMemo(() => {
    if (mode === "brightness") {
      return {
        label: `Brightness: ${value}`,
        min: -100,
        max: 100,
        step: 1,
      };
    }
    if (mode === "contrast") {
      return {
        label: `Contrast: ${value}`,
        min: -100,
        max: 100,
        step: 1,
      };
    }
    if (mode === "saturation") {
      return {
        label: `Saturation: ${value}`,
        min: -100,
        max: 100,
        step: 1,
      };
    }
    if (mode === "hue") {
      return {
        label: `Hue Shift: ${value}°`,
        min: -180,
        max: 180,
        step: 1,
      };
    }
    return null;
  }, [mode, value]);

  function clearOutput() {
    setOutputBlob(null);
    setOutputWidth(0);
    setOutputHeight(0);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl("");
    }
  }

  async function handleSourceFile(file: File | null) {
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
    setOutputFormat(inferFormatFromMime(file.type));
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
        setError("Failed to read this image. Try another file.");
      }
    };
    reader.onerror = () => setError("Failed to read this image.");
    reader.readAsDataURL(file);
  }

  function applyColorReplacement(imageData: ImageData) {
    const from = hexToRgb(sourceColor);
    const to = hexToRgb(targetColor);
    const data = imageData.data;
    const safeTolerance = clamp(tolerance, 0, 255);
    const safeSoftness = clamp(softness, 0, 100);
    const softnessRadius = (safeSoftness / 100) * 255;

    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const dr = r - from.r;
      const dg = g - from.g;
      const db = b - from.b;
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);

      if (distance > safeTolerance + softnessRadius) {
        continue;
      }

      let blend = 1;
      if (distance > safeTolerance && softnessRadius > 0) {
        const edgeDistance = distance - safeTolerance;
        blend = 1 - clamp(edgeDistance / softnessRadius, 0, 1);
      }

      data[index] = Math.round(r + (to.r - r) * blend);
      data[index + 1] = Math.round(g + (to.g - g) * blend);
      data[index + 2] = Math.round(b + (to.b - b) * blend);
    }
  }

  async function handleApplyFilter() {
    if (!sourceDataUrl || sourceWidth <= 0 || sourceHeight <= 0) {
      setError("Upload an image first.");
      return;
    }

    setError(null);
    setIsApplying(true);
    try {
      const source = await createImageFromDataUrl(sourceDataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas unavailable");
      }

      if (outputFormat === "jpg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (mode === "color-replacement") {
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        applyColorReplacement(imageData);
        ctx.putImageData(imageData, 0, 0);
      } else {
        const filter = getFilterString(mode, value, autoStrength);
        ctx.filter = filter;
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";
      }

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
      setOutputWidth(canvas.width);
      setOutputHeight(canvas.height);
    } catch {
      setError("Processing failed. Try another image or settings.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor={`color-filter-input-${mode}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            void handleSourceFile(file);
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
          <input
            id={`color-filter-input-${mode}`}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handleSourceFile(file);
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

        {sliderConfig ? (
          <label className="mt-5 block text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {sliderConfig.label}
            </span>
            <input
              type="range"
              min={sliderConfig.min}
              max={sliderConfig.max}
              step={sliderConfig.step}
              value={value}
              onChange={(event) => {
                setValue(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>
        ) : null}

        {mode === "auto-enhance" ? (
          <label className="mt-5 block text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Enhance strength: {autoStrength}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={autoStrength}
              onChange={(event) => {
                setAutoStrength(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>
        ) : null}

        {mode === "color-replacement" ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Replace from
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2">
                <input
                  type="color"
                  value={sourceColor}
                  onChange={(event) => {
                    setSourceColor(event.target.value);
                    clearOutput();
                  }}
                  className="h-8 w-10 cursor-pointer rounded border-none bg-transparent p-0"
                />
                <span className="text-xs text-[var(--text-secondary)]">{sourceColor}</span>
              </div>
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Replace to
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2">
                <input
                  type="color"
                  value={targetColor}
                  onChange={(event) => {
                    setTargetColor(event.target.value);
                    clearOutput();
                  }}
                  className="h-8 w-10 cursor-pointer rounded border-none bg-transparent p-0"
                />
                <span className="text-xs text-[var(--text-secondary)]">{targetColor}</span>
              </div>
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Tolerance: {tolerance}
              </span>
              <input
                type="range"
                min={0}
                max={255}
                step={1}
                value={tolerance}
                onChange={(event) => {
                  setTolerance(Number(event.target.value));
                  clearOutput();
                }}
                className="mt-2 w-full cursor-pointer"
              />
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Softness: {softness}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={softness}
                onChange={(event) => {
                  setSoftness(Number(event.target.value));
                  clearOutput();
                }}
                className="mt-2 w-full cursor-pointer"
              />
            </label>
          </div>
        ) : null}

        {mode === "grayscale" || mode === "sepia" || mode === "invert" ? (
          <p className="mt-4 text-xs text-[var(--text-secondary)]">
            Instant filter mode. Click apply to generate output.
          </p>
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
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
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
            onClick={() => void handleApplyFilter()}
            disabled={!sourceDataUrl || isApplying}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceDataUrl && !isApplying
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isApplying ? null : <FilterIcon />}
            {isApplying ? "Applying..." : actionLabel}
          </button>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">{toolLabel} Preview</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Original</p>
            <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              {!sourceDataUrl ? (
                <p className="text-center text-xs text-[var(--text-secondary)]">
                  Upload an image first.
                </p>
              ) : (
                <Image
                  src={sourceDataUrl}
                  alt="Original preview"
                  width={Math.max(sourceWidth, 1)}
                  height={Math.max(sourceHeight, 1)}
                  unoptimized
                  className="h-auto max-h-[200px] w-auto max-w-full rounded-md"
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Filtered</p>
            <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              {!outputUrl ? (
                <p className="text-center text-xs text-[var(--text-secondary)]">
                  Apply filter to preview output.
                </p>
              ) : (
                <Image
                  src={outputUrl}
                  alt={`${toolLabel} output preview`}
                  width={Math.max(outputWidth, 1)}
                  height={Math.max(outputHeight, 1)}
                  unoptimized
                  className="h-auto max-h-[200px] w-auto max-w-full rounded-md"
                />
              )}
            </div>
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
              {downloadFileName} • {formatBytes(outputBlob.size)} • {outputWidth} x{" "}
              {outputHeight}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

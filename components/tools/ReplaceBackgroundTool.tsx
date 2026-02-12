"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";
type BackgroundFitMode = "cover" | "contain" | "stretch";

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
  return `${base || "img0-image"}-replaced-bg.${format}`;
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

function createImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = url;
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

function drawBackgroundWithFit(
  ctx: CanvasRenderingContext2D,
  background: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  fitMode: BackgroundFitMode,
  scalePercent: number,
  offsetXPercent: number,
  offsetYPercent: number,
) {
  const safeScale = clamp(scalePercent, 30, 220) / 100;
  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;

  if (fitMode === "stretch") {
    drawWidth = canvasWidth * safeScale;
    drawHeight = canvasHeight * safeScale;
  } else {
    const ratioX = canvasWidth / background.naturalWidth;
    const ratioY = canvasHeight / background.naturalHeight;
    const baseScale = fitMode === "cover" ? Math.max(ratioX, ratioY) : Math.min(ratioX, ratioY);
    drawWidth = background.naturalWidth * baseScale * safeScale;
    drawHeight = background.naturalHeight * baseScale * safeScale;
  }

  const centerX = (canvasWidth - drawWidth) / 2;
  const centerY = (canvasHeight - drawHeight) / 2;
  const offsetLimitX = Math.abs(canvasWidth - drawWidth) / 2;
  const offsetLimitY = Math.abs(canvasHeight - drawHeight) / 2;

  const x = centerX + (offsetLimitX * clamp(offsetXPercent, -100, 100)) / 100;
  const y = centerY + (offsetLimitY * clamp(offsetYPercent, -100, 100)) / 100;

  ctx.drawImage(background, x, y, drawWidth, drawHeight);
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

function ReplaceIcon() {
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
      <path d="M4 4h16v16H4z" />
      <path d="m8 8 3 3-3 3" />
      <path d="m16 16-3-3 3-3" />
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

export default function ReplaceBackgroundTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);

  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundDataUrl, setBackgroundDataUrl] = useState("");
  const [backgroundWidth, setBackgroundWidth] = useState(0);
  const [backgroundHeight, setBackgroundHeight] = useState(0);

  const [cutoutBlob, setCutoutBlob] = useState<Blob | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState("");
  const [cutoutWidth, setCutoutWidth] = useState(0);
  const [cutoutHeight, setCutoutHeight] = useState(0);

  const [fitMode, setFitMode] = useState<BackgroundFitMode>("cover");
  const [backgroundScale, setBackgroundScale] = useState(100);
  const [backgroundOffsetX, setBackgroundOffsetX] = useState(0);
  const [backgroundOffsetY, setBackgroundOffsetY] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpg");
  const [quality, setQuality] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSourceDragActive, setIsSourceDragActive] = useState(false);
  const [isBackgroundDragActive, setIsBackgroundDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState("");
  const [outputWidth, setOutputWidth] = useState(0);
  const [outputHeight, setOutputHeight] = useState(0);

  useEffect(() => {
    return () => {
      if (cutoutUrl) {
        URL.revokeObjectURL(cutoutUrl);
      }
    };
  }, [cutoutUrl]);

  useEffect(() => {
    return () => {
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [outputUrl]);

  const downloadFileName = useMemo(() => {
    if (!sourceFile) {
      return `img0-replaced-bg.${outputFormat}`;
    }
    return outputName(sourceFile.name, outputFormat);
  }, [sourceFile, outputFormat]);

  function clearOutput() {
    setOutputBlob(null);
    setOutputWidth(0);
    setOutputHeight(0);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl("");
    }
  }

  function clearCutoutAndOutput() {
    setCutoutBlob(null);
    setCutoutWidth(0);
    setCutoutHeight(0);
    if (cutoutUrl) {
      URL.revokeObjectURL(cutoutUrl);
      setCutoutUrl("");
    }
    clearOutput();
  }

  async function handleSourceFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid source image file.");
      return;
    }

    setError(null);
    setSourceFile(file);
    setSourceDataUrl("");
    setSourceWidth(0);
    setSourceHeight(0);
    setOutputFormat(inferFormatFromMime(file.type));
    clearCutoutAndOutput();

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
        setError("Failed to read source image. Try another file.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read source image.");
    };
    reader.readAsDataURL(file);
  }

  async function handleBackgroundFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid background image file.");
      return;
    }

    setError(null);
    setBackgroundFile(file);
    setBackgroundDataUrl("");
    setBackgroundWidth(0);
    setBackgroundHeight(0);
    clearOutput();

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = String(reader.result ?? "");
        const image = await createImageFromDataUrl(dataUrl);
        setBackgroundDataUrl(dataUrl);
        setBackgroundWidth(image.naturalWidth);
        setBackgroundHeight(image.naturalHeight);
      } catch {
        setBackgroundDataUrl("");
        setBackgroundWidth(0);
        setBackgroundHeight(0);
        setError("Failed to read background image. Try another file.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read background image.");
    };
    reader.readAsDataURL(file);
  }

  async function ensureCutout(): Promise<string> {
    if (cutoutUrl) {
      return cutoutUrl;
    }

    if (!sourceFile) {
      throw new Error("Missing source file");
    }

    const { removeBackground } = await import("@imgly/background-removal");
    const resultBlob = await removeBackground(sourceFile);
    const url = URL.createObjectURL(resultBlob);
    const image = await createImageFromUrl(url);

    setCutoutBlob(resultBlob);
    setCutoutUrl(url);
    setCutoutWidth(image.naturalWidth);
    setCutoutHeight(image.naturalHeight);

    return url;
  }

  async function handleReplaceBackground() {
    if (!sourceDataUrl || !sourceFile) {
      setError("Upload a source image first.");
      return;
    }

    if (!backgroundDataUrl) {
      setError("Upload a background image first.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const source = await createImageFromDataUrl(sourceDataUrl);
      const background = await createImageFromDataUrl(backgroundDataUrl);
      const cutoutCurrentUrl = await ensureCutout();
      const cutout = await createImageFromUrl(cutoutCurrentUrl);

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

      drawBackgroundWithFit(
        ctx,
        background,
        canvas.width,
        canvas.height,
        fitMode,
        backgroundScale,
        backgroundOffsetX,
        backgroundOffsetY,
      );
      ctx.drawImage(cutout, 0, 0, canvas.width, canvas.height);

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
      setError("Replace background failed. Try a clearer source image.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="replace-bg-source-input-file"
          onDragOver={(event) => {
            event.preventDefault();
            setIsSourceDragActive(true);
          }}
          onDragLeave={() => setIsSourceDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsSourceDragActive(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            void handleSourceFile(file);
          }}
          className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition ${
            isSourceDragActive
              ? "border-[var(--text-primary)] bg-[var(--surface-strong)]"
              : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-strong)]"
          }`}
        >
          <div className="mb-2 inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-secondary)]">
            <UploadIcon />
          </div>
          <p className="text-sm font-semibold">Upload source image</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Subject photo you want to keep
          </p>
          <input
            id="replace-bg-source-input-file"
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

        <label
          htmlFor="replace-bg-background-input-file"
          onDragOver={(event) => {
            event.preventDefault();
            setIsBackgroundDragActive(true);
          }}
          onDragLeave={() => setIsBackgroundDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsBackgroundDragActive(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            void handleBackgroundFile(file);
          }}
          className={`mt-4 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition ${
            isBackgroundDragActive
              ? "border-[var(--text-primary)] bg-[var(--surface-strong)]"
              : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-strong)]"
          }`}
        >
          <div className="mb-2 inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-secondary)]">
            <UploadIcon />
          </div>
          <p className="text-sm font-semibold">Upload new background</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Image to place behind your subject
          </p>
          <input
            id="replace-bg-background-input-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handleBackgroundFile(file);
            }}
          />
        </label>

        {backgroundFile ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="text-sm font-medium">{backgroundFile.name}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {formatBytes(backgroundFile.size)} • {backgroundWidth} x {backgroundHeight}
            </p>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-[var(--text-secondary)]">
          First run may be slower while subject cutout gets generated in-browser.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Background fit
            </span>
            <select
              value={fitMode}
              onChange={(event) => {
                setFitMode(event.target.value as BackgroundFitMode);
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="stretch">Stretch</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Background scale: {backgroundScale}%
            </span>
            <input
              type="range"
              min={30}
              max={220}
              step={1}
              value={backgroundScale}
              onChange={(event) => {
                setBackgroundScale(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Background X: {backgroundOffsetX}
            </span>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={backgroundOffsetX}
              onChange={(event) => {
                setBackgroundOffsetX(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Background Y: {backgroundOffsetY}
            </span>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={backgroundOffsetY}
              onChange={(event) => {
                setBackgroundOffsetY(Number(event.target.value));
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
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
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
            onClick={() => void handleReplaceBackground()}
            disabled={!sourceDataUrl || !backgroundDataUrl || isProcessing}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceDataUrl && backgroundDataUrl && !isProcessing
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isProcessing ? null : <ReplaceIcon />}
            {isProcessing ? "Processing..." : "Replace Background"}
          </button>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Preview</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Source</p>
            <div className="flex min-h-[170px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              {!sourceDataUrl ? (
                <p className="text-center text-xs text-[var(--text-secondary)]">Upload source.</p>
              ) : (
                <Image
                  src={sourceDataUrl}
                  alt="Source preview"
                  width={Math.max(sourceWidth, 1)}
                  height={Math.max(sourceHeight, 1)}
                  unoptimized
                  className="h-auto max-h-[150px] w-auto max-w-full rounded-md"
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Background</p>
            <div className="flex min-h-[170px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              {!backgroundDataUrl ? (
                <p className="text-center text-xs text-[var(--text-secondary)]">
                  Upload background.
                </p>
              ) : (
                <Image
                  src={backgroundDataUrl}
                  alt="Background preview"
                  width={Math.max(backgroundWidth, 1)}
                  height={Math.max(backgroundHeight, 1)}
                  unoptimized
                  className="h-auto max-h-[150px] w-auto max-w-full rounded-md"
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
              Replaced Result
            </p>
            <div className="flex min-h-[170px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              {!outputUrl ? (
                <p className="text-center text-xs text-[var(--text-secondary)]">
                  Run replace background.
                </p>
              ) : (
                <Image
                  src={outputUrl}
                  alt="Replaced background preview"
                  width={Math.max(outputWidth, 1)}
                  height={Math.max(outputHeight, 1)}
                  unoptimized
                  className="h-auto max-h-[150px] w-auto max-w-full rounded-md"
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
          {cutoutBlob && !outputBlob ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Subject cutout ready: {formatBytes(cutoutBlob.size)} • {cutoutWidth} x{" "}
              {cutoutHeight}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

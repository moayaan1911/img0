"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import {
  canvasToBlob,
  createCanvas,
  fileToImage,
  formatFileSize,
} from "@/src/lib/image-utils";

type BackgroundMode = "gradient" | "solid" | "image";
type FrameMode = "browser" | "phone" | "tablet" | "none";

type FrameMetrics = {
  frameBorder: number;
  topChrome: number;
  outerRadius: number;
  screenRadius: number;
  frameFill: string;
  frameStroke: string;
};

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function buildFrameMetrics(
  frameMode: FrameMode,
  baseRadius: number,
  imageWidth: number,
): FrameMetrics {
  if (frameMode === "none") {
    return {
      frameBorder: 0,
      topChrome: 0,
      outerRadius: baseRadius,
      screenRadius: baseRadius,
      frameFill: "transparent",
      frameStroke: "transparent",
    };
  }

  if (frameMode === "browser") {
    return {
      frameBorder: 2,
      topChrome: 42,
      outerRadius: Math.max(12, baseRadius),
      screenRadius: Math.max(8, Math.floor(baseRadius * 0.65)),
      frameFill: "#f8fafc",
      frameStroke: "#cbd5e1",
    };
  }

  if (frameMode === "phone") {
    const border = Math.max(14, Math.min(26, Math.round(imageWidth * 0.04)));
    return {
      frameBorder: border,
      topChrome: Math.round(border * 1.25),
      outerRadius: Math.max(30, baseRadius),
      screenRadius: Math.max(20, Math.floor(baseRadius * 0.8)),
      frameFill: "#09090b",
      frameStroke: "#27272a",
    };
  }

  const border = Math.max(10, Math.min(20, Math.round(imageWidth * 0.03)));
  return {
    frameBorder: border,
    topChrome: Math.round(border * 0.75),
    outerRadius: Math.max(20, baseRadius),
    screenRadius: Math.max(14, Math.floor(baseRadius * 0.75)),
    frameFill: "#111827",
    frameStroke: "#334155",
  };
}

async function writeBlobToClipboard(blob: Blob): Promise<void> {
  if (
    typeof navigator === "undefined" ||
    typeof window === "undefined" ||
    !navigator.clipboard ||
    typeof window.ClipboardItem === "undefined"
  ) {
    throw new Error("Clipboard image copy is not supported in this browser.");
  }

  const clipboardItem = new window.ClipboardItem({ [blob.type]: blob });
  await navigator.clipboard.write([clipboardItem]);
}

export default function ScreenshotBeautifierTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("gradient");
  const [frameMode, setFrameMode] = useState<FrameMode>("browser");
  const [gradientA, setGradientA] = useState("#1d4ed8");
  const [gradientB, setGradientB] = useState("#06b6d4");
  const [solidColor, setSolidColor] = useState("#111827");
  const [padding, setPadding] = useState(72);
  const [radius, setRadius] = useState(26);
  const [shadow, setShadow] = useState(36);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceUrlRef = useRef<string | null>(null);
  const bgImageUrlRef = useRef<string | null>(null);
  const outputUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
      if (bgImageUrlRef.current) {
        URL.revokeObjectURL(bgImageUrlRef.current);
      }
      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }
    };
  }, []);

  const outputName = useMemo(() => {
    if (!sourceFile) {
      return "beautified-screenshot.png";
    }
    const baseName = sourceFile.name.replace(/\.[^.]+$/u, "");
    return `${baseName}-beautified.png`;
  }, [sourceFile]);

  const clearOutput = () => {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = null;
    }
    setOutputBlob(null);
    setOutputUrl(null);
    setCopyMessage(null);
  };

  const handleSourceSelect = (file: File) => {
    setErrorMessage(null);
    clearOutput();

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    sourceUrlRef.current = nextUrl;
    setSourceFile(file);
    setSourceUrl(nextUrl);
  };

  const handleBackgroundSelect = (file: File) => {
    setErrorMessage(null);
    clearOutput();

    if (bgImageUrlRef.current) {
      URL.revokeObjectURL(bgImageUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    bgImageUrlRef.current = nextUrl;
    setBgImageFile(file);
  };

  const handleGenerate = async () => {
    if (!sourceFile) {
      return;
    }

    if (backgroundMode === "image" && !bgImageFile) {
      setErrorMessage("Upload a background image or switch to solid/gradient mode.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setCopyMessage(null);

    try {
      const screenshotImage = await fileToImage(sourceFile);
      const backgroundImage =
        backgroundMode === "image" && bgImageFile ? await fileToImage(bgImageFile) : null;

      const frameMetrics = buildFrameMetrics(frameMode, radius, screenshotImage.width);
      const frameWidth = screenshotImage.width + frameMetrics.frameBorder * 2;
      const frameHeight =
        screenshotImage.height + frameMetrics.frameBorder * 2 + frameMetrics.topChrome;
      const canvasWidth = frameWidth + padding * 2;
      const canvasHeight = frameHeight + padding * 2;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      if (backgroundMode === "solid") {
        context.fillStyle = solidColor;
        context.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (backgroundMode === "gradient") {
        const gradient = context.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        gradient.addColorStop(0, gradientA);
        gradient.addColorStop(1, gradientB);
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (backgroundImage) {
        const coverScale = Math.max(
          canvasWidth / backgroundImage.width,
          canvasHeight / backgroundImage.height,
        );
        const drawWidth = backgroundImage.width * coverScale;
        const drawHeight = backgroundImage.height * coverScale;
        const drawX = (canvasWidth - drawWidth) / 2;
        const drawY = (canvasHeight - drawHeight) / 2;
        context.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
        context.fillStyle = "rgba(9, 9, 11, 0.16)";
        context.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      const frameX = padding;
      const frameY = padding;

      context.save();
      context.shadowColor = "rgba(15, 23, 42, 0.35)";
      context.shadowBlur = shadow;
      context.shadowOffsetY = Math.max(8, Math.round(shadow / 4));
      if (frameMode === "none") {
        roundedRect(
          context,
          frameX,
          frameY,
          screenshotImage.width,
          screenshotImage.height,
          frameMetrics.outerRadius,
        );
        context.fillStyle = "white";
        context.fill();
      } else {
        roundedRect(context, frameX, frameY, frameWidth, frameHeight, frameMetrics.outerRadius);
        context.fillStyle = frameMetrics.frameFill;
        context.fill();
        context.shadowColor = "transparent";
        context.lineWidth = 2;
        context.strokeStyle = frameMetrics.frameStroke;
        context.stroke();
      }
      context.restore();

      if (frameMode === "browser") {
        context.fillStyle = "#e2e8f0";
        roundedRect(context, frameX + 1, frameY + 1, frameWidth - 2, frameMetrics.topChrome, 12);
        context.fill();
        const dotY = frameY + frameMetrics.topChrome / 2;
        const dots = ["#ef4444", "#f59e0b", "#22c55e"];
        dots.forEach((color, index) => {
          context.fillStyle = color;
          context.beginPath();
          context.arc(frameX + 18 + index * 14, dotY, 4.2, 0, Math.PI * 2);
          context.fill();
        });
      }

      if (frameMode === "phone") {
        context.fillStyle = "#18181b";
        roundedRect(
          context,
          frameX + frameWidth / 2 - 52,
          frameY + 8,
          104,
          14,
          7,
        );
        context.fill();
      }

      if (frameMode === "tablet") {
        context.fillStyle = "#94a3b8";
        context.beginPath();
        context.arc(frameX + frameWidth / 2, frameY + 10, 3.2, 0, Math.PI * 2);
        context.fill();
      }

      const screenshotX = frameX + frameMetrics.frameBorder;
      const screenshotY = frameY + frameMetrics.frameBorder + frameMetrics.topChrome;
      const screenshotW = screenshotImage.width;
      const screenshotH = screenshotImage.height;

      context.save();
      roundedRect(
        context,
        screenshotX,
        screenshotY,
        screenshotW,
        screenshotH,
        frameMetrics.screenRadius,
      );
      context.clip();
      context.drawImage(screenshotImage, screenshotX, screenshotY, screenshotW, screenshotH);
      context.restore();

      const resultBlob = await canvasToBlob(canvas, "image/png", 0.92);
      clearOutput();
      setOutputBlob(resultBlob);
      const nextOutputUrl = URL.createObjectURL(resultBlob);
      outputUrlRef.current = nextOutputUrl;
      setOutputUrl(nextOutputUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to beautify screenshot.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!outputBlob) {
      return;
    }

    setIsCopying(true);
    setErrorMessage(null);
    setCopyMessage(null);

    try {
      await writeBlobToClipboard(outputBlob);
      setCopyMessage("Image copied to clipboard.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to copy image to clipboard.";
      setErrorMessage(message);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 3 • Text & Overlay
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Screenshot Beautifier
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Add polished backgrounds, frame mockups, padding, and export clean social-ready
          screenshots.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Rendering screenshot..." />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload Screenshot
            </h2>
            <ImageUploader
              onFileSelect={handleSourceSelect}
              title="Drop screenshot"
              description="PNG/JPG/WebP screenshot files are supported."
            />
            {sourceFile ? (
              <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs sm:grid-cols-2">
                <div>
                  <p className="text-[var(--text-secondary)]">File</p>
                  <p className="mt-1 truncate font-medium">{sourceFile.name}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Size</p>
                  <p className="mt-1 font-medium">{formatFileSize(sourceFile.size)}</p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Style Controls
            </h2>

            <label className="block text-xs text-[var(--text-secondary)]">
              Background Style
              <select
                value={backgroundMode}
                onChange={(event) => setBackgroundMode(event.target.value as BackgroundMode)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="gradient">Gradient</option>
                <option value="solid">Solid</option>
                <option value="image">Background Image</option>
              </select>
            </label>

            {backgroundMode === "gradient" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-[var(--text-secondary)]">
                  Gradient A
                  <input
                    type="color"
                    value={gradientA}
                    onChange={(event) => setGradientA(event.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Gradient B
                  <input
                    type="color"
                    value={gradientB}
                    onChange={(event) => setGradientB(event.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                  />
                </label>
              </div>
            ) : null}

            {backgroundMode === "solid" ? (
              <label className="block text-xs text-[var(--text-secondary)]">
                Solid Color
                <input
                  type="color"
                  value={solidColor}
                  onChange={(event) => setSolidColor(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                />
              </label>
            ) : null}

            {backgroundMode === "image" ? (
              <ImageUploader
                onFileSelect={handleBackgroundSelect}
                title="Drop background image"
                description="Used as full-canvas backdrop behind your screenshot."
              />
            ) : null}

            <label className="block text-xs text-[var(--text-secondary)]">
              Device Frame
              <select
                value={frameMode}
                onChange={(event) => setFrameMode(event.target.value as FrameMode)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="browser">Browser</option>
                <option value="phone">Phone</option>
                <option value="tablet">Tablet</option>
                <option value="none">No Frame</option>
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs text-[var(--text-secondary)]">
                Padding: {padding}px
                <input
                  type="range"
                  min={16}
                  max={220}
                  value={padding}
                  onChange={(event) => setPadding(Number(event.target.value))}
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Radius: {radius}px
                <input
                  type="range"
                  min={0}
                  max={64}
                  value={radius}
                  onChange={(event) => setRadius(Number(event.target.value))}
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Shadow: {shadow}
                <input
                  type="range"
                  min={0}
                  max={90}
                  value={shadow}
                  onChange={(event) => setShadow(Number(event.target.value))}
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={!sourceFile || isProcessing}
                className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate Output
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!outputBlob || isCopying}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCopying ? "Copying..." : "Copy to Clipboard"}
              </button>
            </div>
          </section>

          {copyMessage ? (
            <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
              {copyMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="space-y-5">
          <ImagePreview
            title="Original"
            imageUrl={sourceUrl}
            emptyDescription="Upload a screenshot to preview the source."
          />
          <ImagePreview
            title="Beautified Output"
            imageUrl={outputUrl}
            emptyDescription="Generated screenshot output appears here."
          />
          <DownloadButton
            blob={outputBlob}
            fileName={outputName}
            label="Download Screenshot"
            disabledReason="Generate output first."
          />
        </div>
      </div>
    </section>
  );
}

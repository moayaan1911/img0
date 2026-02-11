"use client";

import { useEffect, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, fileToImage } from "@/src/lib/image-utils";

function roundedRectPath(
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

export default function RoundCornersTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [radius, setRadius] = useState(36);
  const [circleCrop, setCircleCrop] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceUrlRef = useRef<string | null>(null);
  const outputUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }
    };
  }, []);

  const clearOutput = () => {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = null;
    }
    setOutputBlob(null);
    setOutputUrl(null);
  };

  const handleFileSelect = (file: File) => {
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

  const handleApplyCorners = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const image = await fileToImage(sourceFile);
      const targetWidth = circleCrop ? Math.min(image.width, image.height) : image.width;
      const targetHeight = circleCrop ? Math.min(image.width, image.height) : image.height;
      const offsetX = circleCrop ? (image.width - targetWidth) / 2 : 0;
      const offsetY = circleCrop ? (image.height - targetHeight) / 2 : 0;

      const canvas = createCanvas(targetWidth, targetHeight);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.save();
      if (circleCrop) {
        context.beginPath();
        context.arc(targetWidth / 2, targetHeight / 2, targetWidth / 2, 0, Math.PI * 2);
        context.closePath();
      } else {
        roundedRectPath(context, 0, 0, targetWidth, targetHeight, radius);
      }
      context.clip();
      context.drawImage(image, offsetX, offsetY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
      context.restore();

      const blob = await canvasToBlob(canvas, "image/png", 0.92);
      clearOutput();
      const nextUrl = URL.createObjectURL(blob);
      outputUrlRef.current = nextUrl;
      setOutputBlob(blob);
      setOutputUrl(nextUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply round corners.";
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
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Round Corners</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Apply rounded corners or circle crop with transparent PNG output.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Applying rounded mask..." />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload
            </h2>
            <ImageUploader onFileSelect={handleFileSelect} />
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Corner Settings
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Radius: {radius}px
              <input
                type="range"
                min={0}
                max={320}
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                disabled={circleCrop}
                className="mt-1 w-full accent-[var(--text-primary)] disabled:opacity-40"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={circleCrop}
                onChange={(event) => setCircleCrop(event.target.checked)}
              />
              Circle crop (ignores radius slider)
            </label>
            <button
              type="button"
              onClick={() => void handleApplyCorners()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply
            </button>
          </section>

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
            emptyDescription="Upload an image to round corners."
          />
          <ImagePreview
            title="Rounded Output"
            imageUrl={outputUrl}
            emptyDescription="Processed output appears here."
          />
          <DownloadButton
            blob={outputBlob}
            fileName="round-corners-output.png"
            label="Download PNG"
            disabledReason="Apply rounded corners first."
          />
        </div>
      </div>
    </section>
  );
}

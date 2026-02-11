"use client";

import { useEffect, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, fileToImage } from "@/src/lib/image-utils";

function mix(from: number, to: number, factor: number): number {
  return from + (to - from) * factor;
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(mix(a[0], b[0], t)),
    Math.round(mix(a[1], b[1], t)),
    Math.round(mix(a[2], b[2], t)),
  ];
}

export default function ColorizeTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [strength, setStrength] = useState(70);
  const [warmth, setWarmth] = useState(30);
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

  const handleColorize = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const image = await fileToImage(sourceFile);
      const canvas = createCanvas(image.width, image.height);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      const warmthBias = warmth / 100;
      const shadowColor: [number, number, number] = [
        Math.round(mix(65, 100, warmthBias)),
        Math.round(mix(92, 82, warmthBias)),
        Math.round(mix(148, 120, warmthBias)),
      ];
      const midColor: [number, number, number] = [
        Math.round(mix(128, 196, warmthBias)),
        Math.round(mix(132, 145, warmthBias)),
        Math.round(mix(142, 92, warmthBias)),
      ];
      const lightColor: [number, number, number] = [
        Math.round(mix(194, 246, warmthBias)),
        Math.round(mix(202, 226, warmthBias)),
        Math.round(mix(210, 180, warmthBias)),
      ];

      const blendStrength = strength / 100;

      for (let index = 0; index < data.length; index += 4) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];

        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        let mapped: [number, number, number];
        if (luminance < 0.5) {
          mapped = lerpColor(shadowColor, midColor, luminance / 0.5);
        } else {
          mapped = lerpColor(midColor, lightColor, (luminance - 0.5) / 0.5);
        }

        data[index] = Math.round(mix(r, mapped[0], blendStrength));
        data[index + 1] = Math.round(mix(g, mapped[1], blendStrength));
        data[index + 2] = Math.round(mix(b, mapped[2], blendStrength));
        data[index + 3] = alpha;
      }

      context.putImageData(imageData, 0, 0);
      const blob = await canvasToBlob(canvas, "image/png", 0.92);
      clearOutput();
      const nextUrl = URL.createObjectURL(blob);
      outputUrlRef.current = nextUrl;
      setOutputBlob(blob);
      setOutputUrl(nextUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to colorize image.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 7 • AI
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          AI Colorize B&W
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Colorize monochrome photos in-browser with adjustable strength and warmth.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Colorizing image..." />

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
              2. Colorize Controls
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Strength: {strength}%
              <input
                type="range"
                min={0}
                max={100}
                value={strength}
                onChange={(event) => setStrength(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
            <label className="block text-xs text-[var(--text-secondary)]">
              Warmth: {warmth}
              <input
                type="range"
                min={-40}
                max={60}
                value={warmth}
                onChange={(event) => setWarmth(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleColorize()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Colorize
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
            title="Before"
            imageUrl={sourceUrl}
            emptyDescription="Upload image to preview source."
          />
          <ImagePreview
            title="Colorized"
            imageUrl={outputUrl}
            emptyDescription="Colorized output appears here."
          />
          <DownloadButton
            blob={outputBlob}
            fileName="colorized-output.png"
            label="Download Colorized Image"
            disabledReason="Colorize image first."
          />
        </div>
      </div>
    </section>
  );
}

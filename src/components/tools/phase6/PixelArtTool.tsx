"use client";

import { useEffect, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, fileToImage } from "@/src/lib/image-utils";

function quantizeChannel(value: number, levels: number): number {
  if (levels <= 1) {
    return value;
  }
  const step = 255 / (levels - 1);
  return Math.round(value / step) * step;
}

export default function PixelArtTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState(10);
  const [paletteLevels, setPaletteLevels] = useState(16);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
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

  const handleGenerate = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const image = await fileToImage(sourceFile);
      const downWidth = Math.max(1, Math.round(image.width / pixelSize));
      const downHeight = Math.max(1, Math.round(image.height / pixelSize));

      const downCanvas = createCanvas(downWidth, downHeight);
      const downContext = downCanvas.getContext("2d");
      if (!downContext) {
        throw new Error("Canvas context is not available in this browser.");
      }
      downContext.imageSmoothingEnabled = false;
      downContext.drawImage(image, 0, 0, downWidth, downHeight);

      const pixels = downContext.getImageData(0, 0, downWidth, downHeight);
      for (let index = 0; index < pixels.data.length; index += 4) {
        pixels.data[index] = quantizeChannel(pixels.data[index], paletteLevels);
        pixels.data[index + 1] = quantizeChannel(pixels.data[index + 1], paletteLevels);
        pixels.data[index + 2] = quantizeChannel(pixels.data[index + 2], paletteLevels);
      }
      downContext.putImageData(pixels, 0, 0);

      const upCanvas = createCanvas(image.width, image.height);
      const upContext = upCanvas.getContext("2d");
      if (!upContext) {
        throw new Error("Canvas context is not available in this browser.");
      }
      upContext.imageSmoothingEnabled = false;
      upContext.drawImage(downCanvas, 0, 0, image.width, image.height);

      const blob = await canvasToBlob(upCanvas, "image/png", 0.92);
      clearOutput();
      const nextUrl = URL.createObjectURL(blob);
      outputUrlRef.current = nextUrl;
      setOutputBlob(blob);
      setOutputUrl(nextUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create pixel art.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 6 • Creative
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Pixel Art Converter
        </h1>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Pixelating image..." />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload
            </h2>
            <ImageUploader onFileSelect={handleFileSelect} />
          </section>
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Settings
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Pixel Size: {pixelSize}
              <input
                type="range"
                min={2}
                max={40}
                value={pixelSize}
                onChange={(event) => setPixelSize(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
            <label className="block text-xs text-[var(--text-secondary)]">
              Palette Levels: {paletteLevels}
              <input
                type="range"
                min={2}
                max={32}
                value={paletteLevels}
                onChange={(event) => setPaletteLevels(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate Pixel Art
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
            emptyDescription="Upload image to convert into pixel art."
          />
          <ImagePreview
            title="Pixel Art"
            imageUrl={outputUrl}
            emptyDescription="Generated pixel art appears here."
          />
          <DownloadButton
            blob={outputBlob}
            fileName="pixel-art-output.png"
            label="Download Pixel Art"
            disabledReason="Generate pixel art first."
          />
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, fileToImage } from "@/src/lib/image-utils";

export default function CircularCropTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
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

  const handleCrop = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const image = await fileToImage(sourceFile);
      const diameter = Math.min(image.width, image.height);
      const offsetX = (image.width - diameter) / 2;
      const offsetY = (image.height - diameter) / 2;

      const canvas = createCanvas(diameter, diameter);
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.beginPath();
      context.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2);
      context.closePath();
      context.clip();

      context.drawImage(
        image,
        offsetX,
        offsetY,
        diameter,
        diameter,
        0,
        0,
        diameter,
        diameter,
      );

      const blob = await canvasToBlob(canvas, "image/png", 0.92);
      clearOutput();
      const nextUrl = URL.createObjectURL(blob);
      outputUrlRef.current = nextUrl;
      setOutputBlob(blob);
      setOutputUrl(nextUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to crop image.";
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
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Circular Image Crop
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Create a centered circular crop and export a transparent PNG.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Applying circular crop..." />

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
              2. Crop
            </h2>
            <button
              type="button"
              onClick={() => void handleCrop()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply Circular Crop
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
            emptyDescription="Upload an image to start."
          />
          <ImagePreview
            title="Circular Output"
            imageUrl={outputUrl}
            emptyDescription="Cropped output appears here."
          />
          <DownloadButton
            blob={outputBlob}
            fileName="circular-crop-output.png"
            label="Download PNG"
            disabledReason="Apply circular crop first."
          />
        </div>
      </div>
    </section>
  );
}

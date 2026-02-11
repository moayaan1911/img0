"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import {
  CORE_OUTPUT_OPTIONS,
  canvasToBlob,
  createCanvas,
  fileToImage,
  formatFileSize,
  isCanvasMimeTypeSupported,
  isQualityBasedFormat,
  normalizeMimeType,
  replaceFileExtension,
} from "@/src/lib/image-utils";

export default function CompressTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputMimeType, setOutputMimeType] = useState<string>("image/jpeg");
  const [quality, setQuality] = useState(80);
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

  const handleSourceFileSelect = (file: File) => {
    setErrorMessage(null);
    clearOutput();

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    const fileUrl = URL.createObjectURL(file);
    sourceUrlRef.current = fileUrl;

    setSourceFile(file);
    setSourceUrl(fileUrl);
    setOutputMimeType(normalizeMimeType(file.type));
  };

  const handleCompress = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (!isCanvasMimeTypeSupported(outputMimeType)) {
        throw new Error(
          "Selected format is not supported by this browser. Try PNG, JPG, or WebP.",
        );
      }

      const image = await fileToImage(sourceFile);
      const canvas = createCanvas(image.width, image.height);
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.drawImage(image, 0, 0);

      const outputQuality = isQualityBasedFormat(outputMimeType)
        ? quality / 100
        : 0.92;
      const generatedBlob = await canvasToBlob(canvas, outputMimeType, outputQuality);

      clearOutput();
      setOutputBlob(generatedBlob);

      const generatedUrl = URL.createObjectURL(generatedBlob);
      outputUrlRef.current = generatedUrl;
      setOutputUrl(generatedUrl);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Compression failed. Please try another image.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFileName = useMemo(() => {
    if (!sourceFile) {
      return "compressed-image.jpg";
    }

    const selected = CORE_OUTPUT_OPTIONS.find(
      (option) => option.mimeType === outputMimeType,
    );
    return replaceFileExtension(sourceFile.name, selected?.extension ?? "png");
  }, [outputMimeType, sourceFile]);

  const compressionStats = useMemo(() => {
    if (!sourceFile || !outputBlob) {
      return null;
    }

    const originalSize = sourceFile.size;
    const compressedSize = outputBlob.size;
    const delta = originalSize - compressedSize;
    const ratio = (delta / originalSize) * 100;

    return {
      original: formatFileSize(originalSize),
      compressed: formatFileSize(compressedSize),
      reductionLabel:
        delta >= 0
          ? `${ratio.toFixed(1)}% smaller`
          : `${Math.abs(ratio).toFixed(1)}% larger`,
    };
  }, [outputBlob, sourceFile]);

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 1 • Core Image Tool
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Image Compressor
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Compress images client-side with quality and format control.
        </p>
      </div>

      <ProcessingLoader
        isProcessing={isProcessing}
        message="Compressing image in your browser..."
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload
            </h2>
            <ImageUploader onFileSelect={handleSourceFileSelect} />
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Configure
            </h2>

            <div className="space-y-2">
              <label
                htmlFor="compress-format"
                className="text-xs text-[var(--text-secondary)]"
              >
                Output Format
              </label>
              <select
                id="compress-format"
                value={outputMimeType}
                onChange={(event) => setOutputMimeType(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                {CORE_OUTPUT_OPTIONS.map((option) => (
                  <option key={option.mimeType} value={option.mimeType}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="compress-quality"
                className="text-xs text-[var(--text-secondary)]"
              >
                Quality: {quality}
              </label>
              <input
                id="compress-quality"
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                disabled={!isQualityBasedFormat(outputMimeType)}
                className="w-full accent-[var(--text-primary)] disabled:opacity-50"
              />
              {!isQualityBasedFormat(outputMimeType) ? (
                <p className="text-xs text-[var(--text-secondary)]">
                  Quality slider works for JPG/WebP/AVIF output formats.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCompress}
                disabled={!sourceFile || isProcessing}
                className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Compress Image
              </button>
              <button
                type="button"
                onClick={() => {
                  clearOutput();
                  setQuality(80);
                }}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
              >
                Reset Output
              </button>
            </div>

            {errorMessage ? (
              <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                {errorMessage}
              </p>
            ) : null}
          </section>
        </div>

        <div className="space-y-5">
          <ImagePreview
            title="Original"
            imageUrl={sourceUrl}
            emptyDescription="Upload an image to inspect the original file."
          />
          <ImagePreview
            title="Compressed Output"
            imageUrl={outputUrl}
            emptyDescription="Run compression to preview the generated output."
          />

          {compressionStats ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-xs">
              <p className="text-[var(--text-secondary)]">
                Original: <span className="font-semibold">{compressionStats.original}</span>
              </p>
              <p className="mt-1 text-[var(--text-secondary)]">
                Output: <span className="font-semibold">{compressionStats.compressed}</span>
              </p>
              <p className="mt-1 text-[var(--text-secondary)]">
                Result:{" "}
                <span className="font-semibold">{compressionStats.reductionLabel}</span>
              </p>
            </div>
          ) : null}

          <DownloadButton
            blob={outputBlob}
            fileName={downloadFileName}
            label="Download Compressed Image"
            disabledReason="No compressed file yet."
          />
        </div>
      </div>
    </section>
  );
}


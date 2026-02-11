"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import {
  EXTENDED_OUTPUT_OPTIONS,
  canvasToBlob,
  createCanvas,
  fileToImage,
  isCanvasMimeTypeSupported,
  isQualityBasedFormat,
  normalizeMimeType,
  replaceFileExtension,
} from "@/src/lib/image-utils";

export default function ConvertTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [targetMimeType, setTargetMimeType] = useState<string>("image/png");
  const [quality, setQuality] = useState(90);
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
    clearOutput();
    setErrorMessage(null);

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    const fileUrl = URL.createObjectURL(file);
    sourceUrlRef.current = fileUrl;
    setSourceFile(file);
    setSourceUrl(fileUrl);
    setTargetMimeType(normalizeMimeType(file.type));
  };

  const handleConvert = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (!isCanvasMimeTypeSupported(targetMimeType)) {
        throw new Error(
          `${targetMimeType} is not supported by this browser encoder. Try PNG/JPG/WebP/AVIF.`,
        );
      }

      const image = await fileToImage(sourceFile);
      const canvas = createCanvas(image.width, image.height);
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.drawImage(image, 0, 0);

      const outputQuality = isQualityBasedFormat(targetMimeType)
        ? quality / 100
        : 0.92;
      const generatedBlob = await canvasToBlob(canvas, targetMimeType, outputQuality);

      clearOutput();
      setOutputBlob(generatedBlob);
      const generatedUrl = URL.createObjectURL(generatedBlob);
      outputUrlRef.current = generatedUrl;
      setOutputUrl(generatedUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to convert image.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFileName = useMemo(() => {
    if (!sourceFile) {
      return "converted-image.png";
    }

    const selected = EXTENDED_OUTPUT_OPTIONS.find(
      (option) => option.mimeType === targetMimeType,
    );
    return replaceFileExtension(sourceFile.name, selected?.extension ?? "png");
  }, [sourceFile, targetMimeType]);

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 1 • Core Image Tool
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Format Converter
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Convert image formats directly in-browser using canvas encoders.
        </p>
      </div>

      <ProcessingLoader
        isProcessing={isProcessing}
        message="Converting image format..."
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload
            </h2>
            <ImageUploader onFileSelect={handleFileSelect} />
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Configure
            </h2>

            <div className="space-y-2">
              <label
                htmlFor="convert-format"
                className="text-xs text-[var(--text-secondary)]"
              >
                Target Format
              </label>
              <select
                id="convert-format"
                value={targetMimeType}
                onChange={(event) => setTargetMimeType(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                {EXTENDED_OUTPUT_OPTIONS.map((option) => (
                  <option key={option.mimeType} value={option.mimeType}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!isCanvasMimeTypeSupported(targetMimeType) ? (
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  Browser encoder not available for this format on your device.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="convert-quality"
                className="text-xs text-[var(--text-secondary)]"
              >
                Quality: {quality}
              </label>
              <input
                id="convert-quality"
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                disabled={!isQualityBasedFormat(targetMimeType)}
                className="w-full accent-[var(--text-primary)] disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleConvert()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Convert Format
            </button>

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
            emptyDescription="Upload an image to preview source format."
          />
          <ImagePreview
            title="Converted Output"
            imageUrl={outputUrl}
            emptyDescription="Converted result will appear here."
          />

          <DownloadButton
            blob={outputBlob}
            fileName={downloadFileName}
            label="Download Converted Image"
            disabledReason="No converted output yet."
          />
        </div>
      </div>
    </section>
  );
}


"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import {
  canvasToBlob,
  createCanvas,
  fileToImage,
  isCanvasMimeTypeSupported,
  normalizeMimeType,
  replaceFileExtension,
} from "@/src/lib/image-utils";

export default function FlipRotateTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
    };
  }, []);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setOutputBlob(null);

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    const fileUrl = URL.createObjectURL(file);
    sourceUrlRef.current = fileUrl;
    setSourceFile(file);
    setSourceUrl(fileUrl);
  };

  const handleApply = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const image = await fileToImage(sourceFile);
      const outputMimeType = normalizeMimeType(sourceFile.type);
      const safeMimeType = isCanvasMimeTypeSupported(outputMimeType)
        ? outputMimeType
        : "image/png";

      const radians = (rotation * Math.PI) / 180;
      const absoluteCos = Math.abs(Math.cos(radians));
      const absoluteSin = Math.abs(Math.sin(radians));

      const targetWidth = Math.max(
        1,
        Math.round(image.width * absoluteCos + image.height * absoluteSin),
      );
      const targetHeight = Math.max(
        1,
        Math.round(image.width * absoluteSin + image.height * absoluteCos),
      );

      const canvas = createCanvas(targetWidth, targetHeight);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.translate(targetWidth / 2, targetHeight / 2);
      context.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
      context.rotate(radians);
      context.drawImage(image, -image.width / 2, -image.height / 2);

      const blob = await canvasToBlob(canvas, safeMimeType);
      setOutputBlob(blob);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to apply flip/rotate transformation.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const previewTransform = `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`;

  const outputFileName = useMemo(() => {
    if (!sourceFile) {
      return "transformed-image.png";
    }
    const ext = outputBlob?.type.split("/")[1] ?? "png";
    return replaceFileExtension(sourceFile.name, ext);
  }, [outputBlob?.type, sourceFile]);

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 1 • Core Image Tool
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Flip & Rotate
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Rotate by fixed/custom angles and flip image orientation in real time.
        </p>
      </div>

      <ProcessingLoader
        isProcessing={isProcessing}
        message="Applying rotation and flip transforms..."
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
              2. Transform Controls
            </h2>

            <div className="flex flex-wrap gap-2">
              {[90, 180, 270].map((angle) => (
                <button
                  key={angle}
                  type="button"
                  onClick={() => setRotation(angle)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                >
                  Rotate {angle}°
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="custom-rotation"
                className="text-xs text-[var(--text-secondary)]"
              >
                Custom Angle: {rotation}°
              </label>
              <input
                id="custom-rotation"
                type="range"
                min={-180}
                max={180}
                value={rotation}
                onChange={(event) => setRotation(Number(event.target.value))}
                className="w-full accent-[var(--text-primary)]"
              />
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={flipHorizontal}
                  onChange={(event) => setFlipHorizontal(event.target.checked)}
                />
                Flip Horizontal
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={flipVertical}
                  onChange={(event) => setFlipVertical(event.target.checked)}
                />
                Flip Vertical
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleApply()}
                disabled={!sourceFile || isProcessing}
                className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply Transform
              </button>
              <button
                type="button"
                onClick={() => {
                  setRotation(0);
                  setFlipHorizontal(false);
                  setFlipVertical(false);
                  setOutputBlob(null);
                }}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
              >
                Reset
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
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              3. Real-time Preview
            </h2>
            <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
              {sourceUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sourceUrl}
                  alt="Transform preview"
                  style={{ transform: previewTransform }}
                  className="max-h-[320px] w-auto rounded-lg object-contain transition-transform duration-150"
                />
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Upload an image to preview transforms.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={outputBlob}
              fileName={outputFileName}
              label="Download Transformed Image"
              disabledReason="Apply transform to generate output."
            />
          </section>
        </div>
      </div>
    </section>
  );
}


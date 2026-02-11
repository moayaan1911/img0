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
  isCanvasMimeTypeSupported,
  normalizeMimeType,
  replaceFileExtension,
} from "@/src/lib/image-utils";

type ImageDetails = {
  name: string;
  type: string;
  size: string;
  width: number;
  height: number;
  lastModified: string;
};

export default function ExifViewerTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [details, setDetails] = useState<ImageDetails | null>(null);
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

  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    clearOutput();

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    sourceUrlRef.current = url;
    setSourceFile(file);
    setSourceUrl(url);

    try {
      const image = await fileToImage(file);
      setDetails({
        name: file.name,
        type: file.type || "Unknown",
        size: formatFileSize(file.size),
        width: image.width,
        height: image.height,
        lastModified: new Date(file.lastModified).toLocaleString(),
      });
    } catch {
      setDetails({
        name: file.name,
        type: file.type || "Unknown",
        size: formatFileSize(file.size),
        width: 0,
        height: 0,
        lastModified: new Date(file.lastModified).toLocaleString(),
      });
    }
  };

  const handleStripMetadata = async () => {
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

      const sourceMime = normalizeMimeType(sourceFile.type);
      const outputMime = isCanvasMimeTypeSupported(sourceMime) ? sourceMime : "image/png";
      const blob = await canvasToBlob(canvas, outputMime, 0.92);

      clearOutput();
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      setOutputBlob(blob);
      setOutputUrl(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove metadata.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const outputFileName = useMemo(() => {
    if (!sourceFile || !outputBlob) {
      return "metadata-clean-image.png";
    }
    const extension = outputBlob.type.split("/")[1] ?? "png";
    return replaceFileExtension(sourceFile.name, extension);
  }, [outputBlob, sourceFile]);

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 5 • Utility
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          EXIF Metadata Viewer & Remover
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Inspect image details and export a clean version with metadata stripped.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Removing metadata..." />

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
              2. Metadata
            </h2>
            {details ? (
              <dl className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--text-secondary)]">File</dt>
                  <dd className="mt-1 truncate font-medium">{details.name}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-secondary)]">Type</dt>
                  <dd className="mt-1 font-medium">{details.type}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-secondary)]">Size</dt>
                  <dd className="mt-1 font-medium">{details.size}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-secondary)]">Dimensions</dt>
                  <dd className="mt-1 font-medium">
                    {details.width} x {details.height}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[var(--text-secondary)]">Last Modified</dt>
                  <dd className="mt-1 font-medium">{details.lastModified}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                Upload an image to inspect metadata details.
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleStripMetadata()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove Metadata
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
            emptyDescription="Upload an image to inspect metadata."
          />
          <ImagePreview
            title="Metadata Removed"
            imageUrl={outputUrl}
            emptyDescription="Clean output appears here after processing."
          />
          <DownloadButton
            blob={outputBlob}
            fileName={outputFileName}
            label="Download Clean Image"
            disabledReason="Generate clean output first."
          />
        </div>
      </div>
    </section>
  );
}

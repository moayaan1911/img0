"use client";

import { useEffect, useRef, useState } from "react";
import type { Config } from "@imgly/background-removal";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";

export default function BgRemoveTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState("Preparing...");
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

    const fileUrl = URL.createObjectURL(file);
    sourceUrlRef.current = fileUrl;
    setSourceFile(file);
    setSourceUrl(fileUrl);
  };

  const handleRemoveBackground = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressLabel("Loading model...");

    try {
      const { removeBackground } = await import("@imgly/background-removal");

      const config: Config = {
        output: {
          format: "image/png",
          quality: 1,
        },
        progress: (key, current, total) => {
          const ratio = total > 0 ? Math.round((current / total) * 100) : 0;
          setProgressLabel(`${key} (${ratio}%)`);
        },
      };

      const resultBlob = await removeBackground(sourceFile, config);

      clearOutput();
      setOutputBlob(resultBlob);
      const resultUrl = URL.createObjectURL(resultBlob);
      outputUrlRef.current = resultUrl;
      setOutputUrl(resultUrl);
      setProgressLabel("Done");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Background removal failed. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 2 • Background & Color
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Background Remover
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          AI-powered background cutout that keeps all processing in your browser.
        </p>
      </div>

      <ProcessingLoader
        isProcessing={isProcessing}
        message={`Removing background... ${progressLabel}`}
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
              2. Remove
            </h2>
            <button
              type="button"
              onClick={() => void handleRemoveBackground()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove Background
            </button>
            <p className="text-xs text-[var(--text-secondary)]">
              First run may take longer while model assets are cached.
            </p>
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
            emptyDescription="Upload an image to start background removal."
          />
          <ImagePreview
            title="Transparent PNG Output"
            imageUrl={outputUrl}
            emptyDescription="Removed output will appear here."
          />
          <DownloadButton
            blob={outputBlob}
            fileName="bg-removed.png"
            label="Download PNG"
            disabledReason="No output available yet."
          />
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Config } from "@imgly/background-removal";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, loadImageFromSource } from "@/src/lib/image-utils";

const presetColors = ["#ffffff", "#000000", "#2563eb", "#16a34a", "#dc2626", "#f59e0b"];

export default function BgColorTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [colorA, setColorA] = useState("#ffffff");
  const [colorB, setColorB] = useState("#e2e8f0");
  const [useGradient, setUseGradient] = useState(false);
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

    const url = URL.createObjectURL(file);
    sourceUrlRef.current = url;
    setSourceFile(file);
    setSourceUrl(url);
  };

  const handleApplyBackground = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressLabel("Loading model...");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const config: Config = {
        output: { format: "image/png", quality: 1 },
        progress: (key, current, total) => {
          const ratio = total > 0 ? Math.round((current / total) * 100) : 0;
          setProgressLabel(`${key} (${ratio}%)`);
        },
      };

      const transparentBlob = await removeBackground(sourceFile, config);
      const transparentUrl = URL.createObjectURL(transparentBlob);

      try {
        const subject = await loadImageFromSource(transparentUrl);
        const canvas = createCanvas(subject.width, subject.height);
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Canvas context is not available in this browser.");
        }

        if (useGradient) {
          const gradient = context.createLinearGradient(0, 0, subject.width, subject.height);
          gradient.addColorStop(0, colorA);
          gradient.addColorStop(1, colorB);
          context.fillStyle = gradient;
        } else {
          context.fillStyle = colorA;
        }
        context.fillRect(0, 0, subject.width, subject.height);
        context.drawImage(subject, 0, 0);

        const resultBlob = await canvasToBlob(canvas, "image/png", 0.92);
        clearOutput();
        setOutputBlob(resultBlob);
        const resultUrl = URL.createObjectURL(resultBlob);
        outputUrlRef.current = resultUrl;
        setOutputUrl(resultUrl);
      } finally {
        URL.revokeObjectURL(transparentUrl);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to apply background color.";
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
          Background Color Changer
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Remove background and replace it with a solid or gradient color.
        </p>
      </div>

      <ProcessingLoader
        isProcessing={isProcessing}
        message={`Applying new background... ${progressLabel}`}
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
              2. Choose Background
            </h2>

            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorA(color)}
                  style={{ backgroundColor: color }}
                  className="h-8 w-8 rounded-full border border-[var(--border)]"
                  aria-label={`Use preset color ${color}`}
                />
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--text-secondary)]">
                Primary Color
                <input
                  type="color"
                  value={colorA}
                  onChange={(event) => setColorA(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Gradient Color
                <input
                  type="color"
                  value={colorB}
                  onChange={(event) => setColorB(event.target.value)}
                  disabled={!useGradient}
                  className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] disabled:opacity-50"
                />
              </label>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={useGradient}
                onChange={(event) => setUseGradient(event.target.checked)}
              />
              Use gradient background
            </label>

            <button
              type="button"
              onClick={() => void handleApplyBackground()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply Background
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
            emptyDescription="Upload an image to replace background color."
          />
          <ImagePreview
            title="Output"
            imageUrl={outputUrl}
            emptyDescription="Generated output will appear here."
          />
          <DownloadButton
            blob={outputBlob}
            fileName="background-color-output.png"
            label="Download Output"
            disabledReason="No output generated yet."
          />
        </div>
      </div>
    </section>
  );
}

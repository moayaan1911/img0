"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import {
  canvasToBlob,
  clamp,
  createCanvas,
  fileToImage,
  formatFileSize,
  isCanvasMimeTypeSupported,
  normalizeMimeType,
  replaceFileExtension,
} from "@/src/lib/image-utils";

type AspectPreset = "free" | "1:1" | "4:3" | "16:9" | "9:16";

function parseAspectRatio(preset: AspectPreset): number | null {
  if (preset === "free") {
    return null;
  }

  const [width, height] = preset.split(":").map(Number);
  if (!width || !height) {
    return null;
  }
  return width / height;
}

export default function CropTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>("free");
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
    clearOutput();
    setErrorMessage(null);

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    try {
      const fileUrl = URL.createObjectURL(file);
      const image = await fileToImage(file);

      sourceUrlRef.current = fileUrl;
      setSourceFile(file);
      setSourceUrl(fileUrl);
      setSourceWidth(image.width);
      setSourceHeight(image.height);
      setCropX(0);
      setCropY(0);
      setCropWidth(image.width);
      setCropHeight(image.height);
      setAspectPreset("free");
    } catch {
      setErrorMessage("Could not load selected image.");
    }
  };

  const applyAspectPreset = (preset: AspectPreset) => {
    setAspectPreset(preset);
    const ratio = parseAspectRatio(preset);
    if (!ratio || !sourceWidth || !sourceHeight) {
      return;
    }

    const maxWidth = sourceWidth - cropX;
    const maxHeight = sourceHeight - cropY;

    let nextWidth = Math.min(cropWidth || maxWidth, maxWidth);
    let nextHeight = Math.round(nextWidth / ratio);

    if (nextHeight > maxHeight) {
      nextHeight = maxHeight;
      nextWidth = Math.round(nextHeight * ratio);
    }

    setCropWidth(clamp(nextWidth, 1, maxWidth));
    setCropHeight(clamp(nextHeight, 1, maxHeight));
  };

  const updateCropWidth = (value: number) => {
    const maxWidth = Math.max(1, sourceWidth - cropX);
    const nextWidth = clamp(value, 1, maxWidth);
    setCropWidth(nextWidth);

    const ratio = parseAspectRatio(aspectPreset);
    if (ratio) {
      const maxHeight = Math.max(1, sourceHeight - cropY);
      setCropHeight(clamp(Math.round(nextWidth / ratio), 1, maxHeight));
    }
  };

  const updateCropHeight = (value: number) => {
    const maxHeight = Math.max(1, sourceHeight - cropY);
    const nextHeight = clamp(value, 1, maxHeight);
    setCropHeight(nextHeight);

    const ratio = parseAspectRatio(aspectPreset);
    if (ratio) {
      const maxWidth = Math.max(1, sourceWidth - cropX);
      setCropWidth(clamp(Math.round(nextHeight * ratio), 1, maxWidth));
    }
  };

  const handleApplyCrop = async () => {
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

      const safeX = clamp(cropX, 0, Math.max(0, image.width - 1));
      const safeY = clamp(cropY, 0, Math.max(0, image.height - 1));
      const safeWidth = clamp(cropWidth, 1, image.width - safeX);
      const safeHeight = clamp(cropHeight, 1, image.height - safeY);

      const canvas = createCanvas(safeWidth, safeHeight);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.drawImage(
        image,
        safeX,
        safeY,
        safeWidth,
        safeHeight,
        0,
        0,
        safeWidth,
        safeHeight,
      );

      const blob = await canvasToBlob(canvas, safeMimeType);
      clearOutput();

      setOutputBlob(blob);
      const generatedUrl = URL.createObjectURL(blob);
      outputUrlRef.current = generatedUrl;
      setOutputUrl(generatedUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to crop image.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const outputFileName = useMemo(() => {
    if (!sourceFile) {
      return "cropped-image.png";
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
          Image Cropper
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Freeform crop with position + size controls and aspect ratio presets.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Applying crop..." />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload
            </h2>
            <ImageUploader onFileSelect={(file) => void handleFileSelect(file)} />

            {sourceFile ? (
              <p className="text-xs text-[var(--text-secondary)]">
                Original: {sourceWidth}×{sourceHeight} •{" "}
                {formatFileSize(sourceFile.size)}
              </p>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Crop Controls
            </h2>

            <div className="grid gap-2 sm:grid-cols-5">
              {(["free", "1:1", "4:3", "16:9", "9:16"] as AspectPreset[]).map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyAspectPreset(preset)}
                    className={`rounded-lg px-2 py-1.5 text-xs font-medium ${
                      aspectPreset === preset
                        ? "bg-[var(--text-primary)] text-[var(--background)]"
                        : "border border-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {preset === "free" ? "Free" : preset}
                  </button>
                ),
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--text-secondary)]">
                X
                <input
                  type="number"
                  value={cropX}
                  min={0}
                  max={Math.max(0, sourceWidth - 1)}
                  onChange={(event) => {
                    const next = clamp(
                      Number(event.target.value) || 0,
                      0,
                      Math.max(0, sourceWidth - 1),
                    );
                    setCropX(next);
                    setCropWidth((prev) =>
                      clamp(prev, 1, Math.max(1, sourceWidth - next)),
                    );
                  }}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Y
                <input
                  type="number"
                  value={cropY}
                  min={0}
                  max={Math.max(0, sourceHeight - 1)}
                  onChange={(event) => {
                    const next = clamp(
                      Number(event.target.value) || 0,
                      0,
                      Math.max(0, sourceHeight - 1),
                    );
                    setCropY(next);
                    setCropHeight((prev) =>
                      clamp(prev, 1, Math.max(1, sourceHeight - next)),
                    );
                  }}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Width
                <input
                  type="number"
                  value={cropWidth}
                  min={1}
                  max={Math.max(1, sourceWidth - cropX)}
                  onChange={(event) =>
                    updateCropWidth(Number(event.target.value) || 1)
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Height
                <input
                  type="number"
                  value={cropHeight}
                  min={1}
                  max={Math.max(1, sourceHeight - cropY)}
                  onChange={(event) =>
                    updateCropHeight(Number(event.target.value) || 1)
                  }
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void handleApplyCrop()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply Crop
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
            emptyDescription="Upload an image to start crop preview."
          />
          <ImagePreview
            title="Cropped Output"
            imageUrl={outputUrl}
            emptyDescription="Apply crop to generate output preview."
          />

          <DownloadButton
            blob={outputBlob}
            fileName={outputFileName}
            label="Download Cropped Image"
            disabledReason="No cropped output yet."
          />
        </div>
      </div>
    </section>
  );
}


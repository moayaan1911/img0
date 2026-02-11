"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import {
  canvasToBlob,
  clamp,
  createCanvas,
  formatFileSize,
  isCanvasMimeTypeSupported,
  loadImageFromSource,
  normalizeMimeType,
  replaceFileExtension,
} from "@/src/lib/image-utils";

type SourceItem = {
  file: File;
  url: string;
  width: number;
  height: number;
};

type OutputItem = {
  fileName: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
};

const sizePresets = [
  { label: "HD (1280×720)", width: 1280, height: 720 },
  { label: "Full HD (1920×1080)", width: 1920, height: 1080 },
  { label: "4K (3840×2160)", width: 3840, height: 2160 },
  { label: "Instagram Post (1080×1080)", width: 1080, height: 1080 },
  { label: "X Post (1200×675)", width: 1200, height: 675 },
];

export default function ResizeTool() {
  const [sourceItems, setSourceItems] = useState<SourceItem[]>([]);
  const [outputItems, setOutputItems] = useState<OutputItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<"dimensions" | "percentage">("dimensions");
  const [percentage, setPercentage] = useState(100);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceItemsRef = useRef<SourceItem[]>([]);
  const outputItemsRef = useRef<OutputItem[]>([]);

  useEffect(() => {
    return () => {
      sourceItemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
      outputItemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  const revokeSourceUrls = () => {
    sourceItemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    sourceItemsRef.current = [];
  };

  const revokeOutputUrls = () => {
    outputItemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    outputItemsRef.current = [];
  };

  const selectFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setErrorMessage(null);
    revokeSourceUrls();
    revokeOutputUrls();
    setOutputItems([]);

    try {
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (!imageFiles.length) {
        throw new Error("Please select image files only.");
      }

      const nextItems: SourceItem[] = [];
      for (const file of imageFiles) {
        const url = URL.createObjectURL(file);
        const image = await loadImageFromSource(url);
        nextItems.push({
          file,
          url,
          width: image.width,
          height: image.height,
        });
      }

      sourceItemsRef.current = nextItems;
      setSourceItems(nextItems);
      setSelectedIndex(0);
      setPercentage(100);
      setWidth(nextItems[0].width);
      setHeight(nextItems[0].height);
      setMode("dimensions");
    } catch (error) {
      revokeSourceUrls();
      const message =
        error instanceof Error ? error.message : "Failed to load selected images.";
      setErrorMessage(message);
    }
  };

  const selectedItem = sourceItems[selectedIndex] ?? null;
  const selectedAspect = selectedItem ? selectedItem.width / selectedItem.height : 1;

  const targetSizeLabel = useMemo(() => {
    if (!selectedItem) {
      return null;
    }

    if (mode === "percentage") {
      const targetWidth = Math.max(1, Math.round((selectedItem.width * percentage) / 100));
      const targetHeight = Math.max(
        1,
        Math.round((selectedItem.height * percentage) / 100),
      );
      return `${targetWidth} × ${targetHeight}px`;
    }

    return `${Math.max(1, width)} × ${Math.max(1, height)}px`;
  }, [height, mode, percentage, selectedItem, width]);

  const handleProcess = async () => {
    if (!sourceItems.length) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      revokeOutputUrls();
      const nextOutputs: OutputItem[] = [];

      for (const item of sourceItems) {
        const image = await loadImageFromSource(item.url);
        const outputMimeType = normalizeMimeType(item.file.type);
        const safeMimeType = isCanvasMimeTypeSupported(outputMimeType)
          ? outputMimeType
          : "image/png";

        const targetWidth =
          mode === "percentage"
            ? Math.max(1, Math.round((item.width * percentage) / 100))
            : Math.max(1, width);
        const targetHeight =
          mode === "percentage"
            ? Math.max(1, Math.round((item.height * percentage) / 100))
            : Math.max(1, height);

        const canvas = createCanvas(targetWidth, targetHeight);
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Canvas context is not available in this browser.");
        }

        context.drawImage(image, 0, 0, targetWidth, targetHeight);
        const blob = await canvasToBlob(canvas, safeMimeType);

        const extension = safeMimeType.split("/")[1] ?? "png";
        const outputName = replaceFileExtension(item.file.name, extension);
        const outputUrl = URL.createObjectURL(blob);
        nextOutputs.push({
          fileName: outputName,
          blob,
          url: outputUrl,
          width: targetWidth,
          height: targetHeight,
        });
      }

      outputItemsRef.current = nextOutputs;
      setOutputItems(nextOutputs);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to resize selected images.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 1 • Core Image Tool
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Image Resizer
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Resize one or multiple images by dimensions, percentage, or preset sizes.
        </p>
      </div>

      <ProcessingLoader
        isProcessing={isProcessing}
        message="Resizing all selected images..."
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload (Batch Supported)
            </h2>

            <label
              htmlFor="resize-multiple-upload"
              className="block rounded-2xl border border-dashed border-[var(--border)] px-6 py-8 text-center"
            >
              <p className="text-base font-semibold">Drop images or click to upload</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Multiple files are supported for batch resize.
              </p>
              <input
                id="resize-multiple-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  void selectFiles(event.target.files);
                  event.target.value = "";
                }}
                className="sr-only"
              />
            </label>

            {sourceItems.length ? (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  {sourceItems.length} file(s) selected
                </p>
                <div className="max-h-40 space-y-1 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                  {sourceItems.map((item, index) => (
                    <button
                      key={`${item.file.name}-${item.file.lastModified}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs ${
                        selectedIndex === index
                          ? "bg-[var(--background)] font-medium"
                          : "hover:bg-[var(--background)]"
                      }`}
                    >
                      <span className="max-w-[70%] truncate">{item.file.name}</span>
                      <span className="text-[var(--text-secondary)]">
                        {item.width}×{item.height}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Configure
            </h2>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("dimensions")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  mode === "dimensions"
                    ? "bg-[var(--text-primary)] text-[var(--background)]"
                    : "border border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                By Dimensions
              </button>
              <button
                type="button"
                onClick={() => setMode("percentage")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  mode === "percentage"
                    ? "bg-[var(--text-primary)] text-[var(--background)]"
                    : "border border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                By Percentage
              </button>
            </div>

            {mode === "dimensions" ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-[var(--text-secondary)]">
                    Width
                    <input
                      type="number"
                      min={1}
                      value={width}
                      onChange={(event) => {
                        const nextWidth = Math.max(1, Number(event.target.value) || 1);
                        setWidth(nextWidth);
                        if (lockAspectRatio && selectedItem) {
                          setHeight(Math.max(1, Math.round(nextWidth / selectedAspect)));
                        }
                      }}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-xs text-[var(--text-secondary)]">
                    Height
                    <input
                      type="number"
                      min={1}
                      value={height}
                      onChange={(event) => {
                        const nextHeight = Math.max(1, Number(event.target.value) || 1);
                        setHeight(nextHeight);
                        if (lockAspectRatio && selectedItem) {
                          setWidth(Math.max(1, Math.round(nextHeight * selectedAspect)));
                        }
                      }}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                    />
                  </label>
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={lockAspectRatio}
                    onChange={(event) => setLockAspectRatio(event.target.checked)}
                  />
                  Lock aspect ratio
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  {sizePresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setWidth(preset.width);
                        setHeight(preset.height);
                      }}
                      className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-left text-xs text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="resize-percentage"
                  className="text-xs text-[var(--text-secondary)]"
                >
                  Resize Percentage: {percentage}%
                </label>
                <input
                  id="resize-percentage"
                  type="range"
                  min={1}
                  max={300}
                  value={percentage}
                  onChange={(event) =>
                    setPercentage(clamp(Number(event.target.value), 1, 300))
                  }
                  className="w-full accent-[var(--text-primary)]"
                />
              </div>
            )}

            {targetSizeLabel ? (
              <p className="text-xs text-[var(--text-secondary)]">
                Target size for selected file:{" "}
                <span className="font-medium text-[var(--text-primary)]">
                  {targetSizeLabel}
                </span>
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleProcess()}
              disabled={!sourceItems.length || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Resize Images
            </button>
          </section>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              3. Preview
            </h2>
            {selectedItem ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.file.name}
                    className="max-h-[280px] w-auto rounded-lg object-contain"
                  />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Original: {selectedItem.width}×{selectedItem.height} •{" "}
                  {formatFileSize(selectedItem.file.size)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                Upload one or more images to preview.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            {outputItems.length ? (
              <div className="space-y-3">
                {outputItems.map((item) => (
                  <div
                    key={`${item.fileName}-${item.width}-${item.height}`}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                  >
                    <p className="truncate text-xs font-medium">{item.fileName}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {item.width}×{item.height} • {formatFileSize(item.blob.size)}
                    </p>
                    <div className="mt-2">
                      <DownloadButton
                        blob={item.blob}
                        fileName={item.fileName}
                        label="Download"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                Resized outputs will appear here after processing.
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}


"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import JSZip from "jszip";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import {
  CORE_OUTPUT_OPTIONS,
  canvasToBlob,
  createCanvas,
  fileToImage,
  formatFileSize,
  isCanvasMimeTypeSupported,
  normalizeMimeType,
  replaceFileExtension,
} from "@/src/lib/image-utils";

type BatchItem = {
  id: string;
  file: File;
  url: string;
};

type BatchOutput = {
  id: string;
  fileName: string;
  blob: Blob;
  url: string;
};

type OperationMode = "resize" | "compress" | "convert";
type ResizeMode = "dimensions" | "percent";

export default function BatchProcessorTool() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [operation, setOperation] = useState<OperationMode>("resize");
  const [resizeMode, setResizeMode] = useState<ResizeMode>("dimensions");
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [percent, setPercent] = useState(60);
  const [quality, setQuality] = useState(82);
  const [targetFormat, setTargetFormat] = useState("image/png");
  const [outputs, setOutputs] = useState<BatchOutput[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState("Preparing...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const itemUrlsRef = useRef<string[]>([]);
  const outputUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const itemUrls = itemUrlsRef.current;
    const outputUrls = outputUrlsRef.current;
    return () => {
      itemUrls.forEach((url) => URL.revokeObjectURL(url));
      outputUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const clearOutputs = () => {
    outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    outputUrlsRef.current = [];
    setOutputs([]);
    setZipBlob(null);
  };

  const handleFiles = (files: FileList | File[]) => {
    const safe = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (safe.length === 0) {
      setErrorMessage("Please upload valid image files.");
      return;
    }

    clearOutputs();
    setErrorMessage(null);

    const mapped = safe.map((file) => {
      const url = URL.createObjectURL(file);
      itemUrlsRef.current.push(url);
      return { id: crypto.randomUUID(), file, url };
    });
    setItems((previous) => [...previous, ...mapped]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(event.target.files);
    }
    event.target.value = "";
  };

  const effectiveQuality = quality / 100;

  const processSingle = async (item: BatchItem): Promise<BatchOutput> => {
    const image = await fileToImage(item.file);

    let targetWidth = image.width;
    let targetHeight = image.height;

    if (operation === "resize") {
      if (resizeMode === "dimensions") {
        targetWidth = Math.max(1, Math.round(width));
        targetHeight = Math.max(1, Math.round(height));
      } else {
        const scale = Math.max(1, percent) / 100;
        targetWidth = Math.max(1, Math.round(image.width * scale));
        targetHeight = Math.max(1, Math.round(image.height * scale));
      }
    }

    const canvas = createCanvas(targetWidth, targetHeight);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context is not available in this browser.");
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    let outputMimeType = normalizeMimeType(item.file.type);
    if (operation === "convert") {
      outputMimeType = normalizeMimeType(targetFormat);
    }

    if (!isCanvasMimeTypeSupported(outputMimeType)) {
      outputMimeType = "image/png";
    }

    const outputBlob = await canvasToBlob(
      canvas,
      outputMimeType,
      operation === "compress" || operation === "convert" ? effectiveQuality : 0.92,
    );
    const extension = outputMimeType.split("/")[1] ?? "png";
    const fileName = replaceFileExtension(item.file.name, extension);
    const outputUrl = URL.createObjectURL(outputBlob);
    outputUrlsRef.current.push(outputUrl);
    return {
      id: item.id,
      fileName,
      blob: outputBlob,
      url: outputUrl,
    };
  };

  const handleProcessBatch = async () => {
    if (items.length === 0) {
      setErrorMessage("Upload images first.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    clearOutputs();

    try {
      const generated: BatchOutput[] = [];
      for (let index = 0; index < items.length; index += 1) {
        setProgressText(`Processing ${index + 1}/${items.length}...`);
        const output = await processSingle(items[index]);
        generated.push(output);
      }

      const zip = new JSZip();
      generated.forEach((item) => {
        zip.file(item.fileName, item.blob);
      });
      const zipOutput = await zip.generateAsync({ type: "blob" });

      setOutputs(generated);
      setZipBlob(zipOutput);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Batch process failed.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
      setProgressText("Preparing...");
    }
  };

  const totalInputSize = useMemo(
    () => items.reduce((sum, item) => sum + item.file.size, 0),
    [items],
  );
  const totalOutputSize = useMemo(
    () => outputs.reduce((sum, item) => sum + item.blob.size, 0),
    [outputs],
  );

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 8 • Batch & Power
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Batch Image Processor
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Process multiple images in one run and download all outputs as ZIP.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message={progressText} />

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload Files
            </h2>
            <label className="block rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
              <p className="text-sm font-semibold">Drop multiple images here</p>
              <span className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-4 py-2 text-sm">
                Choose Files
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleInputChange}
                className="sr-only"
              />
            </label>
            <p className="text-xs text-[var(--text-secondary)]">
              {items.length} files • input size {formatFileSize(totalInputSize)}
            </p>
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Batch Operation
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Operation
              <select
                value={operation}
                onChange={(event) => setOperation(event.target.value as OperationMode)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="resize">Resize</option>
                <option value="compress">Compress</option>
                <option value="convert">Convert Format</option>
              </select>
            </label>

            {operation === "resize" ? (
              <div className="space-y-3">
                <label className="block text-xs text-[var(--text-secondary)]">
                  Resize Mode
                  <select
                    value={resizeMode}
                    onChange={(event) => setResizeMode(event.target.value as ResizeMode)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  >
                    <option value="dimensions">Fixed Dimensions</option>
                    <option value="percent">By Percent</option>
                  </select>
                </label>
                {resizeMode === "dimensions" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-[var(--text-secondary)]">
                      Width
                      <input
                        type="number"
                        min={1}
                        value={width}
                        onChange={(event) => setWidth(Number(event.target.value) || 1)}
                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs text-[var(--text-secondary)]">
                      Height
                      <input
                        type="number"
                        min={1}
                        value={height}
                        onChange={(event) => setHeight(Number(event.target.value) || 1)}
                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="block text-xs text-[var(--text-secondary)]">
                    Percent: {percent}%
                    <input
                      type="range"
                      min={10}
                      max={200}
                      value={percent}
                      onChange={(event) => setPercent(Number(event.target.value))}
                      className="mt-1 w-full accent-[var(--text-primary)]"
                    />
                  </label>
                )}
              </div>
            ) : null}

            {operation === "compress" || operation === "convert" ? (
              <label className="block text-xs text-[var(--text-secondary)]">
                Quality: {quality}
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
            ) : null}

            {operation === "convert" ? (
              <label className="block text-xs text-[var(--text-secondary)]">
                Target Format
                <select
                  value={targetFormat}
                  onChange={(event) => setTargetFormat(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  {CORE_OUTPUT_OPTIONS.map((option) => (
                    <option key={option.mimeType} value={option.mimeType}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <button
              type="button"
              onClick={() => void handleProcessBatch()}
              disabled={items.length === 0 || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Process Batch
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
              3. Output
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {outputs.length} outputs • total size {formatFileSize(totalOutputSize)}
            </p>
            {outputs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Batch outputs appear here.</p>
            ) : (
              <ul className="space-y-2">
                {outputs.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.fileName}
                      className="h-12 w-12 rounded border border-[var(--border)] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{item.fileName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {formatFileSize(item.blob.size)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={zipBlob}
              fileName="batch-output.zip"
              label="Download ZIP"
              disabledReason="Process batch first."
            />
          </section>
        </div>
      </div>
    </section>
  );
}

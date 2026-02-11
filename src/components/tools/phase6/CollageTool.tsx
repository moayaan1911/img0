"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, fileToImage } from "@/src/lib/image-utils";

type CollageItem = {
  id: string;
  file: File;
  url: string;
};

export default function CollageTool() {
  const [items, setItems] = useState<CollageItem[]>([]);
  const [columns, setColumns] = useState(2);
  const [gap, setGap] = useState(16);
  const [background, setBackground] = useState("#ffffff");
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const itemUrlsRef = useRef<string[]>([]);
  const outputUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const itemUrls = itemUrlsRef.current;
    const outputUrl = outputUrlRef.current;
    return () => {
      itemUrls.forEach((url) => URL.revokeObjectURL(url));
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
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

  const handleFiles = (files: FileList | File[]) => {
    const safe = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (safe.length === 0) {
      setErrorMessage("Please add valid image files.");
      return;
    }
    clearOutput();
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

  const handleGenerate = async () => {
    if (items.length === 0) {
      setErrorMessage("Upload at least one image.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    clearOutput();

    try {
      const images = await Promise.all(items.map((item) => fileToImage(item.file)));
      const safeColumns = Math.max(1, columns);
      const rows = Math.ceil(images.length / safeColumns);

      const maxCellWidth = Math.max(...images.map((img) => img.width));
      const maxCellHeight = Math.max(...images.map((img) => img.height));
      const canvasWidth = safeColumns * maxCellWidth + (safeColumns + 1) * gap;
      const canvasHeight = rows * maxCellHeight + (rows + 1) * gap;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);

      images.forEach((image, index) => {
        const row = Math.floor(index / safeColumns);
        const column = index % safeColumns;
        const x = gap + column * (maxCellWidth + gap);
        const y = gap + row * (maxCellHeight + gap);

        const fitScale = Math.min(maxCellWidth / image.width, maxCellHeight / image.height);
        const drawWidth = image.width * fitScale;
        const drawHeight = image.height * fitScale;
        const drawX = x + (maxCellWidth - drawWidth) / 2;
        const drawY = y + (maxCellHeight - drawHeight) / 2;

        context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      });

      const blob = await canvasToBlob(canvas, "image/png", 0.92);
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      setOutputBlob(blob);
      setOutputUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate collage.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 6 • Creative
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Image Collage Maker
        </h1>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Building collage..." />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload Images
            </h2>
            <label className="block rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
              <p className="text-sm font-semibold">Drop multiple images or choose files</p>
              <span className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-4 py-2 text-sm">
                Choose Images
              </span>
              <input type="file" accept="image/*" multiple onChange={handleInputChange} className="sr-only" />
            </label>
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Layout
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Columns: {columns}
              <input
                type="range"
                min={1}
                max={4}
                value={columns}
                onChange={(event) => setColumns(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
            <label className="block text-xs text-[var(--text-secondary)]">
              Gap: {gap}px
              <input
                type="range"
                min={0}
                max={40}
                value={gap}
                onChange={(event) => setGap(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
            <label className="block text-xs text-[var(--text-secondary)]">
              Background
              <input
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={items.length === 0 || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate Collage
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
            {outputUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={outputUrl} alt="Collage preview" className="w-full rounded-xl border border-[var(--border)] object-contain" />
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Generated collage appears here.</p>
            )}
          </section>
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={outputBlob}
              fileName="collage-output.png"
              label="Download Collage"
              disabledReason="Generate collage first."
            />
          </section>
        </div>
      </div>
    </section>
  );
}

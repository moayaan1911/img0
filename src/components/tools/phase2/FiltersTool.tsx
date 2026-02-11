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
  isCanvasMimeTypeSupported,
  normalizeMimeType,
  replaceFileExtension,
} from "@/src/lib/image-utils";

type FilterState = {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  exposure: number;
  grayscale: number;
  sepia: number;
};

const initialFilters: FilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  exposure: 0,
  grayscale: 0,
  sepia: 0,
};

const presets: Array<{ label: string; values: FilterState }> = [
  { label: "Original", values: initialFilters },
  {
    label: "Grayscale",
    values: { ...initialFilters, grayscale: 100, saturation: 0 },
  },
  {
    label: "Sepia",
    values: { ...initialFilters, sepia: 85, brightness: 110, contrast: 95 },
  },
  {
    label: "Vintage",
    values: { ...initialFilters, sepia: 55, saturation: 75, contrast: 110, hue: -8 },
  },
  {
    label: "Warm",
    values: { ...initialFilters, brightness: 108, saturation: 120, hue: -6 },
  },
  {
    label: "Cool",
    values: { ...initialFilters, brightness: 102, saturation: 95, hue: 10 },
  },
  {
    label: "High Contrast",
    values: { ...initialFilters, contrast: 145, saturation: 110 },
  },
];

function buildCssFilter(values: FilterState): string {
  const brightness = values.brightness + values.exposure;
  return [
    `brightness(${Math.max(1, brightness)}%)`,
    `contrast(${values.contrast}%)`,
    `saturate(${values.saturation}%)`,
    `hue-rotate(${values.hue}deg)`,
    `grayscale(${values.grayscale}%)`,
    `sepia(${values.sepia}%)`,
  ].join(" ");
}

export default function FiltersTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
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
    setErrorMessage(null);
    clearOutput();

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    const fileUrl = URL.createObjectURL(file);
    sourceUrlRef.current = fileUrl;
    setSourceFile(file);
    setSourceUrl(fileUrl);
    setFilters(initialFilters);
  };

  const previewFilter = useMemo(() => buildCssFilter(filters), [filters]);

  const applyFilters = async () => {
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

      const canvas = createCanvas(image.width, image.height);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.filter = buildCssFilter(filters);
      context.drawImage(image, 0, 0);

      const blob = await canvasToBlob(canvas, safeMimeType);

      clearOutput();
      setOutputBlob(blob);
      const resultUrl = URL.createObjectURL(blob);
      outputUrlRef.current = resultUrl;
      setOutputUrl(resultUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to apply filters.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const outputName = useMemo(() => {
    if (!sourceFile) {
      return "filtered-image.png";
    }
    const ext = outputBlob?.type.split("/")[1] ?? "png";
    return replaceFileExtension(sourceFile.name, ext);
  }, [outputBlob?.type, sourceFile]);

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 2 • Background & Color
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Filters & Adjustments
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Apply presets and tune brightness, contrast, saturation, hue, and more.
        </p>
      </div>

      <ProcessingLoader
        isProcessing={isProcessing}
        message="Applying filters and generating output..."
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
              2. Presets
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFilters(preset.values)}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              3. Adjustments
            </h2>
            {(
              [
                ["brightness", 0, 200],
                ["contrast", 0, 200],
                ["saturation", 0, 200],
                ["hue", -180, 180],
                ["exposure", -100, 100],
                ["grayscale", 0, 100],
                ["sepia", 0, 100],
              ] as Array<[keyof FilterState, number, number]>
            ).map(([key, min, max]) => (
              <label key={key} className="block text-xs text-[var(--text-secondary)]">
                {key.charAt(0).toUpperCase() + key.slice(1)}: {filters[key]}
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={filters[key]}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      [key]: Number(event.target.value),
                    }))
                  }
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
            ))}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void applyFilters()}
                disabled={!sourceFile || isProcessing}
                className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={() => setFilters(initialFilters)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
              >
                Reset
              </button>
            </div>
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
              Real-time Preview
            </h2>
            <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
              {sourceUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sourceUrl}
                  alt="Filter preview"
                  style={{ filter: previewFilter }}
                  className="max-h-[320px] w-auto rounded-lg object-contain"
                />
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Upload an image to preview filter effects.
                </p>
              )}
            </div>
          </section>

          <ImagePreview
            title="Rendered Output"
            imageUrl={outputUrl}
            emptyDescription="Apply filters to generate downloadable output."
          />

          <DownloadButton
            blob={outputBlob}
            fileName={outputName}
            label="Download Filtered Image"
            disabledReason="No filtered output yet."
          />
        </div>
      </div>
    </section>
  );
}


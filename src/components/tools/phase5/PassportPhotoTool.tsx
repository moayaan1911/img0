"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, fileToImage } from "@/src/lib/image-utils";

type PassportPreset = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  outputWidthPx: number;
  outputHeightPx: number;
};

const PRESETS: PassportPreset[] = [
  { id: "us", label: "US (2 x 2 in)", widthMm: 51, heightMm: 51, outputWidthPx: 600, outputHeightPx: 600 },
  { id: "india", label: "India (35 x 45 mm)", widthMm: 35, heightMm: 45, outputWidthPx: 413, outputHeightPx: 531 },
  { id: "uk", label: "UK (35 x 45 mm)", widthMm: 35, heightMm: 45, outputWidthPx: 413, outputHeightPx: 531 },
  { id: "schengen", label: "Schengen (35 x 45 mm)", widthMm: 35, heightMm: 45, outputWidthPx: 413, outputHeightPx: 531 },
];

function centerCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;
  if (sourceRatio > targetRatio) {
    const cropWidth = sourceHeight * targetRatio;
    return { sx: (sourceWidth - cropWidth) / 2, sy: 0, sw: cropWidth, sh: sourceHeight };
  }
  const cropHeight = sourceWidth / targetRatio;
  return { sx: 0, sy: (sourceHeight - cropHeight) / 2, sw: sourceWidth, sh: cropHeight };
}

export default function PassportPhotoTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [copies, setCopies] = useState(8);
  const [singleBlob, setSingleBlob] = useState<Blob | null>(null);
  const [singleUrl, setSingleUrl] = useState<string | null>(null);
  const [sheetBlob, setSheetBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceUrlRef = useRef<string | null>(null);
  const singleUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
      if (singleUrlRef.current) {
        URL.revokeObjectURL(singleUrlRef.current);
      }
    };
  }, []);

  const preset = useMemo(
    () => PRESETS.find((item) => item.id === presetId) ?? PRESETS[0],
    [presetId],
  );

  const clearOutputs = () => {
    if (singleUrlRef.current) {
      URL.revokeObjectURL(singleUrlRef.current);
      singleUrlRef.current = null;
    }
    setSingleBlob(null);
    setSingleUrl(null);
    setSheetBlob(null);
  };

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    clearOutputs();
    setSourceFile(file);
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    sourceUrlRef.current = url;
    setSourceUrl(url);
  };

  const handleGenerate = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    clearOutputs();

    try {
      const image = await fileToImage(sourceFile);
      const crop = centerCrop(
        image.width,
        image.height,
        preset.outputWidthPx,
        preset.outputHeightPx,
      );

      const singleCanvas = createCanvas(preset.outputWidthPx, preset.outputHeightPx);
      const singleContext = singleCanvas.getContext("2d");
      if (!singleContext) {
        throw new Error("Canvas context is not available in this browser.");
      }
      singleContext.fillStyle = "#ffffff";
      singleContext.fillRect(0, 0, singleCanvas.width, singleCanvas.height);
      singleContext.drawImage(
        image,
        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,
        0,
        0,
        singleCanvas.width,
        singleCanvas.height,
      );

      const single = await canvasToBlob(singleCanvas, "image/png", 0.92);
      const singleOutputUrl = URL.createObjectURL(single);
      singleUrlRef.current = singleOutputUrl;
      setSingleBlob(single);
      setSingleUrl(singleOutputUrl);

      // A4 print sheet at 300 DPI => 2480 x 3508
      const sheetCanvas = createCanvas(2480, 3508);
      const sheetContext = sheetCanvas.getContext("2d");
      if (!sheetContext) {
        throw new Error("Canvas context is not available in this browser.");
      }
      sheetContext.fillStyle = "#ffffff";
      sheetContext.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

      const margin = 120;
      const gap = 40;
      const maxColumns = Math.max(
        1,
        Math.floor((sheetCanvas.width - margin * 2 + gap) / (singleCanvas.width + gap)),
      );

      for (let index = 0; index < Math.max(1, copies); index += 1) {
        const col = index % maxColumns;
        const row = Math.floor(index / maxColumns);
        const x = margin + col * (singleCanvas.width + gap);
        const y = margin + row * (singleCanvas.height + gap);
        if (y + singleCanvas.height > sheetCanvas.height - margin) {
          break;
        }
        sheetContext.drawImage(singleCanvas, x, y);
        sheetContext.strokeStyle = "#d1d5db";
        sheetContext.strokeRect(x, y, singleCanvas.width, singleCanvas.height);
      }

      const sheet = await canvasToBlob(sheetCanvas, "image/png", 0.92);
      setSheetBlob(sheet);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate passport photo.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 5 • Utility
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Passport / ID Photo Cropper
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Generate country-size passport photo and printable sheet layout.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Generating passport output..." />

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
              2. Preset
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Country / Spec
              <select
                value={presetId}
                onChange={(event) => setPresetId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                {PRESETS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-[var(--text-secondary)]">
              Size: {preset.widthMm} x {preset.heightMm} mm ({preset.outputWidthPx} x{" "}
              {preset.outputHeightPx}px)
            </p>
            <label className="block text-xs text-[var(--text-secondary)]">
              Copies on print sheet: {copies}
              <input
                type="range"
                min={1}
                max={20}
                value={copies}
                onChange={(event) => setCopies(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate Passport Photo
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
            {singleUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={singleUrl}
                alt="Passport output preview"
                className="mx-auto max-h-[320px] rounded-xl border border-[var(--border)] object-contain"
              />
            ) : sourceUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sourceUrl}
                alt="Passport source preview"
                className="mx-auto max-h-[320px] rounded-xl border border-[var(--border)] object-contain"
              />
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                Upload image to generate passport output.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={singleBlob}
              fileName={`passport-${preset.id}.png`}
              label="Download Single Photo"
              disabledReason="Generate output first."
            />
            <DownloadButton
              blob={sheetBlob}
              fileName={`passport-sheet-${preset.id}.png`}
              label="Download Print Sheet"
              disabledReason="Generate output first."
            />
          </section>
        </div>
      </div>
    </section>
  );
}

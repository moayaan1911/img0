"use client";

import { useEffect, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, fileToImage } from "@/src/lib/image-utils";

type SocialPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
};

type ResizedOutput = {
  preset: SocialPreset;
  blob: Blob;
  url: string;
  fileName: string;
};

const PRESETS: SocialPreset[] = [
  { id: "ig-post", label: "Instagram Post", width: 1080, height: 1080 },
  { id: "ig-story", label: "Instagram Story", width: 1080, height: 1920 },
  { id: "x-post", label: "X Post", width: 1200, height: 675 },
  { id: "x-header", label: "X Header", width: 1500, height: 500 },
  { id: "li-post", label: "LinkedIn Post", width: 1200, height: 627 },
  { id: "li-banner", label: "LinkedIn Banner", width: 1584, height: 396 },
  { id: "yt-thumb", label: "YouTube Thumbnail", width: 1280, height: 720 },
  { id: "yt-banner", label: "YouTube Banner", width: 2560, height: 1440 },
  { id: "fb-post", label: "Facebook Post", width: 1200, height: 630 },
  { id: "fb-cover", label: "Facebook Cover", width: 820, height: 312 },
];

function centerCropSource(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;
  if (sourceRatio > targetRatio) {
    const cropWidth = sourceHeight * targetRatio;
    return {
      sx: (sourceWidth - cropWidth) / 2,
      sy: 0,
      sw: cropWidth,
      sh: sourceHeight,
    };
  }
  const cropHeight = sourceWidth / targetRatio;
  return {
    sx: 0,
    sy: (sourceHeight - cropHeight) / 2,
    sw: sourceWidth,
    sh: cropHeight,
  };
}

export default function SocialResizeTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [generateAll, setGenerateAll] = useState(false);
  const [outputs, setOutputs] = useState<ResizedOutput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const outputUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      outputUrlsRef.current = [];
    };
  }, []);

  const clearOutputs = () => {
    outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    outputUrlsRef.current = [];
    setOutputs([]);
  };

  const handleFileSelect = (file: File) => {
    setSourceFile(file);
    setErrorMessage(null);
    clearOutputs();
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
      const targetPresets = generateAll
        ? PRESETS
        : PRESETS.filter((preset) => preset.id === selectedPresetId);
      const baseName = sourceFile.name.replace(/\.[^.]+$/u, "");
      const generated: ResizedOutput[] = [];

      for (const preset of targetPresets) {
        const canvas = createCanvas(preset.width, preset.height);
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Canvas context is not available in this browser.");
        }
        const crop = centerCropSource(image.width, image.height, preset.width, preset.height);
        context.drawImage(
          image,
          crop.sx,
          crop.sy,
          crop.sw,
          crop.sh,
          0,
          0,
          preset.width,
          preset.height,
        );
        const blob = await canvasToBlob(canvas, "image/png", 0.92);
        const url = URL.createObjectURL(blob);
        outputUrlsRef.current.push(url);
        generated.push({
          preset,
          blob,
          url,
          fileName: `${baseName}-${preset.id}.png`,
        });
      }

      setOutputs(generated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resize image.";
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
          Social Media Resizer
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Generate platform-ready sizes with center smart-crop.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Generating resized outputs..." />

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
              2. Presets
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Single Preset
              <select
                value={selectedPresetId}
                onChange={(event) => setSelectedPresetId(event.target.value)}
                disabled={generateAll}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm disabled:opacity-50"
              >
                {PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label} ({preset.width}x{preset.height})
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={generateAll}
                onChange={(event) => setGenerateAll(event.target.checked)}
              />
              Generate all presets
            </label>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate
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
              3. Output Preview
            </h2>
            {outputs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Generated outputs appear here.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {outputs.map((item) => (
                  <li key={item.fileName} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.preset.label}
                      className="h-28 w-full rounded border border-[var(--border)] object-cover"
                    />
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      {item.preset.label} ({item.preset.width}x{item.preset.height})
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            {outputs.length === 0 ? (
              <DownloadButton blob={null} label="Download Output" disabledReason="Generate output first." />
            ) : (
              <ul className="space-y-2">
                {outputs.map((item) => (
                  <li key={`${item.fileName}-download`} className="rounded-lg border border-[var(--border)] p-2">
                    <DownloadButton
                      blob={item.blob}
                      fileName={item.fileName}
                      label={`Download ${item.preset.label}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

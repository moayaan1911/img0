"use client";

import { useEffect, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, loadImageFromSource } from "@/src/lib/image-utils";

type Region = { x: number; y: number; width: number; height: number };
type CensorMode = "blur" | "pixelate";

export default function BlurCensorTool() {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [mode, setMode] = useState<CensorMode>("blur");
  const [intensity, setIntensity] = useState(12);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceUrlRef = useRef<string | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
    };
  }, []);

  const drawPreview = () => {
    const image = sourceImageRef.current;
    const canvas = previewCanvasRef.current;
    if (!image || !canvas) {
      return;
    }

    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    const paintRegion = (region: Region, dashed = false) => {
      context.save();
      context.strokeStyle = dashed ? "#f59e0b" : "#ef4444";
      context.lineWidth = Math.max(2, image.width / 500);
      if (dashed) {
        context.setLineDash([10, 6]);
      }
      context.strokeRect(region.x, region.y, region.width, region.height);
      context.fillStyle = dashed ? "rgba(245, 158, 11, 0.16)" : "rgba(239, 68, 68, 0.16)";
      context.fillRect(region.x, region.y, region.width, region.height);
      context.restore();
    };

    regions.forEach((region) => paintRegion(region));
    if (currentRegion) {
      paintRegion(currentRegion, true);
    }
  };

  useEffect(() => {
    drawPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions, currentRegion, sourceUrl]);

  const normalizeRegion = (region: Region): Region => {
    const x = region.width >= 0 ? region.x : region.x + region.width;
    const y = region.height >= 0 ? region.y : region.y + region.height;
    const width = Math.abs(region.width);
    const height = Math.abs(region.height);
    return { x, y, width, height };
  };

  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    setOutputBlob(null);
    setRegions([]);
    setCurrentRegion(null);

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    sourceUrlRef.current = nextUrl;
    setSourceUrl(nextUrl);

    try {
      const image = await loadImageFromSource(nextUrl);
      sourceImageRef.current = image;
      drawPreview();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load image.";
      setErrorMessage(message);
    }
  };

  const getCanvasPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handleApply = async () => {
    const image = sourceImageRef.current;
    if (!image) {
      return;
    }
    if (regions.length === 0) {
      setErrorMessage("Draw at least one region to censor.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const sourceCanvas = createCanvas(image.width, image.height);
      const sourceContext = sourceCanvas.getContext("2d");
      const resultCanvas = createCanvas(image.width, image.height);
      const resultContext = resultCanvas.getContext("2d");
      if (!sourceContext || !resultContext) {
        throw new Error("Canvas context is not available in this browser.");
      }

      sourceContext.drawImage(image, 0, 0);
      resultContext.drawImage(image, 0, 0);

      for (const region of regions) {
        const safe = normalizeRegion(region);
        if (safe.width < 2 || safe.height < 2) {
          continue;
        }

        if (mode === "blur") {
          resultContext.save();
          resultContext.filter = `blur(${intensity}px)`;
          resultContext.drawImage(
            sourceCanvas,
            safe.x,
            safe.y,
            safe.width,
            safe.height,
            safe.x,
            safe.y,
            safe.width,
            safe.height,
          );
          resultContext.restore();
          continue;
        }

        const blockSize = Math.max(2, Math.round(intensity));
        const pixelCanvas = createCanvas(
          Math.max(1, Math.floor(safe.width / blockSize)),
          Math.max(1, Math.floor(safe.height / blockSize)),
        );
        const pixelContext = pixelCanvas.getContext("2d");
        if (!pixelContext) {
          continue;
        }
        pixelContext.imageSmoothingEnabled = false;
        pixelContext.drawImage(
          sourceCanvas,
          safe.x,
          safe.y,
          safe.width,
          safe.height,
          0,
          0,
          pixelCanvas.width,
          pixelCanvas.height,
        );

        resultContext.imageSmoothingEnabled = false;
        resultContext.drawImage(
          pixelCanvas,
          0,
          0,
          pixelCanvas.width,
          pixelCanvas.height,
          safe.x,
          safe.y,
          safe.width,
          safe.height,
        );
      }

      const blob = await canvasToBlob(resultCanvas, "image/png", 0.92);
      setOutputBlob(blob);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to apply censorship.";
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
          Blur / Censor Tool
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Draw rectangles to blur or pixelate sensitive parts of an image.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Applying censorship..." />

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
              2. Censor Settings
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--text-secondary)]">
                Mode
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as CensorMode)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  <option value="blur">Blur</option>
                  <option value="pixelate">Pixelate</option>
                </select>
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Intensity: {intensity}
                <input
                  type="range"
                  min={4}
                  max={40}
                  value={intensity}
                  onChange={(event) => setIntensity(Number(event.target.value))}
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRegions([])}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
              >
                Clear Regions
              </button>
              <button
                type="button"
                onClick={() => void handleApply()}
                disabled={!sourceUrl || isProcessing}
                className="rounded-lg bg-[var(--text-primary)] px-3 py-2 text-xs font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply Censor
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
              3. Draw Regions
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Click and drag on image to mark areas.
            </p>
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
              <canvas
                ref={previewCanvasRef}
                onMouseDown={(event) => {
                  const point = getCanvasPoint(event);
                  if (!point) {
                    return;
                  }
                  isDrawingRef.current = true;
                  drawStartRef.current = point;
                  setCurrentRegion({ x: point.x, y: point.y, width: 0, height: 0 });
                }}
                onMouseMove={(event) => {
                  if (!isDrawingRef.current || !drawStartRef.current) {
                    return;
                  }
                  const point = getCanvasPoint(event);
                  if (!point) {
                    return;
                  }
                  setCurrentRegion({
                    x: drawStartRef.current.x,
                    y: drawStartRef.current.y,
                    width: point.x - drawStartRef.current.x,
                    height: point.y - drawStartRef.current.y,
                  });
                }}
                onMouseUp={() => {
                  if (!isDrawingRef.current || !currentRegion) {
                    return;
                  }
                  const safe = normalizeRegion(currentRegion);
                  if (safe.width > 4 && safe.height > 4) {
                    setRegions((previous) => [...previous, safe]);
                  }
                  setCurrentRegion(null);
                  drawStartRef.current = null;
                  isDrawingRef.current = false;
                }}
                onMouseLeave={() => {
                  if (!isDrawingRef.current) {
                    return;
                  }
                  setCurrentRegion(null);
                  drawStartRef.current = null;
                  isDrawingRef.current = false;
                }}
                className="h-auto max-h-[460px] w-full cursor-crosshair rounded-lg"
              />
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={outputBlob}
              fileName="censored-image.png"
              label="Download Censored Image"
              disabledReason="Apply censoring first."
            />
          </section>
        </div>
      </div>
    </section>
  );
}

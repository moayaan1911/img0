"use client";

import { useEffect, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, loadImageFromSource } from "@/src/lib/image-utils";

type Region = { x: number; y: number; width: number; height: number };

function normalizeRegion(region: Region): Region {
  const x = region.width >= 0 ? region.x : region.x + region.width;
  const y = region.height >= 0 ? region.y : region.y + region.height;
  return {
    x,
    y,
    width: Math.abs(region.width),
    height: Math.abs(region.height),
  };
}

export default function ObjectEraserTool() {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [blendStrength, setBlendStrength] = useState(18);
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

    const drawRegion = (region: Region, active = false) => {
      context.save();
      context.strokeStyle = active ? "#f59e0b" : "#ef4444";
      context.lineWidth = Math.max(2, canvas.width / 450);
      if (active) {
        context.setLineDash([10, 6]);
      }
      context.fillStyle = active ? "rgba(245, 158, 11, 0.18)" : "rgba(239, 68, 68, 0.18)";
      context.fillRect(region.x, region.y, region.width, region.height);
      context.strokeRect(region.x, region.y, region.width, region.height);
      context.restore();
    };

    regions.forEach((region) => drawRegion(region));
    if (currentRegion) {
      drawRegion(normalizeRegion(currentRegion), true);
    }
  };

  useEffect(() => {
    drawPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions, currentRegion, sourceUrl]);

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
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleErase = async () => {
    const image = sourceImageRef.current;
    if (!image) {
      return;
    }
    if (regions.length === 0) {
      setErrorMessage("Mark at least one region to erase.");
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
        if (safe.width < 3 || safe.height < 3) {
          continue;
        }

        // Approximate inpaint: stretch nearby strip into selected area.
        const sampleX =
          safe.x > 2 ? safe.x - 2 : Math.min(sourceCanvas.width - 3, safe.x + safe.width + 1);
        const sampleY =
          safe.y > 2 ? safe.y - 2 : Math.min(sourceCanvas.height - 3, safe.y + safe.height + 1);
        const sampleW = Math.max(1, Math.min(3, sourceCanvas.width - sampleX));
        const sampleH = Math.max(1, Math.min(3, sourceCanvas.height - sampleY));

        resultContext.drawImage(
          sourceCanvas,
          sampleX,
          sampleY,
          sampleW,
          sampleH,
          safe.x,
          safe.y,
          safe.width,
          safe.height,
        );

        // Soft blend into neighbors to hide hard edges.
        resultContext.save();
        resultContext.filter = `blur(${blendStrength}px)`;
        resultContext.drawImage(
          resultCanvas,
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
      }

      const blob = await canvasToBlob(resultCanvas, "image/png", 0.92);
      setOutputBlob(blob);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to erase object.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 7 • AI (Experimental)
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          AI Object Eraser
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Experimental object removal using region blending. Best for small distractions.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Erasing selected objects..." />

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
              2. Selection & Erase
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Blend Strength: {blendStrength}
              <input
                type="range"
                min={4}
                max={32}
                value={blendStrength}
                onChange={(event) => setBlendStrength(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
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
                onClick={() => void handleErase()}
                disabled={!sourceUrl || isProcessing}
                className="rounded-lg bg-[var(--text-primary)] px-3 py-2 text-xs font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Erase Object
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
              3. Draw Erase Regions
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Click and drag to mark areas to remove.
            </p>
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
              <canvas
                ref={previewCanvasRef}
                className="h-auto max-h-[460px] w-full cursor-crosshair rounded-lg"
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
              />
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={outputBlob}
              fileName="object-erased-output.png"
              label="Download Output"
              disabledReason="Erase object first."
            />
          </section>
        </div>
      </div>
    </section>
  );
}

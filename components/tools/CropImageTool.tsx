"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";
type AspectPreset = "free" | "1:1" | "4:3" | "16:9" | "9:16";

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

type SelectionMode = "create" | "move";

const aspectRatios: Record<Exclude<AspectPreset, "free">, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
}

function getMimeType(format: OutputFormat): string {
  if (format === "jpg") {
    return "image/jpeg";
  }

  if (format === "webp") {
    return "image/webp";
  }

  return "image/png";
}

function outputName(originalName: string, format: OutputFormat): string {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  return `${base || "img0-cropped"}.${format}`;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = dataUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to export image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}

function CropIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  );
}

export default function CropImageTool() {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<Point | null>(null);
  const selectionModeRef = useRef<SelectionMode | null>(null);
  const moveStartPointRef = useRef<Point | null>(null);
  const moveStartRectRef = useRef<CropRect | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceNaturalWidth, setSourceNaturalWidth] = useState(0);
  const [sourceNaturalHeight, setSourceNaturalHeight] = useState(0);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [aspect, setAspect] = useState<AspectPreset>("free");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState("");

  useEffect(() => {
    return () => {
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [outputUrl]);

  const downloadFileName = useMemo(() => {
    if (!sourceFile) {
      return `img0-cropped.${outputFormat}`;
    }

    return outputName(sourceFile.name, outputFormat);
  }, [outputFormat, sourceFile]);

  function clearOutput() {
    setOutputBlob(null);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl("");
    }
  }

  function getImageLocalPoint(
    clientX: number,
    clientY: number,
    strict = false,
  ): Point | null {
    const image = imageRef.current;
    if (!image) {
      return null;
    }

    const rect = image.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;

    if (strict) {
      const outsideX = rawX < 0 || rawX > rect.width;
      const outsideY = rawY < 0 || rawY > rect.height;
      if (outsideX || outsideY) {
        return null;
      }
    }

    const x = clamp(rawX, 0, rect.width);
    const y = clamp(rawY, 0, rect.height);
    return { x, y };
  }

  function buildCropRect(start: Point, current: Point, preset: AspectPreset): CropRect {
    const image = imageRef.current;
    const imageWidth = image?.clientWidth ?? 0;
    const imageHeight = image?.clientHeight ?? 0;

    if (!image || imageWidth <= 0 || imageHeight <= 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    if (preset === "free") {
      const x = clamp(Math.min(start.x, current.x), 0, imageWidth);
      const y = clamp(Math.min(start.y, current.y), 0, imageHeight);
      const right = clamp(Math.max(start.x, current.x), 0, imageWidth);
      const bottom = clamp(Math.max(start.y, current.y), 0, imageHeight);

      return {
        x,
        y,
        width: right - x,
        height: bottom - y,
      };
    }

    const ratio = aspectRatios[preset];
    const deltaX = current.x - start.x;
    const deltaY = current.y - start.y;

    const directionX = deltaX >= 0 ? 1 : -1;
    const directionY = deltaY >= 0 ? 1 : -1;

    let width = Math.abs(deltaX);
    let height = Math.abs(deltaY);

    if (width <= 0 && height <= 0) {
      return {
        x: start.x,
        y: start.y,
        width: 0,
        height: 0,
      };
    }

    if (height === 0 && width > 0) {
      height = width / ratio;
    } else if (width === 0 && height > 0) {
      width = height * ratio;
    } else if (width / ratio > height) {
      height = width / ratio;
    } else {
      width = height * ratio;
    }

    const maxWidth = directionX > 0 ? imageWidth - start.x : start.x;
    const maxHeight = directionY > 0 ? imageHeight - start.y : start.y;
    const constrainedWidth = Math.min(maxWidth, maxHeight * ratio);
    const constrainedHeight = constrainedWidth / ratio;

    width = Math.min(width, constrainedWidth);
    height = Math.min(height, constrainedHeight);

    const x = directionX > 0 ? start.x : start.x - width;
    const y = directionY > 0 ? start.y : start.y - height;

    return {
      x: clamp(x, 0, imageWidth),
      y: clamp(y, 0, imageHeight),
      width: Math.max(width, 0),
      height: Math.max(height, 0),
    };
  }

  function isPointInsideRect(point: Point, rect: CropRect): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  async function handleFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setError(null);
    setSourceFile(file);
    setSourceDataUrl("");
    clearOutput();
    setIsSelecting(false);
    dragStartRef.current = null;
    setCropRect(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = String(reader.result ?? "");
        const image = await loadImage(dataUrl);
        setSourceDataUrl(dataUrl);
        setSourceNaturalWidth(image.naturalWidth);
        setSourceNaturalHeight(image.naturalHeight);
      } catch {
        setError("Failed to read this image. Try another file.");
      }
    };
    reader.onerror = () => setError("Failed to read this image.");
    reader.readAsDataURL(file);
  }

  function handleImageLoaded() {
    const image = imageRef.current;
    if (!image) {
      return;
    }

    const displayWidth = image.clientWidth;
    const displayHeight = image.clientHeight;
    if (displayWidth <= 0 || displayHeight <= 0) {
      return;
    }

    setCropRect({
      x: 0,
      y: 0,
      width: displayWidth,
      height: displayHeight,
    });
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!sourceDataUrl) {
      return;
    }

    const point = getImageLocalPoint(event.clientX, event.clientY, true);
    if (!point) {
      return;
    }

    event.preventDefault();
    const hasSelection = cropRect && cropRect.width >= 6 && cropRect.height >= 6;
    const shouldMove = hasSelection ? isPointInsideRect(point, cropRect) : false;

    setIsSelecting(true);

    if (shouldMove && cropRect) {
      selectionModeRef.current = "move";
      moveStartPointRef.current = point;
      moveStartRectRef.current = cropRect;
      dragStartRef.current = null;
      return;
    }

    selectionModeRef.current = "create";
    dragStartRef.current = point;
    moveStartPointRef.current = null;
    moveStartRectRef.current = null;
    setCropRect({
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
    });
  }

  function endSelection() {
    const mode = selectionModeRef.current;
    setIsSelecting(false);
    selectionModeRef.current = null;
    dragStartRef.current = null;
    moveStartPointRef.current = null;
    moveStartRectRef.current = null;
    setCropRect((previous) => {
      if (!previous) {
        return previous;
      }

      if (mode === "create" && (previous.width < 6 || previous.height < 6)) {
        return null;
      }

      return previous;
    });
  }

  function handleAspectChange(preset: AspectPreset) {
    setAspect(preset);
    setCropRect((previous) => {
      if (!previous || preset === "free") {
        return previous;
      }

      const image = imageRef.current;
      if (!image) {
        return previous;
      }

      const imageWidth = image.clientWidth;
      const imageHeight = image.clientHeight;
      if (imageWidth <= 0 || imageHeight <= 0) {
        return previous;
      }

      const ratio = aspectRatios[preset];
      const centerX = previous.x + previous.width / 2;
      const centerY = previous.y + previous.height / 2;
      let width = Math.max(previous.width, 40);
      let height = Math.max(previous.height, 40);

      if (width / ratio > height) {
        width = height * ratio;
      } else {
        height = width / ratio;
      }

      if (width > imageWidth) {
        width = imageWidth;
        height = width / ratio;
      }
      if (height > imageHeight) {
        height = imageHeight;
        width = height * ratio;
      }

      const x = clamp(centerX - width / 2, 0, imageWidth - width);
      const y = clamp(centerY - height / 2, 0, imageHeight - height);

      return { x, y, width, height };
    });
  }

  useEffect(() => {
    if (!isSelecting || !sourceDataUrl) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const current = getImageLocalPoint(event.clientX, event.clientY);
      if (!current) {
        return;
      }

      if (selectionModeRef.current === "move") {
        const image = imageRef.current;
        const startPoint = moveStartPointRef.current;
        const startRect = moveStartRectRef.current;
        if (!image || !startPoint || !startRect) {
          return;
        }

        const deltaX = current.x - startPoint.x;
        const deltaY = current.y - startPoint.y;
        const maxX = Math.max(image.clientWidth - startRect.width, 0);
        const maxY = Math.max(image.clientHeight - startRect.height, 0);

        setCropRect({
          x: clamp(startRect.x + deltaX, 0, maxX),
          y: clamp(startRect.y + deltaY, 0, maxY),
          width: startRect.width,
          height: startRect.height,
        });
        return;
      }

      if (selectionModeRef.current !== "create" || !dragStartRef.current) {
        return;
      }

      setCropRect(buildCropRect(dragStartRef.current, current, aspect));
    };

    const handlePointerUp = () => {
      endSelection();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [aspect, isSelecting, sourceDataUrl]);

  async function handleCrop() {
    if (!sourceDataUrl || !cropRect) {
      setError("Upload image and select a crop area first.");
      return;
    }

    const imageEl = imageRef.current;
    if (!imageEl || sourceNaturalWidth <= 0 || sourceNaturalHeight <= 0) {
      setError("Unable to crop this image.");
      return;
    }

    setIsCropping(true);
    setError(null);

    try {
      const sourceImage = await loadImage(sourceDataUrl);
      const scaleX = sourceNaturalWidth / imageEl.clientWidth;
      const scaleY = sourceNaturalHeight / imageEl.clientHeight;

      const sx = Math.round(cropRect.x * scaleX);
      const sy = Math.round(cropRect.y * scaleY);
      const sw = Math.round(cropRect.width * scaleX);
      const sh = Math.round(cropRect.height * scaleY);

      const safeWidth = Math.max(sw, 1);
      const safeHeight = Math.max(sh, 1);

      const canvas = document.createElement("canvas");
      canvas.width = safeWidth;
      canvas.height = safeHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas unavailable");
      }

      ctx.drawImage(
        sourceImage,
        sx,
        sy,
        safeWidth,
        safeHeight,
        0,
        0,
        safeWidth,
        safeHeight,
      );

      const mimeType = getMimeType(outputFormat);
      const exportQuality =
        outputFormat === "jpg" || outputFormat === "webp" ? quality / 100 : undefined;
      const blob = await canvasToBlob(canvas, mimeType, exportQuality);

      clearOutput();
      const url = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(url);
    } catch {
      setError("Cropping failed. Please try again.");
    } finally {
      setIsCropping(false);
    }
  }

  function resetSelection() {
    const image = imageRef.current;
    if (!image) {
      return;
    }

    setCropRect({
      x: 0,
      y: 0,
      width: image.clientWidth,
      height: image.clientHeight,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="crop-input-file"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            void handleFile(file);
          }}
          className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition ${
            isDragActive
              ? "border-[var(--text-primary)] bg-[var(--surface-strong)]"
              : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-strong)]"
          }`}
        >
          <div className="mb-2 inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-secondary)]">
            <UploadIcon />
          </div>
          <p className="text-sm font-semibold">Upload image</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Drag and drop, or click to choose a file
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">JPG, PNG, WebP and more</p>
          <input
            id="crop-input-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handleFile(file);
            }}
          />
        </label>

        {sourceFile ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="text-sm font-medium">{sourceFile.name}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {formatBytes(sourceFile.size)} • {sourceNaturalWidth} x{" "}
              {sourceNaturalHeight}
            </p>
          </div>
        ) : null}

        <div className="mt-5">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Aspect ratio
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["free", "1:1", "4:3", "16:9", "9:16"] as AspectPreset[]).map(
              (preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAspectChange(preset)}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    aspect === preset
                      ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--background)]"
                      : "border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-strong)]"
                  }`}
                >
                  {preset === "free" ? "Free" : preset}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Output format
            </span>
            <select
              value={outputFormat}
              onChange={(event) =>
                setOutputFormat(event.target.value as OutputFormat)
              }
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Quality: {quality}
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="mt-2 w-full cursor-pointer"
              disabled={outputFormat === "png"}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleCrop()}
            disabled={!sourceDataUrl || !cropRect || isCropping}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceDataUrl && cropRect && !isCropping
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isCropping ? null : <CropIcon />}
            {isCropping ? "Cropping..." : "Crop"}
          </button>

          <button
            type="button"
            onClick={resetSelection}
            disabled={!sourceDataUrl}
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
              sourceDataUrl
                ? "cursor-pointer border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                : "cursor-not-allowed border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            Reset Selection
          </button>
        </div>

        {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Crop Area</p>
        <div
          onPointerDown={onPointerDown}
          className={`relative mt-4 flex min-h-[320px] touch-none items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 ${
            sourceDataUrl ? "cursor-crosshair" : ""
          }`}
        >
          {!sourceDataUrl ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Upload an image to start cropping.
            </p>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={sourceDataUrl}
                alt="Source image for cropping"
                onLoad={handleImageLoaded}
                className="max-h-[300px] w-auto max-w-full select-none rounded-md object-contain"
              />
              {cropRect ? (
                <div
                  className="pointer-events-none absolute border-2 border-[var(--text-primary)] bg-[color:color-mix(in_oklab,var(--text-primary)_18%,transparent)]"
                  style={{
                    left: cropRect.x + (imageRef.current?.offsetLeft ?? 0),
                    top: cropRect.y + (imageRef.current?.offsetTop ?? 0),
                    width: cropRect.width,
                    height: cropRect.height,
                  }}
                />
              ) : null}
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Drag over the image to choose your crop area.
        </p>

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Cropped output
          </p>
          <div className="mt-3 flex min-h-[180px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            {!outputUrl ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Crop an image to preview output.
              </p>
            ) : (
              <Image
                src={outputUrl}
                alt="Cropped output preview"
                width={300}
                height={300}
                unoptimized
                className="h-auto max-h-[160px] w-auto max-w-full rounded-md"
              />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={outputUrl || undefined}
              download={downloadFileName}
              aria-disabled={!outputUrl}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                outputUrl
                  ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                  : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
              }`}
            >
              <DownloadIcon />
              Download
            </a>
            {outputBlob ? (
              <p className="text-xs text-[var(--text-secondary)]">
                {downloadFileName} • {formatBytes(outputBlob.size)}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

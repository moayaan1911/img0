"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";
type PatchDirection = "auto" | "above" | "below" | "left" | "right";

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
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

function outputName(originalName: string, format: OutputFormat): string {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  return `${base || "img0-image"}-clean.${format}`;
}

function mimeFromFormat(format: OutputFormat): string {
  if (format === "jpg") {
    return "image/jpeg";
  }
  if (format === "webp") {
    return "image/webp";
  }
  return "image/png";
}

function inferFormatFromMime(mime: string): OutputFormat {
  if (mime === "image/png") {
    return "png";
  }
  if (mime === "image/webp") {
    return "webp";
  }
  return "jpg";
}

function createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
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
          reject(new Error("Failed to export image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function area(rect: Rect): number {
  return Math.max(rect.width, 0) * Math.max(rect.height, 0);
}

function overlapArea(a: Rect, b: Rect): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const width = Math.max(0, x2 - x1);
  const height = Math.max(0, y2 - y1);
  return width * height;
}

function sanitizeRect(rect: Rect, maxWidth: number, maxHeight: number): Rect {
  const width = clamp(Math.round(rect.width), 1, Math.max(maxWidth, 1));
  const height = clamp(Math.round(rect.height), 1, Math.max(maxHeight, 1));
  const x = clamp(Math.round(rect.x), 0, Math.max(maxWidth - width, 0));
  const y = clamp(Math.round(rect.y), 0, Math.max(maxHeight - height, 0));
  return { x, y, width, height };
}

function chooseSourceRect(
  targetRect: Rect,
  canvasWidth: number,
  canvasHeight: number,
  direction: PatchDirection,
): Rect {
  const gap = Math.max(2, Math.round(Math.min(targetRect.width, targetRect.height) * 0.12));
  const limitX = Math.max(canvasWidth - targetRect.width, 0);
  const limitY = Math.max(canvasHeight - targetRect.height, 0);
  const makeRect = (x: number, y: number): Rect => ({
    x: clamp(Math.round(x), 0, limitX),
    y: clamp(Math.round(y), 0, limitY),
    width: targetRect.width,
    height: targetRect.height,
  });

  const candidatesByDirection: Record<Exclude<PatchDirection, "auto">, Rect> = {
    above: makeRect(targetRect.x, targetRect.y - targetRect.height - gap),
    below: makeRect(targetRect.x, targetRect.y + targetRect.height + gap),
    left: makeRect(targetRect.x - targetRect.width - gap, targetRect.y),
    right: makeRect(targetRect.x + targetRect.width + gap, targetRect.y),
  };

  if (direction !== "auto") {
    return candidatesByDirection[direction];
  }

  const ranked = (Object.values(candidatesByDirection) as Rect[])
    .map((candidate) => {
      const overlap = overlapArea(candidate, targetRect);
      const centerDx =
        candidate.x + candidate.width / 2 - (targetRect.x + targetRect.width / 2);
      const centerDy =
        candidate.y + candidate.height / 2 - (targetRect.y + targetRect.height / 2);
      const distanceScore = Math.hypot(centerDx, centerDy);
      const overlapPenalty = overlap / Math.max(area(targetRect), 1);
      const score = distanceScore - overlapPenalty * 400;
      return { candidate, score, overlap };
    })
    .sort((a, b) => b.score - a.score);

  if (ranked.length > 0) {
    return ranked[0].candidate;
  }

  return makeRect(targetRect.x + targetRect.width + gap, targetRect.y);
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

function EraseIcon() {
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
      <path d="m7 21 10.4-10.4a2 2 0 0 0 0-2.8l-2.8-2.8a2 2 0 0 0-2.8 0L1.4 15.4a2 2 0 0 0 0 2.8L3.2 20" />
      <path d="M7 21h14" />
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

export default function RemoveWatermarkTool() {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<Point | null>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);

  const [areaX, setAreaX] = useState(30);
  const [areaY, setAreaY] = useState(30);
  const [areaWidth, setAreaWidth] = useState(32);
  const [areaHeight, setAreaHeight] = useState(16);

  const [feather, setFeather] = useState(8);
  const [passes, setPasses] = useState(2);
  const [patchDirection, setPatchDirection] = useState<PatchDirection>("auto");

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [isApplying, setIsApplying] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [draftRect, setDraftRect] = useState<Rect | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState("");
  const [outputWidth, setOutputWidth] = useState(0);
  const [outputHeight, setOutputHeight] = useState(0);

  useEffect(() => {
    return () => {
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [outputUrl]);

  const downloadFileName = useMemo(() => {
    if (!sourceFile) {
      return `img0-clean.${outputFormat}`;
    }
    return outputName(sourceFile.name, outputFormat);
  }, [sourceFile, outputFormat]);

  function clearOutput() {
    setOutputBlob(null);
    setOutputWidth(0);
    setOutputHeight(0);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl("");
    }
  }

  async function handleSourceFile(file: File | null) {
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
    setSourceWidth(0);
    setSourceHeight(0);
    setOutputFormat(inferFormatFromMime(file.type));
    clearOutput();
    setDraftRect(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = String(reader.result ?? "");
        const image = await createImageFromDataUrl(dataUrl);
        setSourceDataUrl(dataUrl);
        setSourceWidth(image.naturalWidth);
        setSourceHeight(image.naturalHeight);
      } catch {
        setError("Failed to read this image. Try another file.");
      }
    };
    reader.onerror = () => setError("Failed to read this image.");
    reader.readAsDataURL(file);
  }

  function getImagePoint(clientX: number, clientY: number, strict = false): Point | null {
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
      const outside = rawX < 0 || rawY < 0 || rawX > rect.width || rawY > rect.height;
      if (outside) {
        return null;
      }
    }

    return {
      x: clamp(rawX, 0, rect.width),
      y: clamp(rawY, 0, rect.height),
    };
  }

  function rectFromPoints(start: Point, end: Point): Rect {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    return { x, y, width, height };
  }

  function commitDraftToPercent(rect: Rect) {
    const image = imageRef.current;
    if (!image || image.clientWidth <= 0 || image.clientHeight <= 0) {
      return;
    }
    const minSize = 1;
    const safeRect = {
      x: clamp(rect.x, 0, image.clientWidth),
      y: clamp(rect.y, 0, image.clientHeight),
      width: clamp(rect.width, minSize, image.clientWidth),
      height: clamp(rect.height, minSize, image.clientHeight),
    };

    const maxXPercent = 100 - (safeRect.width / image.clientWidth) * 100;
    const maxYPercent = 100 - (safeRect.height / image.clientHeight) * 100;

    setAreaWidth((safeRect.width / image.clientWidth) * 100);
    setAreaHeight((safeRect.height / image.clientHeight) * 100);
    setAreaX((safeRect.x / image.clientWidth) * 100 <= maxXPercent ? (safeRect.x / image.clientWidth) * 100 : maxXPercent);
    setAreaY((safeRect.y / image.clientHeight) * 100 <= maxYPercent ? (safeRect.y / image.clientHeight) * 100 : maxYPercent);
  }

  useEffect(() => {
    if (!isSelecting) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) {
        return;
      }
      const current = getImagePoint(event.clientX, event.clientY);
      if (!current) {
        return;
      }
      setDraftRect(rectFromPoints(start, current));
    };

    const handlePointerEnd = () => {
      setIsSelecting(false);
      if (draftRect && draftRect.width >= 8 && draftRect.height >= 8) {
        commitDraftToPercent(draftRect);
      }
      setDraftRect(null);
      dragStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [draftRect, isSelecting]);

  function handlePreviewPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!sourceDataUrl) {
      return;
    }

    const start = getImagePoint(event.clientX, event.clientY, true);
    if (!start) {
      return;
    }

    event.preventDefault();
    dragStartRef.current = start;
    setDraftRect({ x: start.x, y: start.y, width: 0, height: 0 });
    setIsSelecting(true);
  }

  const activeRectPx = useMemo(() => {
    const image = imageRef.current;
    if (!image || image.clientWidth <= 0 || image.clientHeight <= 0) {
      return null;
    }

    if (draftRect) {
      return sanitizeRect(draftRect, image.clientWidth, image.clientHeight);
    }

    const width = (image.clientWidth * areaWidth) / 100;
    const height = (image.clientHeight * areaHeight) / 100;
    const x = (image.clientWidth * areaX) / 100;
    const y = (image.clientHeight * areaY) / 100;
    return sanitizeRect({ x, y, width, height }, image.clientWidth, image.clientHeight);
  }, [areaHeight, areaWidth, areaX, areaY, draftRect]);

  async function handleRemoveWatermark() {
    if (!sourceDataUrl || sourceWidth <= 0 || sourceHeight <= 0) {
      setError("Upload an image first.");
      return;
    }

    setError(null);
    setIsApplying(true);
    try {
      const source = await createImageFromDataUrl(sourceDataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas unavailable");
      }

      if (outputFormat === "jpg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      const normalizedRect = {
        x: areaX / 100,
        y: areaY / 100,
        width: areaWidth / 100,
        height: areaHeight / 100,
      };
      const targetRect = sanitizeRect(
        {
          x: normalizedRect.x * canvas.width,
          y: normalizedRect.y * canvas.height,
          width: normalizedRect.width * canvas.width,
          height: normalizedRect.height * canvas.height,
        },
        canvas.width,
        canvas.height,
      );

      const applyPasses = clamp(Math.round(passes), 1, 6);
      for (let index = 0; index < applyPasses; index += 1) {
        const snapshot = document.createElement("canvas");
        snapshot.width = canvas.width;
        snapshot.height = canvas.height;
        const snapshotCtx = snapshot.getContext("2d");
        if (!snapshotCtx) {
          throw new Error("Canvas unavailable");
        }
        snapshotCtx.drawImage(canvas, 0, 0);

        const sourceRect = chooseSourceRect(
          targetRect,
          canvas.width,
          canvas.height,
          patchDirection,
        );

        ctx.drawImage(
          snapshot,
          sourceRect.x,
          sourceRect.y,
          sourceRect.width,
          sourceRect.height,
          targetRect.x,
          targetRect.y,
          targetRect.width,
          targetRect.height,
        );

        if (feather > 0) {
          const blended = document.createElement("canvas");
          blended.width = canvas.width;
          blended.height = canvas.height;
          const blendCtx = blended.getContext("2d");
          if (!blendCtx) {
            throw new Error("Canvas unavailable");
          }
          blendCtx.drawImage(canvas, 0, 0);

          ctx.save();
          ctx.globalAlpha = 0.55;
          ctx.filter = `blur(${feather}px)`;
          ctx.drawImage(
            blended,
            targetRect.x,
            targetRect.y,
            targetRect.width,
            targetRect.height,
            targetRect.x,
            targetRect.y,
            targetRect.width,
            targetRect.height,
          );
          ctx.restore();
        }
      }

      const mimeType = mimeFromFormat(outputFormat);
      const exportQuality =
        outputFormat === "jpg" || outputFormat === "webp"
          ? quality / 100
          : undefined;
      const blob = await canvasToBlob(canvas, mimeType, exportQuality);
      const url = URL.createObjectURL(blob);

      clearOutput();
      setOutputBlob(blob);
      setOutputUrl(url);
      setOutputWidth(canvas.width);
      setOutputHeight(canvas.height);
    } catch {
      setError("Remove watermark failed. Try adjusting area, direction, or passes.");
    } finally {
      setIsApplying(false);
    }
  }

  const overlayStyle = useMemo(() => {
    const image = imageRef.current;
    if (!image || !activeRectPx) {
      return null;
    }

    return {
      left: image.offsetLeft + activeRectPx.x,
      top: image.offsetTop + activeRectPx.y,
      width: activeRectPx.width,
      height: activeRectPx.height,
    };
  }, [activeRectPx]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="remove-watermark-input-file"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            void handleSourceFile(file);
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
          <input
            id="remove-watermark-input-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handleSourceFile(file);
            }}
          />
        </label>

        {sourceFile ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="text-sm font-medium">{sourceFile.name}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {formatBytes(sourceFile.size)} • {sourceWidth} x {sourceHeight}
            </p>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-[var(--text-secondary)]">
          Drag over the image area to quickly set target region. Best result on simple
          backgrounds.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Area X: {areaX.toFixed(1)}%
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(0, 100 - areaWidth)}
              step={0.1}
              value={areaX}
              onChange={(event) => {
                setAreaX(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Area Y: {areaY.toFixed(1)}%
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(0, 100 - areaHeight)}
              step={0.1}
              value={areaY}
              onChange={(event) => {
                setAreaY(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Area Width: {areaWidth.toFixed(1)}%
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={0.1}
              value={areaWidth}
              onChange={(event) => {
                const nextWidth = Number(event.target.value);
                const safeWidth = clamp(nextWidth, 1, 100);
                setAreaWidth(safeWidth);
                setAreaX((previous) => clamp(previous, 0, 100 - safeWidth));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Area Height: {areaHeight.toFixed(1)}%
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={0.1}
              value={areaHeight}
              onChange={(event) => {
                const nextHeight = Number(event.target.value);
                const safeHeight = clamp(nextHeight, 1, 100);
                setAreaHeight(safeHeight);
                setAreaY((previous) => clamp(previous, 0, 100 - safeHeight));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Patch source
            </span>
            <select
              value={patchDirection}
              onChange={(event) => {
                setPatchDirection(event.target.value as PatchDirection);
                clearOutput();
              }}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              <option value="auto">Auto</option>
              <option value="above">Above</option>
              <option value="below">Below</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Feather blur: {feather}px
            </span>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={feather}
              onChange={(event) => {
                setFeather(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Passes: {passes}
            </span>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={passes}
              onChange={(event) => {
                setPasses(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Output format
            </span>
            <select
              value={outputFormat}
              onChange={(event) => {
                setOutputFormat(event.target.value as OutputFormat);
                clearOutput();
              }}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Quality: {quality}
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={quality}
              disabled={outputFormat === "png"}
              onChange={(event) => {
                setQuality(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleRemoveWatermark()}
            disabled={!sourceDataUrl || isApplying}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceDataUrl && !isApplying
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isApplying ? null : <EraseIcon />}
            {isApplying ? "Removing..." : "Remove Watermark"}
          </button>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Selection + Preview</p>
        <div
          onPointerDown={handlePreviewPointerDown}
          className={`relative mt-4 flex min-h-[280px] items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 ${
            sourceDataUrl ? "cursor-crosshair" : ""
          }`}
        >
          {!sourceDataUrl ? (
            <p className="text-center text-xs text-[var(--text-secondary)]">
              Upload image and drag to select watermark area.
            </p>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={sourceDataUrl}
                alt="Watermark removal source"
                className="max-h-[250px] w-auto max-w-full select-none rounded-md object-contain"
              />
              {overlayStyle ? (
                <>
                  <div
                    className="pointer-events-none absolute border border-[var(--text-primary)]/25 bg-[color:color-mix(in_oklab,var(--text-primary)_18%,transparent)]"
                    style={{
                      left: overlayStyle.left,
                      top: overlayStyle.top,
                      width: overlayStyle.width,
                      height: overlayStyle.height,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute border-2 border-dashed border-[var(--text-primary)]"
                    style={{
                      left: overlayStyle.left,
                      top: overlayStyle.top,
                      width: overlayStyle.width,
                      height: overlayStyle.height,
                    }}
                  />
                </>
              ) : null}
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Drag on the image to update area quickly, or fine-tune with sliders.
        </p>

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Output</p>
          <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
            {!outputUrl ? (
              <p className="text-center text-xs text-[var(--text-secondary)]">
                Run remove watermark to preview output.
              </p>
            ) : (
              <Image
                src={outputUrl}
                alt="Watermark removed output preview"
                width={Math.max(outputWidth, 1)}
                height={Math.max(outputHeight, 1)}
                unoptimized
                className="h-auto max-h-[200px] w-auto max-w-full rounded-md"
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
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
              {downloadFileName} • {formatBytes(outputBlob.size)} • {outputWidth} x{" "}
              {outputHeight}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

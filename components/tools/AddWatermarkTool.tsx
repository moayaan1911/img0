"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";
type WatermarkMode = "text" | "image";
type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

const fontFamilies = [
  { label: "Inter", value: "Inter, Arial, sans-serif" },
  { label: "Geist", value: "Geist, Inter, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "'Times New Roman', serif" },
  { label: "Courier", value: "'Courier New', monospace" },
] as const;

const fontWeights = [
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semi Bold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Extra Bold", value: "800" },
] as const;

const positionOptions: { label: string; value: WatermarkPosition }[] = [
  { label: "Top Left", value: "top-left" },
  { label: "Top Center", value: "top-center" },
  { label: "Top Right", value: "top-right" },
  { label: "Middle Left", value: "middle-left" },
  { label: "Center", value: "middle-center" },
  { label: "Middle Right", value: "middle-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Bottom Center", value: "bottom-center" },
  { label: "Bottom Right", value: "bottom-right" },
];

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
  return `${base || "img0-image"}-watermark.${format}`;
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

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.replace(/\r/g, "").split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().length > 0 ? paragraph.split(/\s+/) : [];
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let line = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const next = `${line} ${words[index]}`;
      if (ctx.measureText(next).width <= maxWidth) {
        line = next;
      } else {
        lines.push(line);
        line = words[index];
      }
    }
    lines.push(line);
  }

  return lines.length > 0 ? lines : [""];
}

function getPositionXY(
  position: WatermarkPosition,
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  margin: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  let x = margin;
  let y = margin;

  if (position.includes("center")) {
    x = (canvasWidth - watermarkWidth) / 2;
  } else if (position.endsWith("right")) {
    x = canvasWidth - margin - watermarkWidth;
  }

  if (position.startsWith("middle")) {
    y = (canvasHeight - watermarkHeight) / 2;
  } else if (position.startsWith("bottom")) {
    y = canvasHeight - margin - watermarkHeight;
  }

  const safeX = clamp(x + offsetX, 0, Math.max(canvasWidth - watermarkWidth, 0));
  const safeY = clamp(y + offsetY, 0, Math.max(canvasHeight - watermarkHeight, 0));
  return { x: safeX, y: safeY };
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

function WatermarkIcon() {
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
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
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

export default function AddWatermarkTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);

  const [watermarkMode, setWatermarkMode] = useState<WatermarkMode>("text");
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkDataUrl, setWatermarkDataUrl] = useState("");
  const [watermarkWidth, setWatermarkWidth] = useState(0);
  const [watermarkHeight, setWatermarkHeight] = useState(0);

  const [watermarkText, setWatermarkText] = useState("img0.xyz");
  const [fontFamily, setFontFamily] = useState<string>(fontFamilies[0].value);
  const [fontWeight, setFontWeight] = useState<(typeof fontWeights)[number]["value"]>("700");
  const [fontSize, setFontSize] = useState(72);
  const [textColor, setTextColor] = useState("#ffffff");
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(4);

  const [opacity, setOpacity] = useState(42);
  const [imageScalePercent, setImageScalePercent] = useState(24);
  const [rotation, setRotation] = useState(-18);
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [margin, setMargin] = useState(24);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [isApplying, setIsApplying] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isWatermarkDragActive, setIsWatermarkDragActive] = useState(false);
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
      return `img0-watermark.${outputFormat}`;
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
      setError("Please upload a valid base image file.");
      return;
    }

    setError(null);
    setSourceFile(file);
    setSourceDataUrl("");
    setSourceWidth(0);
    setSourceHeight(0);
    setOutputFormat(inferFormatFromMime(file.type));
    clearOutput();

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

  async function handleWatermarkFile(file: File | null) {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid watermark image file.");
      return;
    }

    setError(null);
    setWatermarkFile(file);
    setWatermarkDataUrl("");
    setWatermarkWidth(0);
    setWatermarkHeight(0);
    clearOutput();

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = String(reader.result ?? "");
        const image = await createImageFromDataUrl(dataUrl);
        setWatermarkDataUrl(dataUrl);
        setWatermarkWidth(image.naturalWidth);
        setWatermarkHeight(image.naturalHeight);
      } catch {
        setError("Failed to read watermark image.");
      }
    };
    reader.onerror = () => setError("Failed to read watermark image.");
    reader.readAsDataURL(file);
  }

  async function handleApplyWatermark() {
    if (!sourceDataUrl) {
      setError("Upload a base image first.");
      return;
    }
    if (watermarkMode === "image" && !watermarkDataUrl) {
      setError("Upload a watermark image first.");
      return;
    }
    if (watermarkMode === "text" && !watermarkText.trim()) {
      setError("Enter watermark text first.");
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

      if (watermarkMode === "image") {
        const watermarkImage = await createImageFromDataUrl(watermarkDataUrl);
        let wmWidth = (canvas.width * imageScalePercent) / 100;
        let wmHeight = wmWidth * (watermarkImage.naturalHeight / watermarkImage.naturalWidth);

        const maxHeight = canvas.height * 0.85;
        if (wmHeight > maxHeight) {
          wmHeight = maxHeight;
          wmWidth = wmHeight * (watermarkImage.naturalWidth / watermarkImage.naturalHeight);
        }

        const wmMargin = Math.max(0, margin);
        const point = getPositionXY(
          position,
          canvas.width,
          canvas.height,
          wmWidth,
          wmHeight,
          wmMargin,
          offsetX,
          offsetY,
        );

        ctx.save();
        ctx.globalAlpha = clamp(opacity, 0, 100) / 100;
        ctx.translate(point.x + wmWidth / 2, point.y + wmHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(
          watermarkImage,
          -wmWidth / 2,
          -wmHeight / 2,
          wmWidth,
          wmHeight,
        );
        ctx.restore();
      } else {
        const wmMargin = Math.max(0, margin);
        ctx.save();
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const maxTextWidth = Math.max(canvas.width - wmMargin * 2, 1);
        const lines = wrapTextLines(ctx, watermarkText, maxTextWidth);
        const lineHeight = fontSize * 1.2;
        const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width), 1);
        const textHeight = Math.max(lines.length * lineHeight, lineHeight);

        const point = getPositionXY(
          position,
          canvas.width,
          canvas.height,
          textWidth,
          textHeight,
          wmMargin,
          offsetX,
          offsetY,
        );

        ctx.globalAlpha = clamp(opacity, 0, 100) / 100;
        ctx.fillStyle = textColor;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.translate(point.x + textWidth / 2, point.y + textHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-textWidth / 2, -textHeight / 2);

        lines.forEach((line, index) => {
          ctx.fillText(line, 0, index * lineHeight);
        });
        ctx.restore();
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
      setError("Watermark apply failed. Try another image or watermark.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="add-watermark-input-file"
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
          <p className="text-sm font-semibold">Upload base image</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Drag and drop, or click to choose a file
          </p>
          <input
            id="add-watermark-input-file"
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

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Mode</span>
            <select
              value={watermarkMode}
              onChange={(event) => {
                setWatermarkMode(event.target.value as WatermarkMode);
                clearOutput();
              }}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              <option value="text">Text Watermark</option>
              <option value="image">Image Watermark</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Position
            </span>
            <select
              value={position}
              onChange={(event) => {
                setPosition(event.target.value as WatermarkPosition);
                clearOutput();
              }}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              {positionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {watermarkMode === "image" ? (
          <div className="mt-4">
            <label
              htmlFor="add-watermark-logo-file"
              onDragOver={(event) => {
                event.preventDefault();
                setIsWatermarkDragActive(true);
              }}
              onDragLeave={() => setIsWatermarkDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsWatermarkDragActive(false);
                const file = event.dataTransfer.files?.[0] ?? null;
                void handleWatermarkFile(file);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition ${
                isWatermarkDragActive
                  ? "border-[var(--text-primary)] bg-[var(--surface-strong)]"
                  : "border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-strong)]"
              }`}
            >
              <p className="text-sm font-semibold">Upload watermark logo</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                PNG/SVG/JPG, preferably with transparent background
              </p>
              <input
                id="add-watermark-logo-file"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleWatermarkFile(file);
                }}
              />
            </label>

            {watermarkFile ? (
              <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="text-sm font-medium">{watermarkFile.name}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {formatBytes(watermarkFile.size)} • {watermarkWidth} x {watermarkHeight}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Watermark text
              </span>
              <textarea
                value={watermarkText}
                onChange={(event) => {
                  setWatermarkText(event.target.value);
                  clearOutput();
                }}
                rows={2}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
              />
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Font family
              </span>
              <select
                value={fontFamily}
                onChange={(event) => {
                  setFontFamily(event.target.value);
                  clearOutput();
                }}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
              >
                {fontFamilies.map((font) => (
                  <option key={font.label} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Font weight
              </span>
              <select
                value={fontWeight}
                onChange={(event) => {
                  setFontWeight(event.target.value as (typeof fontWeights)[number]["value"]);
                  clearOutput();
                }}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
              >
                {fontWeights.map((weight) => (
                  <option key={weight.value} value={weight.value}>
                    {weight.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Font size: {fontSize}px
              </span>
              <input
                type="range"
                min={12}
                max={220}
                step={1}
                value={fontSize}
                onChange={(event) => {
                  setFontSize(Number(event.target.value));
                  clearOutput();
                }}
                className="mt-2 w-full cursor-pointer"
              />
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Text color</span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(event) => {
                    setTextColor(event.target.value);
                    clearOutput();
                  }}
                  className="h-8 w-10 cursor-pointer rounded border-none bg-transparent p-0"
                />
                <span className="text-xs text-[var(--text-secondary)]">{textColor}</span>
              </div>
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Shadow blur: {shadowBlur}px
              </span>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={shadowBlur}
                onChange={(event) => {
                  setShadowBlur(Number(event.target.value));
                  clearOutput();
                }}
                className="mt-2 w-full cursor-pointer"
              />
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Shadow X: {shadowOffsetX}px
              </span>
              <input
                type="range"
                min={-30}
                max={30}
                step={1}
                value={shadowOffsetX}
                onChange={(event) => {
                  setShadowOffsetX(Number(event.target.value));
                  clearOutput();
                }}
                className="mt-2 w-full cursor-pointer"
              />
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Shadow Y: {shadowOffsetY}px
              </span>
              <input
                type="range"
                min={-30}
                max={30}
                step={1}
                value={shadowOffsetY}
                onChange={(event) => {
                  setShadowOffsetY(Number(event.target.value));
                  clearOutput();
                }}
                className="mt-2 w-full cursor-pointer"
              />
            </label>

            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Shadow color
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2">
                <input
                  type="color"
                  value={shadowColor}
                  onChange={(event) => {
                    setShadowColor(event.target.value);
                    clearOutput();
                  }}
                  className="h-8 w-10 cursor-pointer rounded border-none bg-transparent p-0"
                />
                <span className="text-xs text-[var(--text-secondary)]">{shadowColor}</span>
              </div>
            </label>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {watermarkMode === "image" ? (
            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Logo scale: {imageScalePercent}% of image width
              </span>
              <input
                type="range"
                min={4}
                max={60}
                step={1}
                value={imageScalePercent}
                onChange={(event) => {
                  setImageScalePercent(Number(event.target.value));
                  clearOutput();
                }}
                className="mt-2 w-full cursor-pointer"
              />
            </label>
          ) : (
            <div />
          )}

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Opacity: {opacity}%
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={opacity}
              onChange={(event) => {
                setOpacity(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Rotation: {rotation}°
            </span>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(event) => {
                setRotation(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Margin: {margin}px
            </span>
            <input
              type="range"
              min={0}
              max={180}
              step={1}
              value={margin}
              onChange={(event) => {
                setMargin(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              X offset: {offsetX}px
            </span>
            <input
              type="range"
              min={-300}
              max={300}
              step={1}
              value={offsetX}
              onChange={(event) => {
                setOffsetX(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Y offset: {offsetY}px
            </span>
            <input
              type="range"
              min={-300}
              max={300}
              step={1}
              value={offsetY}
              onChange={(event) => {
                setOffsetY(Number(event.target.value));
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
            onClick={() => void handleApplyWatermark()}
            disabled={!sourceDataUrl || isApplying}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceDataUrl && !isApplying
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isApplying ? null : <WatermarkIcon />}
            {isApplying ? "Applying..." : "Apply Watermark"}
          </button>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Preview</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Original</p>
            <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              {!sourceDataUrl ? (
                <p className="text-center text-xs text-[var(--text-secondary)]">
                  Upload an image first.
                </p>
              ) : (
                <Image
                  src={sourceDataUrl}
                  alt="Original preview"
                  width={Math.max(sourceWidth, 1)}
                  height={Math.max(sourceHeight, 1)}
                  unoptimized
                  className="h-auto max-h-[200px] w-auto max-w-full rounded-md"
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
              Watermarked Output
            </p>
            <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              {!outputUrl ? (
                <p className="text-center text-xs text-[var(--text-secondary)]">
                  Apply watermark to preview output.
                </p>
              ) : (
                <Image
                  src={outputUrl}
                  alt="Watermarked output preview"
                  width={Math.max(outputWidth, 1)}
                  height={Math.max(outputHeight, 1)}
                  unoptimized
                  className="h-auto max-h-[200px] w-auto max-w-full rounded-md"
                />
              )}
            </div>
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

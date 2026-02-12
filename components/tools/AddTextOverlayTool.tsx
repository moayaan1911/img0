"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";
type HorizontalAlign = "left" | "center" | "right";
type VerticalAlign = "top" | "middle" | "bottom";

const fontFamilies = [
  { label: "Inter", value: "Inter, Arial, sans-serif" },
  { label: "Geist", value: "Geist, Inter, Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "'Times New Roman', serif" },
  { label: "Courier", value: "'Courier New', monospace" },
  { label: "Impact", value: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif" },
] as const;

const fontWeights = [
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semi Bold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Extra Bold", value: "800" },
] as const;

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
  return `${base || "img0-image"}-text.${format}`;
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

function splitWordByWidth(
  ctx: CanvasRenderingContext2D,
  word: string,
  maxWidth: number,
): string[] {
  if (ctx.measureText(word).width <= maxWidth) {
    return [word];
  }

  const segments: string[] = [];
  let current = "";
  for (const char of word) {
    const next = `${current}${char}`;
    if (current && ctx.measureText(next).width > maxWidth) {
      segments.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments.length > 0 ? segments : [word];
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const normalized = text.replace(/\r/g, "");
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const tokens = paragraph.trim().length > 0 ? paragraph.split(/\s+/) : [];
    if (tokens.length === 0) {
      lines.push("");
      continue;
    }

    const words = tokens.flatMap((word) => splitWordByWidth(ctx, word, maxWidth));
    let currentLine = words[0];

    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${currentLine} ${words[index]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = words[index];
      }
    }

    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
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

function TextIcon() {
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
      <path d="M4 6h16" />
      <path d="M12 6v12" />
      <path d="M7 18h10" />
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

export default function AddTextOverlayTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);

  const [overlayText, setOverlayText] = useState("Your text here");
  const [fontFamily, setFontFamily] = useState<string>(fontFamilies[0].value);
  const [fontWeight, setFontWeight] = useState<(typeof fontWeights)[number]["value"]>("700");
  const [fontSize, setFontSize] = useState(72);
  const [lineHeightPercent, setLineHeightPercent] = useState(120);
  const [textColor, setTextColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(100);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowBlur, setShadowBlur] = useState(12);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(6);
  const [horizontalAlign, setHorizontalAlign] = useState<HorizontalAlign>("center");
  const [verticalAlign, setVerticalAlign] = useState<VerticalAlign>("bottom");
  const [offsetXPercent, setOffsetXPercent] = useState(0);
  const [offsetYPercent, setOffsetYPercent] = useState(0);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(92);
  const [isApplying, setIsApplying] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
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
      return `img0-text.${outputFormat}`;
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
        setSourceDataUrl("");
        setSourceWidth(0);
        setSourceHeight(0);
        setError("Failed to read this image. Try another file.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read this image.");
    };
    reader.readAsDataURL(file);
  }

  async function handleApplyTextOverlay() {
    if (!sourceDataUrl || sourceWidth <= 0 || sourceHeight <= 0) {
      setError("Upload an image first.");
      return;
    }

    if (!overlayText.trim()) {
      setError("Type some text first.");
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

      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = horizontalAlign;
      ctx.textBaseline = "top";

      const paddingX = Math.max(24, Math.round(canvas.width * 0.04));
      const paddingY = Math.max(24, Math.round(canvas.height * 0.04));
      const maxTextWidth = Math.max(canvas.width - paddingX * 2, 1);

      const lines = wrapTextLines(ctx, overlayText, maxTextWidth);
      const lineHeight = (fontSize * lineHeightPercent) / 100;
      const totalTextHeight = lineHeight * lines.length;

      let baseX = canvas.width / 2;
      if (horizontalAlign === "left") {
        baseX = paddingX;
      } else if (horizontalAlign === "right") {
        baseX = canvas.width - paddingX;
      }

      let baseY = paddingY;
      if (verticalAlign === "middle") {
        baseY = (canvas.height - totalTextHeight) / 2;
      } else if (verticalAlign === "bottom") {
        baseY = canvas.height - paddingY - totalTextHeight;
      }

      const horizontalTravel = Math.max((canvas.width - paddingX * 2) / 2, 0);
      const verticalTravel = Math.max((canvas.height - paddingY * 2) / 2, 0);
      const offsetX = (horizontalTravel * clamp(offsetXPercent, -100, 100)) / 100;
      const offsetY = (verticalTravel * clamp(offsetYPercent, -100, 100)) / 100;

      const x = clamp(baseX + offsetX, paddingX, canvas.width - paddingX);
      const yStart = clamp(
        baseY + offsetY,
        paddingY,
        Math.max(canvas.height - paddingY - totalTextHeight, paddingY),
      );

      ctx.globalAlpha = clamp(opacity, 0, 100) / 100;
      ctx.fillStyle = textColor;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;

      lines.forEach((line, index) => {
        const y = yStart + index * lineHeight;
        ctx.fillText(line, x, y, maxTextWidth);
      });

      ctx.restore();

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
      setError("Text overlay failed. Try different text settings.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="add-text-overlay-input-file"
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
            id="add-text-overlay-input-file"
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
              {formatBytes(sourceFile.size)} • {sourceWidth} x {sourceHeight}
            </p>
          </div>
        ) : null}

        <label className="mt-5 block text-sm">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Overlay text</span>
          <textarea
            value={overlayText}
            onChange={(event) => {
              setOverlayText(event.target.value);
              clearOutput();
            }}
            rows={3}
            placeholder="Type your text..."
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
          />
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Use line breaks for multiple lines. Long lines auto-wrap.
          </p>
        </label>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Font family</span>
            <select
              value={fontFamily}
              onChange={(event) => {
                setFontFamily(event.target.value);
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              {fontFamilies.map((font) => (
                <option key={font.label} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Font weight</span>
            <select
              value={fontWeight}
              onChange={(event) => {
                setFontWeight(event.target.value as (typeof fontWeights)[number]["value"]);
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
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
              max={240}
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
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Line height: {lineHeightPercent}%
            </span>
            <input
              type="range"
              min={90}
              max={180}
              step={1}
              value={lineHeightPercent}
              onChange={(event) => {
                setLineHeightPercent(Number(event.target.value));
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
              Opacity: {opacity}%
            </span>
            <input
              type="range"
              min={0}
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
              Horizontal align
            </span>
            <div className="mt-2 flex gap-2">
              {(["left", "center", "right"] as HorizontalAlign[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setHorizontalAlign(value);
                    clearOutput();
                  }}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
                    horizontalAlign === value
                      ? "cursor-pointer border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--background)]"
                      : "cursor-pointer border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-strong)]"
                  }`}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Vertical align
            </span>
            <div className="mt-2 flex gap-2">
              {(["top", "middle", "bottom"] as VerticalAlign[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setVerticalAlign(value);
                    clearOutput();
                  }}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium ${
                    verticalAlign === value
                      ? "cursor-pointer border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--background)]"
                      : "cursor-pointer border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-strong)]"
                  }`}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              X offset: {offsetXPercent}
            </span>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={offsetXPercent}
              onChange={(event) => {
                setOffsetXPercent(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Y offset: {offsetYPercent}
            </span>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={offsetYPercent}
              onChange={(event) => {
                setOffsetYPercent(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Shadow color</span>
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

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Shadow blur: {shadowBlur}px
            </span>
            <input
              type="range"
              min={0}
              max={60}
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
              min={-60}
              max={60}
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
              min={-60}
              max={60}
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
              Output format
            </span>
            <select
              value={outputFormat}
              onChange={(event) => {
                setOutputFormat(event.target.value as OutputFormat);
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
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
            onClick={() => void handleApplyTextOverlay()}
            disabled={!sourceDataUrl || isApplying}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceDataUrl && !isApplying
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isApplying ? null : <TextIcon />}
            {isApplying ? "Applying..." : "Add Text Overlay"}
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
              Text Overlay Output
            </p>
            <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              {!outputUrl ? (
                <p className="text-center text-xs text-[var(--text-secondary)]">
                  Apply text overlay to preview result.
                </p>
              ) : (
                <Image
                  src={outputUrl}
                  alt="Text overlay output preview"
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

"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp";

const fontFamilies = [
  { label: "Impact", value: "Impact, 'Arial Black', sans-serif" },
  { label: "Anton", value: "Anton, Impact, 'Arial Black', sans-serif" },
  { label: "Arial Black", value: "'Arial Black', Arial, sans-serif" },
  { label: "Inter Bold", value: "Inter, Arial, sans-serif" },
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
  return `${base || "img0-image"}-meme.${format}`;
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
  const normalized = text.replace(/\r/g, "");
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().length > 0 ? paragraph.split(/\s+/) : [];
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let line = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${line} ${words[index]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = words[index];
      }
    }
    lines.push(line);
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

function MemeIcon() {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8h10" />
      <path d="M7 12h10" />
      <path d="M7 16h6" />
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

export default function MemeGeneratorTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);

  const [topText, setTopText] = useState("WHEN CODE WORKS");
  const [bottomText, setBottomText] = useState("ON FIRST TRY");
  const [uppercase, setUppercase] = useState(true);
  const [fontFamily, setFontFamily] = useState<string>(fontFamilies[0].value);
  const [fontSize, setFontSize] = useState(64);
  const [fontWeight, setFontWeight] = useState(900);
  const [lineHeightPercent, setLineHeightPercent] = useState(105);
  const [textColor, setTextColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(8);
  const [shadowBlur, setShadowBlur] = useState(8);
  const [textMargin, setTextMargin] = useState(26);
  const [topOffsetY, setTopOffsetY] = useState(0);
  const [bottomOffsetY, setBottomOffsetY] = useState(0);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpg");
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
      return `img0-meme.${outputFormat}`;
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

  async function handleGenerateMeme() {
    if (!sourceDataUrl) {
      setError("Upload an image first.");
      return;
    }

    if (!topText.trim() && !bottomText.trim()) {
      setError("Enter top or bottom text.");
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
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = textColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(0,0,0,0.75)";
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      const lineHeight = (fontSize * lineHeightPercent) / 100;
      const maxWidth = Math.max(canvas.width - textMargin * 2, 1);

      const preparedTop = uppercase ? topText.toUpperCase() : topText;
      const topLines = preparedTop.trim()
        ? wrapTextLines(ctx, preparedTop, maxWidth)
        : [];
      const topStartY = clamp(
        textMargin + topOffsetY,
        0,
        Math.max(canvas.height - textMargin, 0),
      );
      topLines.forEach((line, index) => {
        const y = topStartY + index * lineHeight;
        ctx.strokeText(line, canvas.width / 2, y, maxWidth);
        ctx.fillText(line, canvas.width / 2, y, maxWidth);
      });

      const preparedBottom = uppercase ? bottomText.toUpperCase() : bottomText;
      const bottomLines = preparedBottom.trim()
        ? wrapTextLines(ctx, preparedBottom, maxWidth)
        : [];
      const bottomHeight = bottomLines.length * lineHeight;
      const bottomBaseY = clamp(
        canvas.height - textMargin - bottomHeight + bottomOffsetY,
        0,
        Math.max(canvas.height - bottomHeight, 0),
      );
      bottomLines.forEach((line, index) => {
        const y = bottomBaseY + index * lineHeight;
        ctx.strokeText(line, canvas.width / 2, y, maxWidth);
        ctx.fillText(line, canvas.width / 2, y, maxWidth);
      });

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
      setError("Meme generation failed. Try different settings.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="meme-generator-input-file"
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
          <p className="text-sm font-semibold">Upload meme image</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Drag and drop, or click to choose a file
          </p>
          <input
            id="meme-generator-input-file"
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
          <label className="text-sm sm:col-span-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Top text</span>
            <textarea
              value={topText}
              onChange={(event) => {
                setTopText(event.target.value);
                clearOutput();
              }}
              rows={2}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Bottom text
            </span>
            <textarea
              value={bottomText}
              onChange={(event) => {
                setBottomText(event.target.value);
                clearOutput();
              }}
              rows={2}
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(event) => {
                setUppercase(event.target.checked);
                clearOutput();
              }}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Uppercase style
            </span>
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Font family</span>
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
              Font size: {fontSize}px
            </span>
            <input
              type="range"
              min={16}
              max={180}
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
              Font weight: {fontWeight}
            </span>
            <input
              type="range"
              min={600}
              max={900}
              step={100}
              value={fontWeight}
              onChange={(event) => {
                setFontWeight(Number(event.target.value));
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
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Stroke width: {strokeWidth}px
            </span>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={strokeWidth}
              onChange={(event) => {
                setStrokeWidth(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Shadow blur: {shadowBlur}px
            </span>
            <input
              type="range"
              min={0}
              max={30}
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
              Text margin: {textMargin}px
            </span>
            <input
              type="range"
              min={0}
              max={180}
              step={1}
              value={textMargin}
              onChange={(event) => {
                setTextMargin(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Top Y offset: {topOffsetY}px
            </span>
            <input
              type="range"
              min={-220}
              max={220}
              step={1}
              value={topOffsetY}
              onChange={(event) => {
                setTopOffsetY(Number(event.target.value));
                clearOutput();
              }}
              className="mt-2 w-full cursor-pointer"
            />
          </label>

          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Bottom Y offset: {bottomOffsetY}px
            </span>
            <input
              type="range"
              min={-220}
              max={220}
              step={1}
              value={bottomOffsetY}
              onChange={(event) => {
                setBottomOffsetY(Number(event.target.value));
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
              Stroke color
            </span>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2">
              <input
                type="color"
                value={strokeColor}
                onChange={(event) => {
                  setStrokeColor(event.target.value);
                  clearOutput();
                }}
                className="h-8 w-10 cursor-pointer rounded border-none bg-transparent p-0"
              />
              <span className="text-xs text-[var(--text-secondary)]">{strokeColor}</span>
            </div>
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
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
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
            onClick={() => void handleGenerateMeme()}
            disabled={!sourceDataUrl || isApplying}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceDataUrl && !isApplying
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isApplying ? null : <MemeIcon />}
            {isApplying ? "Generating..." : "Generate Meme"}
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
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Meme Output</p>
            <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              {!outputUrl ? (
                <p className="text-center text-xs text-[var(--text-secondary)]">
                  Generate meme to preview output.
                </p>
              ) : (
                <Image
                  src={outputUrl}
                  alt="Meme output preview"
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

"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type ErrorLevel = "L" | "M" | "Q" | "H";
type OutputFormat = "png" | "jpg";

const DEFAULT_CONTENT = "https://img0.xyz";
const DEFAULT_SIZE = 320;
const DEFAULT_MARGIN = 2;
const DEFAULT_DARK = "#111827";
const DEFAULT_LIGHT = "#ffffff";
const DEFAULT_LEVEL: ErrorLevel = "M";
const DEFAULT_FORMAT: OutputFormat = "png";

const levels: Array<{ value: ErrorLevel; label: string }> = [
  { value: "L", label: "Low" },
  { value: "M", label: "Medium" },
  { value: "Q", label: "Quartile" },
  { value: "H", label: "High" },
];

const outputFormats: Array<{ value: OutputFormat; label: string }> = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
];

function toFileSafeName(input: string, format: OutputFormat): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);

  return slug ? `img0-qr-${slug}.${format}` : `img0-qr-code.${format}`;
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = dataUrl;
  });
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

export default function QRCodeGeneratorTool() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [margin, setMargin] = useState(DEFAULT_MARGIN);
  const [darkColor, setDarkColor] = useState(DEFAULT_DARK);
  const [lightColor, setLightColor] = useState(DEFAULT_LIGHT);
  const [transparentBg, setTransparentBg] = useState(false);
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>(DEFAULT_LEVEL);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(DEFAULT_FORMAT);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadFileName = useMemo(
    () => toFileSafeName(content, outputFormat),
    [content, outputFormat],
  );

  useEffect(() => {
    const trimmed = content.trim();
    if (!trimmed) {
      setQrDataUrl("");
      setIsGenerating(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    const timer = window.setTimeout(async () => {
      setIsGenerating(true);
      setError(null);

      try {
        const dataUrl = await QRCode.toDataURL(trimmed, {
          width: size,
          margin,
          errorCorrectionLevel: errorLevel,
          color: {
            dark: darkColor,
            light: transparentBg ? "#0000" : lightColor,
          },
        });

        if (!isCancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch {
        if (!isCancelled) {
          setQrDataUrl("");
          setError("Unable to generate QR code. Try changing the input.");
        }
      } finally {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      }
    }, 120);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [content, size, margin, darkColor, lightColor, transparentBg, errorLevel]);

  function handleReset() {
    setContent(DEFAULT_CONTENT);
    setSize(DEFAULT_SIZE);
    setMargin(DEFAULT_MARGIN);
    setDarkColor(DEFAULT_DARK);
    setLightColor(DEFAULT_LIGHT);
    setTransparentBg(false);
    setErrorLevel(DEFAULT_LEVEL);
    setOutputFormat(DEFAULT_FORMAT);
  }

  async function handleDownload() {
    if (!qrDataUrl || isGenerating || isPreparingDownload) {
      return;
    }

    setIsPreparingDownload(true);
    try {
      if (outputFormat === "png") {
        downloadDataUrl(qrDataUrl, downloadFileName);
        return;
      }

      const image = await loadImageFromDataUrl(qrDataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas unavailable");
      }

      ctx.fillStyle = transparentBg ? "#ffffff" : lightColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      downloadDataUrl(canvas.toDataURL("image/jpeg", 0.92), downloadFileName);
    } catch {
      setError("Unable to export QR code in selected format.");
    } finally {
      setIsPreparingDownload(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="qr-content"
          className="text-sm font-semibold tracking-tight"
        >
          Text or URL
        </label>
        <textarea
          id="qr-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Enter text or URL..."
          rows={4}
          className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {content.length} characters
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="qr-size"
              className="text-xs font-medium text-[var(--text-secondary)]"
            >
              Size: {size}px
            </label>
            <input
              id="qr-size"
              type="range"
              min={128}
              max={1024}
              step={16}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              className="mt-2 w-full cursor-pointer"
            />
          </div>
          <div>
            <label
              htmlFor="qr-margin"
              className="text-xs font-medium text-[var(--text-secondary)]"
            >
              Margin: {margin}
            </label>
            <input
              id="qr-margin"
              type="range"
              min={0}
              max={10}
              step={1}
              value={margin}
              onChange={(event) => setMargin(Number(event.target.value))}
              className="mt-2 w-full cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
            <span className="text-[var(--text-secondary)]">Dark color</span>
            <input
              type="color"
              value={darkColor}
              onChange={(event) => setDarkColor(event.target.value)}
              className="h-8 w-8 cursor-pointer border-none bg-transparent p-0"
            />
          </label>

          {transparentBg ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              Background: Transparent
            </div>
          ) : (
            <label className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
              <span className="text-[var(--text-secondary)]">Light color</span>
              <input
                type="color"
                value={lightColor}
                onChange={(event) => setLightColor(event.target.value)}
                className="h-8 w-8 cursor-pointer border-none bg-transparent p-0"
              />
            </label>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={transparentBg}
              onChange={(event) => setTransparentBg(event.target.checked)}
              className="cursor-pointer"
            />
            Transparent background
          </label>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Error correction
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setErrorLevel(level.value)}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  errorLevel === level.value
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--background)]"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-strong)]"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="mt-6 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
        >
          Reset
        </button>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Preview</p>
        <div className="mt-4 flex min-h-[320px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          {isGenerating ? (
            <p className="text-sm text-[var(--text-secondary)]">Generating...</p>
          ) : null}
          {!isGenerating && error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : null}
          {!isGenerating && !error && qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt="Generated QR code preview"
              width={size}
              height={size}
              unoptimized
              className="h-auto max-h-[280px] w-auto max-w-full rounded-md"
            />
          ) : null}
          {!isGenerating && !error && !qrDataUrl ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Enter text or URL to generate a QR code.
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
            <span>Format</span>
            <select
              value={outputFormat}
              onChange={(event) =>
                setOutputFormat(event.target.value as OutputFormat)
              }
              className="cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
            >
              {outputFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!qrDataUrl || isGenerating || isPreparingDownload}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              qrDataUrl && !isGenerating && !isPreparingDownload
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isPreparingDownload ? null : <DownloadIcon />}
            {isPreparingDownload ? "Preparing..." : "Download"}
          </button>
        </div>
        {outputFormat === "jpg" && transparentBg ? (
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            Transparent background exports with white fill in JPG.
          </p>
        ) : null}
      </section>
    </div>
  );
}

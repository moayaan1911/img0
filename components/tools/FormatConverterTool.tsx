"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type OutputFormat = "png" | "jpg" | "webp" | "ico";

const formatOptions: Array<{ value: OutputFormat; label: string }> = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "webp", label: "WebP" },
  { value: "ico", label: "ICO (Favicon)" },
];

const icoSizes = [16, 32, 48, 64, 128, 256];

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

function ConvertIcon() {
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
      <path d="M7 7h10v10" />
      <path d="m7 17 10-10" />
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

function getExtension(format: OutputFormat): string {
  if (format === "jpg") {
    return "jpg";
  }

  return format;
}

function getMimeType(format: OutputFormat): string {
  if (format === "jpg") {
    return "image/jpeg";
  }

  if (format === "webp") {
    return "image/webp";
  }

  if (format === "ico") {
    return "image/x-icon";
  }

  return "image/png";
}

function outputName(original: string, format: OutputFormat): string {
  const ext = getExtension(format);
  const dotIndex = original.lastIndexOf(".");
  const base = dotIndex > 0 ? original.slice(0, dotIndex) : original;
  const safeBase = base.trim() || "img0-file";
  return `${safeBase}.${ext}`;
}

function createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
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

function createIcoFromPngBytes(pngBuffer: ArrayBuffer, size: number): Blob {
  const iconDir = new Uint8Array(6);
  iconDir[0] = 0;
  iconDir[1] = 0;
  iconDir[2] = 1;
  iconDir[3] = 0;
  iconDir[4] = 1;
  iconDir[5] = 0;

  const entry = new Uint8Array(16);
  entry[0] = size === 256 ? 0 : size;
  entry[1] = size === 256 ? 0 : size;
  entry[2] = 0;
  entry[3] = 0;
  entry[4] = 1;
  entry[5] = 0;
  entry[6] = 32;
  entry[7] = 0;

  const bytesInRes = pngBuffer.byteLength;
  entry[8] = bytesInRes & 0xff;
  entry[9] = (bytesInRes >> 8) & 0xff;
  entry[10] = (bytesInRes >> 16) & 0xff;
  entry[11] = (bytesInRes >> 24) & 0xff;

  const imageOffset = 22;
  entry[12] = imageOffset & 0xff;
  entry[13] = (imageOffset >> 8) & 0xff;
  entry[14] = (imageOffset >> 16) & 0xff;
  entry[15] = (imageOffset >> 24) & 0xff;

  return new Blob([iconDir, entry, pngBuffer], { type: "image/x-icon" });
}

export default function FormatConverterTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [icoSize, setIcoSize] = useState(64);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    return () => {
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [outputUrl]);

  const outputFileName = useMemo(() => {
    if (!sourceFile) {
      return `converted.${getExtension(format)}`;
    }
    return outputName(sourceFile.name, format);
  }, [format, sourceFile]);

  function resetOutput() {
    setOutputBlob(null);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl("");
    }
  }

  async function onFileSelect(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setError(null);
    setSourceFile(file);
    resetOutput();

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = String(reader.result || "");
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

  async function handleConvert() {
    if (!sourceDataUrl || !sourceFile) {
      setError("Upload an image first.");
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const image = await createImageFromDataUrl(sourceDataUrl);
      let blob: Blob;

      if (format === "ico") {
        const canvas = createCanvas(icoSize, icoSize);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Canvas unavailable");
        }

        const scale = Math.min(icoSize / image.naturalWidth, icoSize / image.naturalHeight);
        const drawWidth = Math.round(image.naturalWidth * scale);
        const drawHeight = Math.round(image.naturalHeight * scale);
        const x = Math.round((icoSize - drawWidth) / 2);
        const y = Math.round((icoSize - drawHeight) / 2);

        ctx.clearRect(0, 0, icoSize, icoSize);
        ctx.drawImage(image, x, y, drawWidth, drawHeight);

        const pngBlob = await canvasToBlob(canvas, "image/png");
        const pngBuffer = await pngBlob.arrayBuffer();
        blob = createIcoFromPngBytes(pngBuffer, icoSize);
      } else {
        const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Canvas unavailable");
        }

        ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
        const mimeType = getMimeType(format);
        const exportQuality =
          format === "jpg" || format === "webp" ? quality / 100 : undefined;
        blob = await canvasToBlob(canvas, mimeType, exportQuality);
      }

      resetOutput();
      const url = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(url);
    } catch {
      setError("Conversion failed. Try another image or format.");
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="format-input-file"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            void onFileSelect(file);
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
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            JPG, PNG, WebP, GIF, BMP and more
          </p>
          <input
            id="format-input-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void onFileSelect(file);
            }}
          />
        </label>

        {sourceFile ? (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <p className="text-sm font-medium">{sourceFile.name}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {formatBytes(sourceFile.size)} • {sourceWidth} x {sourceHeight} •{" "}
              {(sourceFile.type || "unknown").replace("image/", "").toUpperCase()}
            </p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Output format
            </span>
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as OutputFormat)}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              {formatOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {format === "ico" ? (
            <label className="text-sm">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                ICO size
              </span>
              <select
                value={icoSize}
                onChange={(event) => setIcoSize(Number(event.target.value))}
                className="mt-2 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none"
              >
                {icoSizes.map((size) => (
                  <option
                    key={size}
                    value={size}
                  >
                    {size} x {size}
                  </option>
                ))}
              </select>
            </label>
          ) : (
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
              />
            </label>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleConvert()}
            disabled={!sourceFile || isConverting}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              sourceFile && !isConverting
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isConverting ? null : <ConvertIcon />}
            {isConverting ? "Converting..." : "Convert"}
          </button>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">Output Preview</p>
        <div className="mt-4 flex min-h-[300px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          {!outputUrl ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Convert an image to preview output here.
            </p>
          ) : (
            <Image
              src={outputUrl}
              alt="Converted output preview"
              width={320}
              height={320}
              unoptimized
              className="h-auto max-h-[260px] w-auto max-w-full rounded-md"
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={outputUrl || undefined}
            download={outputFileName}
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
              {outputName(sourceFile?.name || "converted", format)} •{" "}
              {formatBytes(outputBlob.size)}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

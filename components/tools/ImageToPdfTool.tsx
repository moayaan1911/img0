"use client";

import Image from "next/image";
import { jsPDF } from "jspdf";
import { useEffect, useMemo, useState } from "react";

type UploadedImage = {
  id: string;
  name: string;
  size: number;
  width: number;
  height: number;
  dataUrl: string;
};

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

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

function getId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toBaseName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return base.trim() || "img0-export";
}

function roundMm(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function getA4Placement(widthPx: number, heightPx: number) {
  const safeWidthPx = Math.max(1, widthPx);
  const safeHeightPx = Math.max(1, heightPx);
  const imageAspect = safeWidthPx / safeHeightPx;
  const pageAspect = A4_WIDTH_MM / A4_HEIGHT_MM;

  let drawWidth = A4_WIDTH_MM;
  let drawHeight = A4_HEIGHT_MM;

  if (imageAspect > pageAspect) {
    drawHeight = A4_WIDTH_MM / imageAspect;
  } else {
    drawWidth = A4_HEIGHT_MM * imageAspect;
  }

  drawWidth = Math.min(drawWidth, A4_WIDTH_MM);
  drawHeight = Math.min(drawHeight, A4_HEIGHT_MM);

  const x = Math.max(0, (A4_WIDTH_MM - drawWidth) / 2);
  const y = Math.max(0, (A4_HEIGHT_MM - drawHeight) / 2);

  return {
    x: roundMm(x),
    y: roundMm(y),
    width: roundMm(drawWidth),
    height: roundMm(drawHeight),
  };
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

async function normalizeImageForPdf(dataUrl: string): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  const image = await loadImageFromDataUrl(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas unavailable");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.92),
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

export default function ImageToPdfTool() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
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

  const outputFileName = useMemo(() => {
    if (images.length === 0) {
      return "img0-images.pdf";
    }
    return `${toBaseName(images[0].name)}-bundle.pdf`;
  }, [images]);

  function clearOutput() {
    setOutputBlob(null);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl("");
    }
  }

  function clearAll() {
    setImages([]);
    setError(null);
    clearOutput();
  }

  async function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const inputFiles = Array.from(fileList);
    const imageFiles = inputFiles.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setError("Please upload valid image files.");
      return;
    }

    setIsReading(true);
    setError(null);
    clearOutput();

    try {
      const nextImages = await Promise.all(
        imageFiles.map(async (file) => {
          const dataUrl = await readFileAsDataUrl(file);
          const image = await loadImageFromDataUrl(dataUrl);

          return {
            id: getId(),
            name: file.name,
            size: file.size,
            width: image.naturalWidth,
            height: image.naturalHeight,
            dataUrl,
          } satisfies UploadedImage;
        }),
      );

      setImages((prev) => [...prev, ...nextImages]);

      if (imageFiles.length !== inputFiles.length) {
        setError("Some non-image files were skipped.");
      }
    } catch {
      setError("Failed to read one or more images. Try again.");
    } finally {
      setIsReading(false);
    }
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((item) => item.id !== id));
    clearOutput();
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) {
        return prev;
      }

      const copy = [...prev];
      const [current] = copy.splice(index, 1);
      copy.splice(target, 0, current);
      return copy;
    });
    clearOutput();
  }

  async function handleConvert() {
    if (images.length === 0) {
      setError("Upload at least one image first.");
      return;
    }

    setError(null);
    setIsConverting(true);

    try {
      let document: jsPDF | null = null;

      for (let index = 0; index < images.length; index += 1) {
        const source = images[index];
        const normalized = await normalizeImageForPdf(source.dataUrl);
        const draw = getA4Placement(normalized.width, normalized.height);

        if (!document) {
          document = new jsPDF({
            unit: "mm",
            format: "a4",
            orientation: "portrait",
            compress: true,
            putOnlyUsedFonts: true,
            floatPrecision: 16,
          });
        } else {
          document.addPage("a4", "portrait");
        }

        document.addImage(
          normalized.dataUrl,
          "JPEG",
          draw.x,
          draw.y,
          draw.width,
          draw.height,
          undefined,
          "FAST",
        );
      }

      if (!document) {
        throw new Error("No pages generated");
      }

      const blob = document.output("blob");
      clearOutput();
      const url = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(url);
    } catch {
      setError("PDF export failed. Try smaller images or fewer files.");
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <label
          htmlFor="image-to-pdf-input"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            void addFiles(event.dataTransfer.files);
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
          <p className="text-sm font-semibold">Upload image(s)</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Drag and drop or click to add one or more images
          </p>
          <input
            id="image-to-pdf-input"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <p className="text-xs text-[var(--text-secondary)]">
            Output is fixed to A4. Images are auto-fitted inside page with no crop.
          </p>
        </div>

        {images.length > 0 ? (
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Pages: {images.length}
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="cursor-pointer rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {images.map((image, index) => (
                <article
                  key={image.id}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2"
                >
                  <Image
                    src={image.dataUrl}
                    alt={image.name}
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 rounded-md border border-[var(--border)] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{image.name}</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {image.width} x {image.height} • {formatBytes(image.size)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      className="cursor-pointer rounded-md border border-[var(--border)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === images.length - 1}
                      className="cursor-pointer rounded-md border border-[var(--border)] px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="cursor-pointer rounded-md border border-[var(--border)] px-2 py-1 text-xs text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleConvert()}
            disabled={images.length === 0 || isConverting || isReading}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              images.length > 0 && !isConverting && !isReading
                ? "cursor-pointer bg-[var(--text-primary)] text-[var(--background)] transition hover:opacity-90"
                : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--text-secondary)] opacity-70"
            }`}
          >
            {isConverting ? null : <ConvertIcon />}
            {isReading ? "Reading..." : isConverting ? "Creating PDF..." : "Create PDF"}
          </button>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-sm font-semibold tracking-tight">PDF Preview</p>
        <div className="mt-4 min-h-[380px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
          {!outputUrl ? (
            <div className="flex min-h-[380px] items-center justify-center p-4 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                Generate PDF to preview it here.
              </p>
            </div>
          ) : (
            <iframe
              src={outputUrl}
              title="Generated PDF Preview"
              className="h-[420px] w-full"
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
            Download PDF
          </a>
          {outputBlob ? (
            <p className="text-xs text-[var(--text-secondary)]">
              {outputFileName} • {formatBytes(outputBlob.size)}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

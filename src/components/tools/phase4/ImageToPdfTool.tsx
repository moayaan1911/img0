"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { jsPDF } from "jspdf";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { fileToDataUrl, formatFileSize, loadImageFromSource } from "@/src/lib/image-utils";

type PagePreset = "a4" | "letter" | "custom";
type Orientation = "portrait" | "landscape";

type SelectedImage = {
  id: string;
  file: File;
  url: string;
};

const PAGE_PRESETS_MM: Record<Exclude<PagePreset, "custom">, [number, number]> = {
  a4: [210, 297],
  letter: [215.9, 279.4],
};

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const clone = [...items];
  const [item] = clone.splice(fromIndex, 1);
  clone.splice(toIndex, 0, item);
  return clone;
}

function sanitizeFiles(fileList: FileList | File[]): File[] {
  return Array.from(fileList).filter((file) => file.type.startsWith("image/"));
}

export default function ImageToPdfTool() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pagePreset, setPagePreset] = useState<PagePreset>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [customWidthMm, setCustomWidthMm] = useState(210);
  const [customHeightMm, setCustomHeightMm] = useState(297);
  const [marginMm, setMarginMm] = useState(12);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current = [];
    };
  }, []);

  const clearOutput = () => {
    setOutputBlob(null);
  };

  const handleAddFiles = (files: FileList | File[]) => {
    const safeFiles = sanitizeFiles(files);
    if (safeFiles.length === 0) {
      setErrorMessage("Please choose valid image files (PNG, JPG, WebP, etc.).");
      return;
    }

    setErrorMessage(null);
    clearOutput();

    const nextItems = safeFiles.map((file) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      return {
        id: crypto.randomUUID(),
        file,
        url,
      };
    });

    setImages((previous) => [...previous, ...nextItems]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleAddFiles(files);
    }
    event.target.value = "";
  };

  const removeImage = (id: string) => {
    clearOutput();
    setImages((previous) => {
      const target = previous.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        urlsRef.current = urlsRef.current.filter((url) => url !== target.url);
      }
      return previous.filter((item) => item.id !== id);
    });
  };

  const resetAll = () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
    setImages([]);
    setOutputBlob(null);
    setErrorMessage(null);
    setPagePreset("a4");
    setOrientation("portrait");
    setCustomWidthMm(210);
    setCustomHeightMm(297);
    setMarginMm(12);
  };

  const pageSize = useMemo<[number, number]>(() => {
    const preset = pagePreset === "custom" ? [customWidthMm, customHeightMm] : PAGE_PRESETS_MM[pagePreset];
    const [width, height] = preset;
    if (orientation === "portrait") {
      return width <= height ? [width, height] : [height, width];
    }
    return width >= height ? [width, height] : [height, width];
  }, [customHeightMm, customWidthMm, orientation, pagePreset]);

  const handleGeneratePdf = async () => {
    if (images.length === 0) {
      setErrorMessage("Add at least one image before generating PDF.");
      return;
    }

    const [pageWidth, pageHeight] = pageSize;
    const safeMargin = Math.max(0, Math.min(marginMm, Math.min(pageWidth, pageHeight) / 2 - 2));
    const contentWidth = pageWidth - safeMargin * 2;
    const contentHeight = pageHeight - safeMargin * 2;

    if (contentWidth <= 0 || contentHeight <= 0) {
      setErrorMessage("Margin is too large for selected page size.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const pdf = new jsPDF({
        orientation: orientation === "portrait" ? "p" : "l",
        unit: "mm",
        format: [pageWidth, pageHeight],
        compress: true,
      });

      for (let index = 0; index < images.length; index += 1) {
        const item = images[index];
        if (index > 0) {
          pdf.addPage([pageWidth, pageHeight], orientation === "portrait" ? "p" : "l");
        }

        const dataUrl = await fileToDataUrl(item.file);
        const image = await loadImageFromSource(dataUrl);
        const scale = Math.min(contentWidth / image.width, contentHeight / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const drawX = safeMargin + (contentWidth - drawWidth) / 2;
        const drawY = safeMargin + (contentHeight - drawHeight) / 2;

        const format = item.file.type.includes("png")
          ? "PNG"
          : item.file.type.includes("webp")
            ? "WEBP"
            : "JPEG";

        pdf.addImage(dataUrl, format, drawX, drawY, drawWidth, drawHeight, undefined, "FAST");
      }

      const blob = pdf.output("blob");
      setOutputBlob(blob);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate PDF.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const outputFileName = useMemo(() => {
    if (images.length === 0) {
      return "images-to-pdf.pdf";
    }
    const firstName = images[0].file.name.replace(/\.[^.]+$/u, "");
    return `${firstName}-bundle.pdf`;
  }, [images]);

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 4 • PDF & Document
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Image to PDF</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Merge multiple images into a single downloadable PDF with page size, orientation, and
          margin controls.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Generating PDF..." />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload Images
            </h2>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleAddFiles(event.dataTransfer.files);
              }}
              className={`rounded-2xl border border-dashed px-6 py-8 text-center transition ${
                isDragging
                  ? "border-[var(--text-primary)] bg-[var(--surface-strong)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              <p className="text-base font-semibold">Drop multiple images here</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                PNG, JPG, WebP supported. Files stay on your device.
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-5 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
              >
                Choose Images
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleInputChange}
                className="sr-only"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => void handleGeneratePdf()}
                disabled={images.length === 0 || isProcessing}
                className="rounded-lg bg-[var(--text-primary)] px-3 py-2 text-xs font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate PDF
              </button>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. PDF Settings
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--text-secondary)]">
                Page Size
                <select
                  value={pagePreset}
                  onChange={(event) => setPagePreset(event.target.value as PagePreset)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="custom">Custom (mm)</option>
                </select>
              </label>

              <label className="text-xs text-[var(--text-secondary)]">
                Orientation
                <select
                  value={orientation}
                  onChange={(event) => setOrientation(event.target.value as Orientation)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </label>
            </div>

            {pagePreset === "custom" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-[var(--text-secondary)]">
                  Width (mm)
                  <input
                    type="number"
                    min={50}
                    max={1200}
                    value={customWidthMm}
                    onChange={(event) => setCustomWidthMm(Number(event.target.value) || 210)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Height (mm)
                  <input
                    type="number"
                    min={50}
                    max={1200}
                    value={customHeightMm}
                    onChange={(event) => setCustomHeightMm(Number(event.target.value) || 297)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                </label>
              </div>
            ) : null}

            <label className="block text-xs text-[var(--text-secondary)]">
              Margin: {marginMm} mm
              <input
                type="range"
                min={0}
                max={40}
                value={marginMm}
                onChange={(event) => setMarginMm(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>

            <p className="text-xs text-[var(--text-secondary)]">
              Effective page: {pageSize[0].toFixed(1)}mm x {pageSize[1].toFixed(1)}mm
            </p>
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
              3. Image Order
            </h2>

            {images.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Upload multiple images to arrange their PDF order.
              </p>
            ) : (
              <ul className="space-y-2">
                {images.map((item, index) => (
                  <li
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggingId(item.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!draggingId || draggingId === item.id) {
                        return;
                      }
                      const fromIndex = images.findIndex((entry) => entry.id === draggingId);
                      const toIndex = images.findIndex((entry) => entry.id === item.id);
                      if (fromIndex < 0 || toIndex < 0) {
                        return;
                      }
                      clearOutput();
                      setImages((previous) => moveItem(previous, fromIndex, toIndex));
                      setDraggingId(null);
                    }}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.file.name}
                      className="h-14 w-14 rounded-lg border border-[var(--border)] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.file.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (index === 0) {
                            return;
                          }
                          clearOutput();
                          setImages((previous) => moveItem(previous, index, index - 1));
                        }}
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (index === images.length - 1) {
                            return;
                          }
                          clearOutput();
                          setImages((previous) => moveItem(previous, index, index + 1));
                        }}
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(item.id)}
                        className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={outputBlob}
              fileName={outputFileName}
              label="Download PDF"
              disabledReason="Generate PDF first."
            />
          </section>
        </div>
      </div>
    </section>
  );
}

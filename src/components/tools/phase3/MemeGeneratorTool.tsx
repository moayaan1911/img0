"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import {
  canvasToBlob,
  createCanvas,
  fileToImage,
  isCanvasMimeTypeSupported,
  normalizeMimeType,
  replaceFileExtension,
} from "@/src/lib/image-utils";

type DragStart = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

function drawCenteredMemeText(
  context: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number,
  y: number,
  fontSize: number,
  textColor: string,
  strokeColor: string,
  strokeWidth: number,
) {
  const normalized = text.trim().toUpperCase();
  if (!normalized) {
    return;
  }

  context.font = `900 ${fontSize}px "Impact", "Arial Black", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.lineJoin = "round";
  context.lineWidth = strokeWidth;
  context.strokeStyle = strokeColor;
  context.fillStyle = textColor;

  context.strokeText(normalized, canvasWidth / 2, y);
  context.fillText(normalized, canvasWidth / 2, y);
}

export default function MemeGeneratorTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [topText, setTopText] = useState("WHEN YOU SHIP PHASE 3");
  const [bottomText, setBottomText] = useState("AND IT ACTUALLY WORKS");
  const [customText, setCustomText] = useState("custom text");
  const [fontSize, setFontSize] = useState(52);
  const [textColor, setTextColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [customX, setCustomX] = useState(50);
  const [customY, setCustomY] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceUrlRef = useRef<string | null>(null);
  const dragStateRef = useRef<DragStart | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
    };
  }, []);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setOutputBlob(null);

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    sourceUrlRef.current = objectUrl;
    setSourceFile(file);
    setSourceUrl(objectUrl);
  };

  const outputName = useMemo(() => {
    if (!sourceFile) {
      return "meme-output.png";
    }
    const ext = outputBlob?.type.split("/")[1] ?? "png";
    return replaceFileExtension(sourceFile.name, ext);
  }, [outputBlob?.type, sourceFile]);

  const handleGenerate = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const image = await fileToImage(sourceFile);
      const outputMimeType = normalizeMimeType(sourceFile.type);
      const safeMimeType = isCanvasMimeTypeSupported(outputMimeType)
        ? outputMimeType
        : "image/png";

      const canvas = createCanvas(image.width, image.height);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.drawImage(image, 0, 0);

      drawCenteredMemeText(
        context,
        topText,
        image.width,
        Math.max(12, image.height * 0.03),
        fontSize,
        textColor,
        strokeColor,
        strokeWidth,
      );
      drawCenteredMemeText(
        context,
        bottomText,
        image.width,
        Math.max(12, image.height - fontSize - image.height * 0.03),
        fontSize,
        textColor,
        strokeColor,
        strokeWidth,
      );

      if (customText.trim()) {
        context.font = `900 ${Math.max(12, fontSize - 8)}px "Impact", "Arial Black", sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.lineJoin = "round";
        context.lineWidth = Math.max(2, strokeWidth - 1);
        context.strokeStyle = strokeColor;
        context.fillStyle = textColor;
        const x = (customX / 100) * image.width;
        const y = (customY / 100) * image.height;
        context.strokeText(customText, x, y);
        context.fillText(customText, x, y);
      }

      const blob = await canvasToBlob(canvas, safeMimeType, 0.92);
      setOutputBlob(blob);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate meme.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 3 • Text & Overlay
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Meme Generator
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Create classic meme text with draggable custom caption and export instantly.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Rendering meme..." />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload
            </h2>
            <ImageUploader onFileSelect={handleFileSelect} />
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Text Controls
            </h2>

            <label className="block text-xs text-[var(--text-secondary)]">
              Top Text
              <input
                type="text"
                value={topText}
                onChange={(event) => setTopText(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs text-[var(--text-secondary)]">
              Bottom Text
              <input
                type="text"
                value={bottomText}
                onChange={(event) => setBottomText(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-xs text-[var(--text-secondary)]">
              Custom Caption (drag it on preview)
              <input
                type="text"
                value={customText}
                onChange={(event) => setCustomText(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--text-secondary)]">
                Font Size: {fontSize}
                <input
                  type="range"
                  min={16}
                  max={96}
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Stroke Width: {strokeWidth}
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={strokeWidth}
                  onChange={(event) => setStrokeWidth(Number(event.target.value))}
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Text Color
                <input
                  type="color"
                  value={textColor}
                  onChange={(event) => setTextColor(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Stroke Color
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(event) => setStrokeColor(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate Meme
            </button>
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
              3. Live Preview
            </h2>
            <div
              ref={previewRef}
              className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-2"
              onMouseMove={(event) => {
                if (!dragStateRef.current || !previewRef.current) {
                  return;
                }

                const rect = previewRef.current.getBoundingClientRect();
                const dx = ((event.clientX - dragStateRef.current.startX) / rect.width) * 100;
                const dy =
                  ((event.clientY - dragStateRef.current.startY) / rect.height) * 100;

                const nextX = Math.min(95, Math.max(5, dragStateRef.current.originX + dx));
                const nextY = Math.min(95, Math.max(5, dragStateRef.current.originY + dy));
                setCustomX(nextX);
                setCustomY(nextY);
              }}
              onMouseUp={() => {
                dragStateRef.current = null;
              }}
              onMouseLeave={() => {
                dragStateRef.current = null;
              }}
            >
              {sourceUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sourceUrl}
                    alt="Meme preview"
                    className="max-h-[420px] w-full rounded-lg object-contain"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-lg">
                    <p
                      className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 px-3 text-center font-black uppercase tracking-wide"
                      style={{
                        fontSize: `${fontSize / 2.3}px`,
                        color: textColor,
                        WebkitTextStroke: `${Math.max(1, strokeWidth / 2)}px ${strokeColor}`,
                        textShadow: `0 2px 0 ${strokeColor}`,
                      }}
                    >
                      {topText}
                    </p>
                    <p
                      className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 px-3 text-center font-black uppercase tracking-wide"
                      style={{
                        fontSize: `${fontSize / 2.3}px`,
                        color: textColor,
                        WebkitTextStroke: `${Math.max(1, strokeWidth / 2)}px ${strokeColor}`,
                        textShadow: `0 2px 0 ${strokeColor}`,
                      }}
                    >
                      {bottomText}
                    </p>
                    <button
                      type="button"
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded-md border border-white/60 bg-black/40 px-2 py-1 text-xs font-semibold text-white"
                      style={{ left: `${customX}%`, top: `${customY}%` }}
                      onMouseDown={(event) => {
                        dragStateRef.current = {
                          startX: event.clientX,
                          startY: event.clientY,
                          originX: customX,
                          originY: customY,
                        };
                      }}
                    >
                      {customText || "Drag text"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Upload an image to start creating meme previews.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={outputBlob}
              fileName={outputName}
              label="Download Meme"
              disabledReason="Generate meme first."
            />
          </section>
        </div>
      </div>
    </section>
  );
}


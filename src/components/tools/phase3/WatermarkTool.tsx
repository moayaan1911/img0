"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import {
  canvasToBlob,
  clamp,
  createCanvas,
  fileToImage,
  formatFileSize,
} from "@/src/lib/image-utils";

type DragTarget = "text" | "logo";

type DragState = {
  target: DragTarget;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

function drawSingleTextWatermark(
  context: CanvasRenderingContext2D,
  watermarkText: string,
  canvasWidth: number,
  canvasHeight: number,
  xPercent: number,
  yPercent: number,
  fontSize: number,
  color: string,
  opacity: number,
  rotation: number,
) {
  const text = watermarkText.trim();
  if (!text) {
    return;
  }

  context.save();
  context.translate((xPercent / 100) * canvasWidth, (yPercent / 100) * canvasHeight);
  context.rotate((rotation * Math.PI) / 180);
  context.globalAlpha = opacity;
  context.font = `700 ${fontSize}px "Inter", "Arial", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = color;
  context.fillText(text, 0, 0);
  context.restore();
}

function drawSingleLogoWatermark(
  context: CanvasRenderingContext2D,
  logoImage: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  xPercent: number,
  yPercent: number,
  widthPercent: number,
  opacity: number,
  rotation: number,
) {
  const drawWidth = Math.max(20, (widthPercent / 100) * canvasWidth);
  const drawHeight = drawWidth * (logoImage.height / logoImage.width);

  context.save();
  context.translate((xPercent / 100) * canvasWidth, (yPercent / 100) * canvasHeight);
  context.rotate((rotation * Math.PI) / 180);
  context.globalAlpha = opacity;
  context.drawImage(logoImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  context.restore();
}

function drawTiledWatermark(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  options: {
    text: string;
    fontSize: number;
    color: string;
    textOpacity: number;
    logoImage: HTMLImageElement | null;
    logoWidthPercent: number;
    logoOpacity: number;
    gap: number;
    rotation: number;
  },
) {
  const {
    text,
    fontSize,
    color,
    textOpacity,
    logoImage,
    logoWidthPercent,
    logoOpacity,
    gap,
    rotation,
  } = options;
  const cleanText = text.trim();

  context.save();
  context.translate(canvasWidth / 2, canvasHeight / 2);
  context.rotate((rotation * Math.PI) / 180);

  if (cleanText) {
    context.font = `700 ${fontSize}px "Inter", "Arial", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = color;
    context.globalAlpha = textOpacity;

    const textWidth = Math.max(140, context.measureText(cleanText).width + gap);
    const textHeight = Math.max(fontSize * 2, fontSize + gap);

    for (let y = -canvasHeight * 1.6; y <= canvasHeight * 1.6; y += textHeight) {
      for (let x = -canvasWidth * 1.6; x <= canvasWidth * 1.6; x += textWidth) {
        context.fillText(cleanText, x, y);
      }
    }
  }

  if (logoImage) {
    const drawWidth = Math.max(20, (logoWidthPercent / 100) * canvasWidth);
    const drawHeight = drawWidth * (logoImage.height / logoImage.width);
    const stepX = drawWidth + gap;
    const stepY = drawHeight + gap;

    context.globalAlpha = logoOpacity;
    for (let y = -canvasHeight * 1.6; y <= canvasHeight * 1.6; y += stepY) {
      for (let x = -canvasWidth * 1.6; x <= canvasWidth * 1.6; x += stepX) {
        context.drawImage(
          logoImage,
          x - drawWidth / 2,
          y - drawHeight / 2,
          drawWidth,
          drawHeight,
        );
      }
    }
  }

  context.restore();
}

export default function WatermarkTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [watermarkText, setWatermarkText] = useState("img0.xyz");
  const [fontSize, setFontSize] = useState(46);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textOpacity, setTextOpacity] = useState(0.34);
  const [textRotation, setTextRotation] = useState(-18);
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(50);
  const [logoWidthPercent, setLogoWidthPercent] = useState(25);
  const [logoOpacity, setLogoOpacity] = useState(0.35);
  const [logoRotation, setLogoRotation] = useState(-18);
  const [logoX, setLogoX] = useState(50);
  const [logoY, setLogoY] = useState(64);
  const [tilePattern, setTilePattern] = useState(false);
  const [tileGap, setTileGap] = useState(130);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sourceUrlRef = useRef<string | null>(null);
  const logoUrlRef = useRef<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
      if (logoUrlRef.current) {
        URL.revokeObjectURL(logoUrlRef.current);
      }
    };
  }, []);

  const outputName = useMemo(() => {
    if (!sourceFile) {
      return "watermark-output.png";
    }
    const baseName = sourceFile.name.replace(/\.[^.]+$/u, "");
    return `${baseName}-watermarked.png`;
  }, [sourceFile]);

  const handleSourceFileSelect = (file: File) => {
    setErrorMessage(null);
    setOutputBlob(null);

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    sourceUrlRef.current = nextUrl;
    setSourceFile(file);
    setSourceUrl(nextUrl);
  };

  const handleLogoFileSelect = (file: File) => {
    setErrorMessage(null);
    setOutputBlob(null);

    if (logoUrlRef.current) {
      URL.revokeObjectURL(logoUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    logoUrlRef.current = nextUrl;
    setLogoFile(file);
    setLogoUrl(nextUrl);
  };

  const handleGenerate = async () => {
    if (!sourceFile) {
      return;
    }

    if (!watermarkText.trim() && !logoFile) {
      setErrorMessage("Add text or a logo watermark before generating output.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const baseImage = await fileToImage(sourceFile);
      const logoImage = logoFile ? await fileToImage(logoFile) : null;
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.drawImage(baseImage, 0, 0);

      if (tilePattern) {
        drawTiledWatermark(context, baseImage.width, baseImage.height, {
          text: watermarkText,
          fontSize,
          color: textColor,
          textOpacity,
          logoImage,
          logoWidthPercent,
          logoOpacity,
          gap: tileGap,
          rotation: textRotation,
        });
      } else {
        drawSingleTextWatermark(
          context,
          watermarkText,
          baseImage.width,
          baseImage.height,
          textX,
          textY,
          fontSize,
          textColor,
          textOpacity,
          textRotation,
        );

        if (logoImage) {
          drawSingleLogoWatermark(
            context,
            logoImage,
            baseImage.width,
            baseImage.height,
            logoX,
            logoY,
            logoWidthPercent,
            logoOpacity,
            logoRotation,
          );
        }
      }

      const blob = await canvasToBlob(canvas, "image/png", 0.92);
      setOutputBlob(blob);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate watermarked output.";
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
          Add Text / Watermark
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Overlay text and logo watermarks with position, opacity, rotation, and tiled pattern
          controls.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Applying watermark..." />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload Base Image
            </h2>
            <ImageUploader onFileSelect={handleSourceFileSelect} />

            {sourceFile ? (
              <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs sm:grid-cols-2">
                <div>
                  <p className="text-[var(--text-secondary)]">Name</p>
                  <p className="mt-1 truncate font-medium">{sourceFile.name}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Size</p>
                  <p className="mt-1 font-medium">{formatFileSize(sourceFile.size)}</p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Watermark Controls
            </h2>

            <label className="block text-xs text-[var(--text-secondary)]">
              Watermark Text
              <input
                type="text"
                value={watermarkText}
                onChange={(event) => setWatermarkText(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--text-secondary)]">
                Font Size: {fontSize}
                <input
                  type="range"
                  min={16}
                  max={140}
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
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
                Text Opacity: {textOpacity.toFixed(2)}
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.01}
                  value={textOpacity}
                  onChange={(event) => setTextOpacity(Number(event.target.value))}
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Text Rotation: {textRotation}°
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={textRotation}
                  onChange={(event) => setTextRotation(Number(event.target.value))}
                  className="mt-1 w-full accent-[var(--text-primary)]"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[var(--text-secondary)]">
                Text X: {Math.round(textX)}%
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={textX}
                  onChange={(event) => setTextX(Number(event.target.value))}
                  disabled={tilePattern}
                  className="mt-1 w-full accent-[var(--text-primary)] disabled:opacity-40"
                />
              </label>
              <label className="text-xs text-[var(--text-secondary)]">
                Text Y: {Math.round(textY)}%
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={textY}
                  onChange={(event) => setTextY(Number(event.target.value))}
                  disabled={tilePattern}
                  className="mt-1 w-full accent-[var(--text-primary)] disabled:opacity-40"
                />
              </label>
            </div>

            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs font-semibold text-[var(--text-secondary)]">
                Logo Watermark (Optional)
              </p>
              <ImageUploader
                onFileSelect={handleLogoFileSelect}
                title="Drop logo image"
                description="PNG logo works best for transparent watermark overlays."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-[var(--text-secondary)]">
                  Logo Width: {logoWidthPercent}%
                  <input
                    type="range"
                    min={8}
                    max={60}
                    value={logoWidthPercent}
                    onChange={(event) => setLogoWidthPercent(Number(event.target.value))}
                    className="mt-1 w-full accent-[var(--text-primary)]"
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Logo Opacity: {logoOpacity.toFixed(2)}
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={logoOpacity}
                    onChange={(event) => setLogoOpacity(Number(event.target.value))}
                    className="mt-1 w-full accent-[var(--text-primary)]"
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Logo Rotation: {logoRotation}°
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={logoRotation}
                    onChange={(event) => setLogoRotation(Number(event.target.value))}
                    className="mt-1 w-full accent-[var(--text-primary)]"
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)]">
                  Logo X: {Math.round(logoX)}%
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={logoX}
                    onChange={(event) => setLogoX(Number(event.target.value))}
                    disabled={tilePattern}
                    className="mt-1 w-full accent-[var(--text-primary)] disabled:opacity-40"
                  />
                </label>
                <label className="text-xs text-[var(--text-secondary)] sm:col-span-2">
                  Logo Y: {Math.round(logoY)}%
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={logoY}
                    onChange={(event) => setLogoY(Number(event.target.value))}
                    disabled={tilePattern}
                    className="mt-1 w-full accent-[var(--text-primary)] disabled:opacity-40"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={tilePattern}
                  onChange={(event) => setTilePattern(event.target.checked)}
                />
                Use tiled watermark pattern
              </label>

              <label className="block text-xs text-[var(--text-secondary)]">
                Tile Gap: {tileGap}px
                <input
                  type="range"
                  min={40}
                  max={280}
                  value={tileGap}
                  onChange={(event) => setTileGap(Number(event.target.value))}
                  disabled={!tilePattern}
                  className="mt-1 w-full accent-[var(--text-primary)] disabled:opacity-40"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply Watermark
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
              3. Preview
            </h2>

            <div
              ref={previewRef}
              className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-2"
              onMouseMove={(event) => {
                if (!dragStateRef.current || !previewRef.current || tilePattern) {
                  return;
                }

                const rect = previewRef.current.getBoundingClientRect();
                const nextX = clamp(
                  dragStateRef.current.originX +
                    ((event.clientX - dragStateRef.current.startX) / rect.width) * 100,
                  3,
                  97,
                );
                const nextY = clamp(
                  dragStateRef.current.originY +
                    ((event.clientY - dragStateRef.current.startY) / rect.height) * 100,
                  3,
                  97,
                );

                if (dragStateRef.current.target === "text") {
                  setTextX(nextX);
                  setTextY(nextY);
                } else {
                  setLogoX(nextX);
                  setLogoY(nextY);
                }
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
                    alt="Watermark preview"
                    className="max-h-[460px] w-full rounded-lg object-contain"
                  />

                  {!tilePattern && watermarkText.trim() ? (
                    <button
                      type="button"
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded-md border border-white/50 bg-black/30 px-2 py-1 text-xs font-semibold text-white"
                      style={{
                        left: `${textX}%`,
                        top: `${textY}%`,
                        transform: `translate(-50%, -50%) rotate(${textRotation}deg)`,
                        fontSize: `${Math.max(11, fontSize / 2.8)}px`,
                        opacity: textOpacity,
                        color: textColor,
                      }}
                      onMouseDown={(event) => {
                        dragStateRef.current = {
                          target: "text",
                          startX: event.clientX,
                          startY: event.clientY,
                          originX: textX,
                          originY: textY,
                        };
                      }}
                    >
                      {watermarkText}
                    </button>
                  ) : null}

                  {!tilePattern && logoUrl ? (
                    <button
                      type="button"
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move bg-transparent p-0"
                      style={{
                        left: `${logoX}%`,
                        top: `${logoY}%`,
                        transform: `translate(-50%, -50%) rotate(${logoRotation}deg)`,
                        opacity: logoOpacity,
                        width: `${logoWidthPercent}%`,
                      }}
                      onMouseDown={(event) => {
                        dragStateRef.current = {
                          target: "logo",
                          startX: event.clientX,
                          startY: event.clientY,
                          originX: logoX,
                          originY: logoY,
                        };
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="Logo watermark preview" className="w-full" />
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Upload an image to preview watermark placement.
                </p>
              )}
            </div>

            {tilePattern ? (
              <p className="text-xs text-[var(--text-secondary)]">
                Tiled pattern appears in final generated output.
              </p>
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">
                Drag text/logo directly on preview for quick positioning.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={outputBlob}
              fileName={outputName}
              label="Download Watermarked Image"
              disabledReason="Generate output first."
            />
          </section>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { loadImageFromSource } from "@/src/lib/image-utils";

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

function clamp(value: number, min = 0, max = 255): number {
  return Math.min(Math.max(value, min), max);
}

function rgbToHex({ r, g, b }: RgbColor): string {
  const toHex = (value: number) => clamp(value).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl({ r, g, b }: RgbColor): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) {
      h += 360;
    }
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): RgbColor {
  const hn = ((h % 360) + 360) % 360;
  const sn = s / 100;
  const ln = l / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;

  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (hn < 60) {
    rp = c;
    gp = x;
  } else if (hn < 120) {
    rp = x;
    gp = c;
  } else if (hn < 180) {
    gp = c;
    bp = x;
  } else if (hn < 240) {
    gp = x;
    bp = c;
  } else if (hn < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function extractDominantColors(data: Uint8ClampedArray): string[] {
  const histogram = new Map<string, number>();
  const step = 20;

  for (let index = 0; index < data.length; index += 4 * step) {
    const alpha = data[index + 3];
    if (alpha < 180) {
      continue;
    }

    const r = Math.round(data[index] / 32) * 32;
    const g = Math.round(data[index + 1] / 32) * 32;
    const b = Math.round(data[index + 2] / 32) * 32;
    const key = `${clamp(r)},${clamp(g)},${clamp(b)}`;
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
  }

  return Array.from(histogram.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key]) => {
      const [r, g, b] = key.split(",").map(Number);
      return rgbToHex({ r, g, b });
    });
}

export default function ColorPickerTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<RgbColor | null>(null);
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setPickedColor(null);
    setDominantColors([]);
    setCopyMessage(null);

    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    imageUrlRef.current = objectUrl;
    setImageUrl(objectUrl);

    try {
      const image = await loadImageFromSource(objectUrl);
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas is not ready.");
      }

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available.");
      }

      const maxWidth = 920;
      const scale = image.width > maxWidth ? maxWidth / image.width : 1;
      const drawWidth = Math.max(1, Math.round(image.width * scale));
      const drawHeight = Math.max(1, Math.round(image.height * scale));

      canvas.width = drawWidth;
      canvas.height = drawHeight;
      context.clearRect(0, 0, drawWidth, drawHeight);
      context.drawImage(image, 0, 0, drawWidth, drawHeight);

      const pixelData = context.getImageData(0, 0, drawWidth, drawHeight).data;
      const palette = extractDominantColors(pixelData);
      setDominantColors(palette);
      if (palette.length > 0) {
        const first = palette[0].replace("#", "");
        setPickedColor({
          r: parseInt(first.slice(0, 2), 16),
          g: parseInt(first.slice(2, 4), 16),
          b: parseInt(first.slice(4, 6), 16),
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to process image.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const pickedHex = pickedColor ? rgbToHex(pickedColor) : null;
  const pickedHsl = pickedColor ? rgbToHsl(pickedColor) : null;

  const harmonyPalette = useMemo(() => {
    if (!pickedHsl) {
      return [];
    }

    const variants = [
      { h: pickedHsl.h, s: pickedHsl.s, l: pickedHsl.l },
      { h: pickedHsl.h + 30, s: pickedHsl.s, l: Math.min(92, pickedHsl.l + 8) },
      { h: pickedHsl.h - 30, s: pickedHsl.s, l: Math.max(16, pickedHsl.l - 8) },
      { h: pickedHsl.h + 150, s: pickedHsl.s, l: pickedHsl.l },
      { h: pickedHsl.h + 210, s: pickedHsl.s, l: pickedHsl.l },
    ];

    return variants.map(({ h, s, l }) => rgbToHex(hslToRgb(h, s, l)));
  }, [pickedHsl]);

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(`${value} copied`);
    } catch {
      setCopyMessage("Clipboard unavailable in this browser context.");
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 2 • Background & Color
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Color Picker & Palette
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Click any pixel to sample color and extract dominant + harmonious palettes.
        </p>
      </div>

      <ProcessingLoader isProcessing={isLoading} message="Extracting palette..." />

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload
            </h2>
            <ImageUploader onFileSelect={(file) => void handleFileSelect(file)} />
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Pick Color
            </h2>
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-3">
              <canvas
                ref={canvasRef}
                onClick={(event) => {
                  const canvas = canvasRef.current;
                  if (!canvas) {
                    return;
                  }
                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / rect.width;
                  const scaleY = canvas.height / rect.height;
                  const x = Math.floor((event.clientX - rect.left) * scaleX);
                  const y = Math.floor((event.clientY - rect.top) * scaleY);
                  const context = canvas.getContext("2d");
                  if (!context) {
                    return;
                  }
                  const pixel = context.getImageData(x, y, 1, 1).data;
                  setPickedColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
                }}
                className="h-auto w-full cursor-crosshair rounded-lg"
              />
              {!imageUrl ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Upload an image and click on the preview to pick a pixel color.
                </p>
              ) : null}
            </div>
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
              Picked Color
            </h2>
            {pickedColor && pickedHex && pickedHsl ? (
              <div className="space-y-3">
                <div
                  className="h-14 rounded-lg border border-[var(--border)]"
                  style={{ backgroundColor: pickedHex }}
                />
                <div className="space-y-1 text-xs">
                  <p>
                    HEX: <span className="font-semibold">{pickedHex}</span>
                  </p>
                  <p>
                    RGB:{" "}
                    <span className="font-semibold">
                      {pickedColor.r}, {pickedColor.g}, {pickedColor.b}
                    </span>
                  </p>
                  <p>
                    HSL:{" "}
                    <span className="font-semibold">
                      {pickedHsl.h}, {pickedHsl.s}%, {pickedHsl.l}%
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText(pickedHex)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
                >
                  Copy HEX
                </button>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                Pick a pixel to view HEX/RGB/HSL values.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              Dominant Colors
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {dominantColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => void copyText(color)}
                  className="space-y-1 rounded-lg border border-[var(--border)] p-2 text-center"
                >
                  <span
                    className="mx-auto block h-7 w-7 rounded-full border border-[var(--border)]"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] font-medium">{color}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              Harmonious Palette
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {harmonyPalette.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => void copyText(color)}
                  className="h-10 rounded-lg border border-[var(--border)]"
                  style={{ backgroundColor: color }}
                  aria-label={`Copy ${color}`}
                />
              ))}
            </div>
            {copyMessage ? (
              <p className="text-xs text-[var(--text-secondary)]">{copyMessage}</p>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}


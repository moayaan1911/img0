"use client";

import { useEffect, useRef, useState } from "react";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { createCanvas, fileToImage } from "@/src/lib/image-utils";

const CHARSETS = {
  dense: "@%#*+=-:. ",
  light: "MWN8B@$&*okbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
};

export default function AsciiArtTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [widthChars, setWidthChars] = useState(100);
  const [charset, setCharset] = useState<keyof typeof CHARSETS>("dense");
  const [colorMode, setColorMode] = useState(false);
  const [asciiText, setAsciiText] = useState("");
  const [asciiHtml, setAsciiHtml] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = colorMode ? asciiHtml : "";
    }
  }, [asciiHtml, colorMode]);

  const handleGenerate = async () => {
    if (!sourceFile) {
      setErrorMessage("Upload an image first.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setCopyMessage(null);

    try {
      const image = await fileToImage(sourceFile);
      const targetWidth = Math.max(20, widthChars);
      const targetHeight = Math.max(
        10,
        Math.round(targetWidth * (image.height / image.width) * 0.55),
      );

      const canvas = createCanvas(targetWidth, targetHeight);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }
      context.drawImage(image, 0, 0, targetWidth, targetHeight);

      const data = context.getImageData(0, 0, targetWidth, targetHeight).data;
      const chars = CHARSETS[charset];
      const plainLines: string[] = [];
      const htmlLines: string[] = [];

      for (let y = 0; y < targetHeight; y += 1) {
        let plainLine = "";
        let htmlLine = "";
        for (let x = 0; x < targetWidth; x += 1) {
          const index = (y * targetWidth + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const alpha = data[index + 3] / 255;
          const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) * alpha;
          const charIndex = Math.round((luminance / 255) * (chars.length - 1));
          const char = chars[charIndex] ?? " ";
          plainLine += char;
          htmlLine += `<span style="color: rgb(${r}, ${g}, ${b})">${char === " " ? "&nbsp;" : char}</span>`;
        }
        plainLines.push(plainLine);
        htmlLines.push(htmlLine);
      }

      setAsciiText(plainLines.join("\n"));
      setAsciiHtml(htmlLines.join("<br/>"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate ASCII art.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPlain = async () => {
    if (!asciiText) {
      return;
    }
    await navigator.clipboard.writeText(asciiText);
    setCopyMessage("ASCII text copied.");
  };

  const handleCopyHtml = async () => {
    if (!asciiHtml) {
      return;
    }
    await navigator.clipboard.writeText(asciiHtml);
    setCopyMessage("ASCII HTML copied.");
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 6 • Creative
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          ASCII Art Converter
        </h1>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Converting to ASCII..." />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload
            </h2>
            <ImageUploader onFileSelect={setSourceFile} />
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Settings
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Width: {widthChars} chars
              <input
                type="range"
                min={40}
                max={180}
                value={widthChars}
                onChange={(event) => setWidthChars(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
            <label className="block text-xs text-[var(--text-secondary)]">
              Charset
              <select
                value={charset}
                onChange={(event) => setCharset(event.target.value as keyof typeof CHARSETS)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="dense">Dense</option>
                <option value="light">Light</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={colorMode}
                onChange={(event) => setColorMode(event.target.checked)}
              />
              Color ASCII preview (HTML)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={!sourceFile || isProcessing}
                className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate ASCII
              </button>
              <button
                type="button"
                onClick={() => void handleCopyPlain()}
                disabled={!asciiText}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copy Text
              </button>
              <button
                type="button"
                onClick={() => void handleCopyHtml()}
                disabled={!asciiHtml}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copy HTML
              </button>
            </div>
            {copyMessage ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-300">{copyMessage}</p>
            ) : null}
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
              3. Output
            </h2>
            {colorMode ? (
              <div
                ref={previewRef}
                className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-[7px] leading-[0.52rem] sm:text-[9px] sm:leading-[0.62rem]"
              />
            ) : (
              <pre className="max-h-[520px] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-[7px] leading-[0.52rem] sm:text-[9px] sm:leading-[0.62rem]">
                {asciiText || "ASCII output appears here."}
              </pre>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

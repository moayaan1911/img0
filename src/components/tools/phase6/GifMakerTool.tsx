"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { createCanvas, fileToImage } from "@/src/lib/image-utils";

type GifFrame = {
  id: string;
  file: File;
  url: string;
};

export default function GifMakerTool() {
  const [frames, setFrames] = useState<GifFrame[]>([]);
  const [frameDelay, setFrameDelay] = useState(300);
  const [scalePercent, setScalePercent] = useState(100);
  const [loopForever, setLoopForever] = useState(true);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const frameUrlsRef = useRef<string[]>([]);
  const outputUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const frameUrls = frameUrlsRef.current;
    const outputUrl = outputUrlRef.current;
    return () => {
      frameUrls.forEach((url) => URL.revokeObjectURL(url));
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, []);

  const clearOutput = () => {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = null;
    }
    setOutputBlob(null);
    setOutputUrl(null);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    event.target.value = "";
    if (files.length === 0) {
      setErrorMessage("Please select image files to create GIF.");
      return;
    }

    setErrorMessage(null);
    clearOutput();
    const nextFrames = files.map((file) => {
      const url = URL.createObjectURL(file);
      frameUrlsRef.current.push(url);
      return { id: crypto.randomUUID(), file, url };
    });
    setFrames((previous) => [...previous, ...nextFrames]);
  };

  const handleGenerate = async () => {
    if (frames.length < 2) {
      setErrorMessage("Add at least two frames to create a GIF.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    clearOutput();

    try {
      const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
      const images = await Promise.all(frames.map((frame) => fileToImage(frame.file)));
      const base = images[0];
      const scale = Math.max(0.1, scalePercent / 100);
      const width = Math.max(16, Math.round(base.width * scale));
      const height = Math.max(16, Math.round(base.height * scale));

      const canvas = createCanvas(width, height);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      const gif = GIFEncoder();

      for (const image of images) {
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const { data } = context.getImageData(0, 0, width, height);
        const palette = quantize(data, 256);
        const indexed = applyPalette(data, palette);
        gif.writeFrame(indexed, width, height, {
          palette,
          delay: frameDelay,
          repeat: loopForever ? 0 : -1,
        });
      }

      gif.finish();
      const bytes = gif.bytes();
      const normalizedBytes = new Uint8Array(bytes.length);
      normalizedBytes.set(bytes);
      const blob = new Blob([normalizedBytes], { type: "image/gif" });
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      setOutputBlob(blob);
      setOutputUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate GIF.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 6 • Creative
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">GIF Maker</h1>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Encoding GIF..." />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Add Frames
            </h2>
            <label className="block rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
              <p className="text-sm font-semibold">Drop multiple images for animation frames</p>
              <span className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-4 py-2 text-sm">
                Choose Frames
              </span>
              <input type="file" accept="image/*" multiple onChange={handleInputChange} className="sr-only" />
            </label>
            {frames.length > 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">{frames.length} frames selected</p>
            ) : null}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. GIF Settings
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Frame Delay: {frameDelay} ms
              <input
                type="range"
                min={60}
                max={1000}
                step={20}
                value={frameDelay}
                onChange={(event) => setFrameDelay(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
            <label className="block text-xs text-[var(--text-secondary)]">
              Output Scale: {scalePercent}%
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={scalePercent}
                onChange={(event) => setScalePercent(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={loopForever}
                onChange={(event) => setLoopForever(event.target.checked)}
              />
              Loop forever
            </label>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={frames.length < 2 || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate GIF
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
            {outputUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={outputUrl}
                alt="GIF preview"
                className="w-full rounded-xl border border-[var(--border)] object-contain"
              />
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Generated GIF preview appears here.</p>
            )}
          </section>
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={outputBlob}
              fileName="animation.gif"
              label="Download GIF"
              disabledReason="Generate GIF first."
            />
          </section>
        </div>
      </div>
    </section>
  );
}

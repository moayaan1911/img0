"use client";

import { useEffect, useRef, useState } from "react";
import ImageUploader from "@/src/components/shared/ImageUploader";

export default function CompareTool() {
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [slider, setSlider] = useState(50);

  const beforeUrlRef = useRef<string | null>(null);
  const afterUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (beforeUrlRef.current) {
        URL.revokeObjectURL(beforeUrlRef.current);
      }
      if (afterUrlRef.current) {
        URL.revokeObjectURL(afterUrlRef.current);
      }
    };
  }, []);

  const handleBeforeSelect = (file: File) => {
    if (beforeUrlRef.current) {
      URL.revokeObjectURL(beforeUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    beforeUrlRef.current = url;
    setBeforeUrl(url);
  };

  const handleAfterSelect = (file: File) => {
    if (afterUrlRef.current) {
      URL.revokeObjectURL(afterUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    afterUrlRef.current = url;
    setAfterUrl(url);
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 6 • Creative
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Before / After Compare
        </h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload Before Image
            </h2>
            <ImageUploader onFileSelect={handleBeforeSelect} />
          </section>
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Upload After Image
            </h2>
            <ImageUploader onFileSelect={handleAfterSelect} />
          </section>
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              3. Slider
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Reveal: {slider}%
              <input
                type="range"
                min={0}
                max={100}
                value={slider}
                onChange={(event) => setSlider(Number(event.target.value))}
                className="mt-1 w-full accent-[var(--text-primary)]"
              />
            </label>
          </section>
        </div>

        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Interactive Compare
            </h2>
            {beforeUrl && afterUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={beforeUrl} alt="Before" className="block w-full object-contain" />
                <div
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                  style={{ width: `${slider}%` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={afterUrl}
                    alt="After"
                    className="h-full w-full max-w-none object-contain"
                    style={{ width: `${100 / Math.max(1, slider)}%` }}
                  />
                </div>
                <div
                  className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-white/80"
                  style={{ left: `${slider}%` }}
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                Upload both images to start comparison.
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

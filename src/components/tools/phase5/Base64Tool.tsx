"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import { fileToDataUrl } from "@/src/lib/image-utils";

function extractMimeTypeFromDataUri(value: string): string | null {
  const match = /^data:([^;,]+);base64,/u.exec(value.trim());
  return match?.[1] ?? null;
}

function sanitizeBase64Input(value: string): string {
  return value.trim().replace(/\s+/gu, "");
}

export default function Base64Tool() {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [base64Output, setBase64Output] = useState("");
  const [decodeInput, setDecodeInput] = useState("");
  const [decodedBlob, setDecodedBlob] = useState<Blob | null>(null);
  const [decodedUrl, setDecodedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const decodedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (decodedUrlRef.current) {
        URL.revokeObjectURL(decodedUrlRef.current);
      }
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    setCopyMessage(null);
    setDecodedBlob(null);
    setDecodedUrl(null);

    try {
      const dataUri = await fileToDataUrl(file);
      setBase64Output(dataUri);
      setSourceUrl(dataUri);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to convert image.";
      setErrorMessage(message);
    }
  };

  const handleDecode = async () => {
    setErrorMessage(null);
    setCopyMessage(null);

    try {
      const sanitized = sanitizeBase64Input(decodeInput);
      if (!sanitized) {
        throw new Error("Paste a Base64 string first.");
      }

      const hasDataUri = sanitized.startsWith("data:");
      const mimeType = hasDataUri
        ? extractMimeTypeFromDataUri(sanitized) ?? "image/png"
        : "image/png";
      const dataUri = hasDataUri ? sanitized : `data:${mimeType};base64,${sanitized}`;

      const response = await fetch(dataUri);
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("Provided Base64 is not a valid image payload.");
      }

      if (decodedUrlRef.current) {
        URL.revokeObjectURL(decodedUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      decodedUrlRef.current = url;
      setDecodedBlob(blob);
      setDecodedUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to decode Base64.";
      setErrorMessage(message);
    }
  };

  const handleCopy = async () => {
    if (!base64Output) {
      return;
    }
    try {
      await navigator.clipboard.writeText(base64Output);
      setCopyMessage("Base64 copied.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Copy failed.";
      setErrorMessage(message);
    }
  };

  const outputName = useMemo(() => {
    const mime = decodedBlob?.type ?? "image/png";
    const extension = mime.split("/")[1] ?? "png";
    return `decoded-image.${extension}`;
  }, [decodedBlob?.type]);

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 5 • Utility
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Image ↔ Base64 Converter
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Convert image to Base64 string and decode Base64 back to image.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Image to Base64
            </h2>
            <ImageUploader onFileSelect={handleFileSelect} />
            <textarea
              value={base64Output}
              onChange={(event) => setBase64Output(event.target.value)}
              placeholder="Base64 output appears here..."
              className="min-h-[140px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!base64Output}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copy Base64
              </button>
              <p className="text-xs text-[var(--text-secondary)]">
                Length: {base64Output.length.toLocaleString()} chars
              </p>
            </div>
            {copyMessage ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-300">{copyMessage}</p>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Base64 to Image
            </h2>
            <textarea
              value={decodeInput}
              onChange={(event) => setDecodeInput(event.target.value)}
              placeholder="Paste Base64 string or data URI here..."
              className="min-h-[140px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs"
            />
            <button
              type="button"
              onClick={() => void handleDecode()}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)]"
            >
              Decode Image
            </button>
          </section>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="space-y-5">
          <ImagePreview
            title="Source Image"
            imageUrl={sourceUrl}
            emptyDescription="Upload image to preview Base64 source."
          />
          <ImagePreview
            title="Decoded Image"
            imageUrl={decodedUrl}
            emptyDescription="Decoded output appears here."
          />
          <DownloadButton
            blob={decodedBlob}
            fileName={outputName}
            label="Download Decoded Image"
            disabledReason="Decode a Base64 string first."
          />
        </div>
      </div>
    </section>
  );
}

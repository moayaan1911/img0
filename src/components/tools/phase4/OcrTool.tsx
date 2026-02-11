"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";

const LANGUAGE_OPTIONS = [
  { label: "English", value: "eng" },
  { label: "Hindi", value: "hin" },
  { label: "Arabic", value: "ara" },
  { label: "Spanish", value: "spa" },
  { label: "French", value: "fra" },
];

export default function OcrTool() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["eng"]);
  const [textOutput, setTextOutput] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [progressMessage, setProgressMessage] = useState("Preparing OCR...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const sourceUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) {
        URL.revokeObjectURL(sourceUrlRef.current);
      }
    };
  }, []);

  const languageCode = useMemo(() => selectedLanguages.join("+"), [selectedLanguages]);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setCopyMessage(null);
    setTextOutput("");
    setConfidence(null);

    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    sourceUrlRef.current = nextUrl;
    setSourceFile(file);
    setSourceUrl(nextUrl);
  };

  const toggleLanguage = (value: string) => {
    setSelectedLanguages((previous) => {
      if (previous.includes(value)) {
        if (previous.length === 1) {
          return previous;
        }
        return previous.filter((item) => item !== value);
      }
      return [...previous, value];
    });
  };

  const handleExtractText = async () => {
    if (!sourceFile) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setCopyMessage(null);
    setProgressMessage("Loading OCR engine...");

    try {
      const tesseract = await import("tesseract.js");
      const result = await tesseract.recognize(sourceFile, languageCode, {
        logger: (message) => {
          if (typeof message.progress === "number") {
            const percentage = Math.round(message.progress * 100);
            const status = message.status ?? "processing";
            setProgressMessage(`${status} (${percentage}%)`);
            return;
          }
          if (message.status) {
            setProgressMessage(message.status);
          }
        },
      });

      setTextOutput(result.data.text.trim());
      setConfidence(result.data.confidence ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to extract text.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
      setProgressMessage("Preparing OCR...");
    }
  };

  const handleCopy = async () => {
    if (!textOutput) {
      return;
    }
    try {
      await navigator.clipboard.writeText(textOutput);
      setCopyMessage("Extracted text copied.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to copy text.";
      setErrorMessage(message);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 4 • PDF & Document
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          OCR Text Extractor
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Extract text from images with client-side OCR and copy the result instantly.
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message={progressMessage} />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload Image
            </h2>
            <ImageUploader onFileSelect={handleFileSelect} />
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. OCR Settings
            </h2>

            <div className="space-y-2">
              <p className="text-xs text-[var(--text-secondary)]">
                Languages (choose one or more)
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {LANGUAGE_OPTIONS.map((language) => (
                  <label
                    key={language.value}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(language.value)}
                      onChange={() => toggleLanguage(language.value)}
                    />
                    {language.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Active code: {languageCode}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleExtractText()}
              disabled={!sourceFile || isProcessing}
              className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Extract Text
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
            {sourceUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sourceUrl}
                alt="OCR source preview"
                className="max-h-[420px] w-full rounded-xl border border-[var(--border)] object-contain"
              />
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                Upload image to preview OCR source.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Extracted Text
            </h2>
            {confidence !== null ? (
              <p className="text-xs text-[var(--text-secondary)]">
                Confidence: {confidence.toFixed(1)}%
              </p>
            ) : null}
            <textarea
              value={textOutput}
              onChange={(event) => setTextOutput(event.target.value)}
              placeholder="OCR result appears here..."
              className="min-h-[220px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
            />
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!textOutput}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy Text
            </button>
            {copyMessage ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-300">{copyMessage}</p>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}

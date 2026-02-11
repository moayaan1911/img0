"use client";

import { type ChangeEvent, type DragEvent, useId, useRef, useState } from "react";

type ImageUploaderProps = {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  title?: string;
  description?: string;
};

export default function ImageUploader({
  onFileSelect,
  accept = "image/*",
  maxSizeMB = 25,
  disabled = false,
  title = "Drop your image here",
  description = "PNG, JPG, WebP supported. Everything stays on your device.",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateAndSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Only image files are allowed in this preview.");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File is too large. Max allowed size is ${maxSizeMB}MB.`);
      return;
    }

    setErrorMessage(null);
    onFileSelect(file);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border border-dashed px-6 py-8 text-center transition ${
          isDragging
            ? "border-[var(--text-primary)] bg-[var(--surface-strong)]"
            : "border-[var(--border)] bg-[var(--background)]"
        } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
      >
        <p className="text-base font-semibold">{title}</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>

        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed"
        >
          Choose Image
        </button>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
        />
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}


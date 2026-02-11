"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ImagePreview from "@/src/components/shared/ImagePreview";
import ImageUploader from "@/src/components/shared/ImageUploader";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";

type ToolShellProps = {
  toolName: string;
  toolDescription: string;
  category: string;
  phase: number;
  route: string;
};

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ToolShell({
  toolName,
  toolDescription,
  category,
  phase,
  route,
}: ToolShellProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [isProcessing] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const fileFacts = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return [
      { label: "Name", value: selectedFile.name },
      { label: "Type", value: selectedFile.type || "Unknown" },
      { label: "Size", value: formatFileSize(selectedFile.size) },
    ];
  }, [selectedFile]);

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase {phase}
        </span>
        <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          {category}
        </span>
        <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 font-mono text-xs text-[var(--text-secondary)]">
          {route}
        </span>
      </div>

      <div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {toolName}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          {toolDescription}
        </p>
      </div>

      <ProcessingLoader isProcessing={isProcessing} />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Upload
            </h2>
            <ImageUploader onFileSelect={handleFileSelect} />

            {fileFacts ? (
              <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs sm:grid-cols-3">
                {fileFacts.map((item) => (
                  <div key={item.label}>
                    <p className="text-[var(--text-secondary)]">{item.label}</p>
                    <p className="mt-1 truncate font-medium text-[var(--text-primary)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              2. Configure
            </h2>
            <div className="space-y-3">
              <label
                htmlFor="tool-quality"
                className="text-xs text-[var(--text-secondary)]"
              >
                Quality Preview: {quality}
              </label>
              <input
                id="tool-quality"
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="w-full accent-[var(--text-primary)]"
              />
              <p className="text-xs text-[var(--text-secondary)]">
                Control wiring is ready. Real processing logic starts in Phase 1.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (previewUrlRef.current) {
                  URL.revokeObjectURL(previewUrlRef.current);
                  previewUrlRef.current = null;
                }
                setSelectedFile(null);
                setPreviewUrl(null);
                setQuality(80);
              }}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
            >
              Reset Preview State
            </button>
          </section>
        </div>

        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              3. Preview
            </h2>
            <ImagePreview
              title="Before / Working Preview"
              imageUrl={previewUrl}
              emptyDescription="Upload a file to preview source image in this tool shell."
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Download
            </h2>
            <DownloadButton
              blob={null}
              disabledReason="No processed file yet. This shell is ready for tool logic hookup."
            />
          </section>
        </div>
      </div>
    </section>
  );
}

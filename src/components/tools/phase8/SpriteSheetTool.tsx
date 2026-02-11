"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import DownloadButton from "@/src/components/shared/DownloadButton";
import ProcessingLoader from "@/src/components/shared/ProcessingLoader";
import { canvasToBlob, createCanvas, fileToImage, formatFileSize } from "@/src/lib/image-utils";

type Mode = "generate" | "split";

type SpriteInput = {
  id: string;
  file: File;
  url: string;
};

type SplitOutput = {
  id: string;
  blob: Blob;
  url: string;
  fileName: string;
};

export default function SpriteSheetTool() {
  const [mode, setMode] = useState<Mode>("generate");
  const [inputs, setInputs] = useState<SpriteInput[]>([]);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [columns, setColumns] = useState(4);
  const [rows, setRows] = useState(4);
  const [padding, setPadding] = useState(0);
  const [sheetBlob, setSheetBlob] = useState<Blob | null>(null);
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string | null>(null);
  const [splitOutputs, setSplitOutputs] = useState<SplitOutput[]>([]);
  const [cssOutput, setCssOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputUrlsRef = useRef<string[]>([]);
  const sheetUrlRef = useRef<string | null>(null);
  const outputUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const inputUrls = inputUrlsRef.current;
    const sheetUrl = sheetUrlRef.current;
    const outputUrls = outputUrlsRef.current;
    return () => {
      inputUrls.forEach((url) => URL.revokeObjectURL(url));
      if (sheetUrl) {
        URL.revokeObjectURL(sheetUrl);
      }
      outputUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const clearGeneratedOutputs = () => {
    outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    outputUrlsRef.current = [];
    setSplitOutputs([]);
    setSheetBlob(null);
    setSheetPreviewUrl(null);
    setCssOutput("");
  };

  const handleInputFiles = (files: FileList | File[]) => {
    const safe = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (safe.length === 0) {
      setErrorMessage("Please upload valid image files.");
      return;
    }

    clearGeneratedOutputs();
    setErrorMessage(null);

    const mapped = safe.map((file) => {
      const url = URL.createObjectURL(file);
      inputUrlsRef.current.push(url);
      return { id: crypto.randomUUID(), file, url };
    });
    setInputs((previous) => [...previous, ...mapped]);
  };

  const handleGenerateInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleInputFiles(event.target.files);
    }
    event.target.value = "";
  };

  const handleSheetSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid sprite sheet image.");
      return;
    }

    clearGeneratedOutputs();
    setErrorMessage(null);
    setSheetFile(file);
    if (sheetUrlRef.current) {
      URL.revokeObjectURL(sheetUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    sheetUrlRef.current = url;
  };

  const handleGenerateSheet = async () => {
    if (inputs.length === 0) {
      setErrorMessage("Upload images first.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    clearGeneratedOutputs();

    try {
      const images = await Promise.all(inputs.map((item) => fileToImage(item.file)));
      const maxWidth = Math.max(...images.map((img) => img.width));
      const maxHeight = Math.max(...images.map((img) => img.height));
      const safeColumns = Math.max(1, columns);
      const totalRows = Math.ceil(images.length / safeColumns);
      const sheetWidth = safeColumns * maxWidth + (safeColumns + 1) * padding;
      const sheetHeight = totalRows * maxHeight + (totalRows + 1) * padding;
      const canvas = createCanvas(sheetWidth, sheetHeight);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas context is not available in this browser.");
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;

      const cssParts: string[] = [
        `.sprite { background-image: url("sprite-sheet.png"); background-repeat: no-repeat; }`,
      ];

      images.forEach((image, index) => {
        const row = Math.floor(index / safeColumns);
        const column = index % safeColumns;
        const x = padding + column * (maxWidth + padding);
        const y = padding + row * (maxHeight + padding);
        context.drawImage(image, x, y, image.width, image.height);

        cssParts.push(
          `.sprite-${index + 1} { width: ${maxWidth}px; height: ${maxHeight}px; background-position: -${x}px -${y}px; }`,
        );
      });

      const blob = await canvasToBlob(canvas, "image/png", 0.92);
      const url = URL.createObjectURL(blob);
      outputUrlsRef.current.push(url);
      setSheetBlob(blob);
      setSheetPreviewUrl(url);
      setCssOutput(cssParts.join("\n"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate sprite sheet.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitSheet = async () => {
    if (!sheetFile) {
      setErrorMessage("Upload a sprite sheet first.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    clearGeneratedOutputs();

    try {
      const image = await fileToImage(sheetFile);
      const safeRows = Math.max(1, rows);
      const safeColumns = Math.max(1, columns);
      const cellWidth = Math.floor(image.width / safeColumns);
      const cellHeight = Math.floor(image.height / safeRows);
      const generated: SplitOutput[] = [];

      for (let row = 0; row < safeRows; row += 1) {
        for (let column = 0; column < safeColumns; column += 1) {
          const canvas = createCanvas(cellWidth, cellHeight);
          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Canvas context is not available in this browser.");
          }

          const sx = column * cellWidth;
          const sy = row * cellHeight;
          context.drawImage(image, sx, sy, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);
          const blob = await canvasToBlob(canvas, "image/png", 0.92);
          const url = URL.createObjectURL(blob);
          outputUrlsRef.current.push(url);
          generated.push({
            id: `${row}-${column}`,
            blob,
            url,
            fileName: `sprite-r${row + 1}-c${column + 1}.png`,
          });
        }
      }

      setSplitOutputs(generated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to split sprite sheet.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalGeneratedSize = useMemo(
    () => splitOutputs.reduce((sum, item) => sum + item.blob.size, 0),
    [splitOutputs],
  );

  return (
    <section className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <div>
        <p className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Phase 8 • Batch & Power
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Sprite Sheet Generator / Splitter
        </h1>
      </div>

      <ProcessingLoader isProcessing={isProcessing} message="Processing sprites..." />

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              1. Mode
            </h2>
            <label className="block text-xs text-[var(--text-secondary)]">
              Choose
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as Mode)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              >
                <option value="generate">Generate sprite sheet</option>
                <option value="split">Split existing sheet</option>
              </select>
            </label>
          </section>

          {mode === "generate" ? (
            <>
              <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
                  2. Upload Frames
                </h2>
                <label className="block rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
                  <p className="text-sm font-semibold">Drop images to combine as one sprite sheet</p>
                  <span className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-4 py-2 text-sm">
                    Choose Images
                  </span>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGenerateInputChange}
                    className="sr-only"
                  />
                </label>
                <p className="text-xs text-[var(--text-secondary)]">{inputs.length} frames selected</p>
              </section>
              <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
                  3. Layout
                </h2>
                <label className="block text-xs text-[var(--text-secondary)]">
                  Columns: {columns}
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={columns}
                    onChange={(event) => setColumns(Number(event.target.value))}
                    className="mt-1 w-full accent-[var(--text-primary)]"
                  />
                </label>
                <label className="block text-xs text-[var(--text-secondary)]">
                  Padding: {padding}px
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={padding}
                    onChange={(event) => setPadding(Number(event.target.value))}
                    className="mt-1 w-full accent-[var(--text-primary)]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleGenerateSheet()}
                  disabled={inputs.length === 0 || isProcessing}
                  className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Generate Sprite Sheet
                </button>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
                  2. Upload Sheet
                </h2>
                <label className="block rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
                  <p className="text-sm font-semibold">Drop sprite sheet image</p>
                  <span className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-4 py-2 text-sm">
                    Choose Sheet
                  </span>
                  <input type="file" accept="image/*" onChange={handleSheetSelect} className="sr-only" />
                </label>
                {sheetFile ? (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {sheetFile.name} • {formatFileSize(sheetFile.size)}
                  </p>
                ) : null}
              </section>
              <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
                  3. Split Grid
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-[var(--text-secondary)]">
                    Rows
                    <input
                      type="number"
                      min={1}
                      value={rows}
                      onChange={(event) => setRows(Number(event.target.value) || 1)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs text-[var(--text-secondary)]">
                    Columns
                    <input
                      type="number"
                      min={1}
                      value={columns}
                      onChange={(event) => setColumns(Number(event.target.value) || 1)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSplitSheet()}
                  disabled={!sheetFile || isProcessing}
                  className="rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Split Sheet
                </button>
              </section>
            </>
          )}

          {errorMessage ? (
            <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
              4. Output
            </h2>

            {mode === "generate" ? (
              <>
                {sheetPreviewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sheetPreviewUrl}
                      alt="Sprite sheet preview"
                      className="w-full rounded-xl border border-[var(--border)] object-contain"
                    />
                    <DownloadButton
                      blob={sheetBlob}
                      fileName="sprite-sheet.png"
                      label="Download Sprite Sheet"
                      disabledReason="Generate sprite sheet first."
                    />
                    <label className="block text-xs text-[var(--text-secondary)]">
                      CSS Snippet
                      <textarea
                        value={cssOutput}
                        onChange={(event) => setCssOutput(event.target.value)}
                        className="mt-1 min-h-[140px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs"
                      />
                    </label>
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Generated sprite sheet and CSS mapping will appear here.
                  </p>
                )}
              </>
            ) : (
              <>
                {splitOutputs.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Split outputs appear here after processing.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {splitOutputs.length} sprites • total {formatFileSize(totalGeneratedSize)}
                    </p>
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {splitOutputs.map((item) => (
                        <li key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={item.fileName}
                            className="h-16 w-full rounded border border-[var(--border)] object-contain"
                          />
                          <div className="mt-2">
                            <DownloadButton
                              blob={item.blob}
                              fileName={item.fileName}
                              label="Download"
                              disabledReason="Not ready"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

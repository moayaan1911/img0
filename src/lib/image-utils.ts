export type CoreOutputFormat = "image/png" | "image/jpeg" | "image/webp" | "image/avif";

export type ExtendedOutputFormat =
  | CoreOutputFormat
  | "image/bmp"
  | "image/gif"
  | "image/x-icon";

export const CORE_OUTPUT_OPTIONS: Array<{
  label: string;
  mimeType: CoreOutputFormat;
  extension: string;
}> = [
  { label: "PNG", mimeType: "image/png", extension: "png" },
  { label: "JPG", mimeType: "image/jpeg", extension: "jpg" },
  { label: "WebP", mimeType: "image/webp", extension: "webp" },
  { label: "AVIF", mimeType: "image/avif", extension: "avif" },
];

export const EXTENDED_OUTPUT_OPTIONS: Array<{
  label: string;
  mimeType: ExtendedOutputFormat;
  extension: string;
}> = [
  ...CORE_OUTPUT_OPTIONS,
  { label: "BMP", mimeType: "image/bmp", extension: "bmp" },
  { label: "GIF", mimeType: "image/gif", extension: "gif" },
  { label: "ICO", mimeType: "image/x-icon", extension: "ico" },
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getOutputOption(mimeType: string) {
  return EXTENDED_OUTPUT_OPTIONS.find((option) => option.mimeType === mimeType);
}

export function normalizeMimeType(mimeType: string): ExtendedOutputFormat {
  if (mimeType === "image/jpg") {
    return "image/jpeg";
  }

  const option = getOutputOption(mimeType);
  if (option) {
    return option.mimeType;
  }

  return "image/png";
}

export function replaceFileExtension(fileName: string, nextExtension: string): string {
  const cleanExtension = nextExtension.startsWith(".")
    ? nextExtension.slice(1)
    : nextExtension;

  const extensionMatch = /\.[^./]+$/u;
  if (extensionMatch.test(fileName)) {
    return fileName.replace(extensionMatch, `.${cleanExtension}`);
  }

  return `${fileName}.${cleanExtension}`;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result));
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };

    reader.readAsDataURL(file);
  });
}

export async function loadImageFromSource(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = source;
  });
}

export async function fileToImage(file: File): Promise<HTMLImageElement> {
  const source = await fileToDataUrl(file);
  return loadImageFromSource(source);
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not generate output with selected format."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

export function isCanvasMimeTypeSupported(mimeType: string): boolean {
  try {
    const probeCanvas = createCanvas(1, 1);
    const dataUrl = probeCanvas.toDataURL(mimeType);
    return dataUrl.startsWith(`data:${mimeType}`);
  } catch {
    return false;
  }
}

export function isQualityBasedFormat(mimeType: string): boolean {
  return (
    mimeType === "image/jpeg" ||
    mimeType === "image/webp" ||
    mimeType === "image/avif"
  );
}


type ImagePreviewProps = {
  title?: string;
  imageUrl?: string | null;
  alt?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export default function ImagePreview({
  title = "Preview",
  imageUrl,
  alt = "Uploaded preview",
  emptyTitle = "Preview will appear here",
  emptyDescription = "Upload an image to start reviewing before/after output.",
}: ImagePreviewProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
        {title}
      </h2>

      <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-4">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={alt}
            className="max-h-[360px] w-auto rounded-lg object-contain"
          />
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium">{emptyTitle}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {emptyDescription}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}


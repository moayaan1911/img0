type ProcessingLoaderProps = {
  isProcessing: boolean;
  message?: string;
};

export default function ProcessingLoader({
  isProcessing,
  message = "Processing in your browser...",
}: ProcessingLoaderProps) {
  if (!isProcessing) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 animate-pulse rounded-full bg-[var(--text-primary)]" />
        <p className="text-sm text-[var(--text-secondary)]">{message}</p>
      </div>
    </div>
  );
}


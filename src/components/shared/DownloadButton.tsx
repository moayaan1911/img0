"use client";

type DownloadButtonProps = {
  blob?: Blob | null;
  fileName?: string;
  label?: string;
  disabledReason?: string;
};

export default function DownloadButton({
  blob,
  fileName = "img0-output.png",
  label = "Download Output",
  disabledReason = "Processing output not ready yet.",
}: DownloadButtonProps) {
  const isDisabled = !blob;

  const handleDownload = () => {
    if (!blob) {
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isDisabled}
        onClick={handleDownload}
        className="w-full rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>
      {isDisabled ? (
        <p className="text-xs text-[var(--text-secondary)]">{disabledReason}</p>
      ) : null}
    </div>
  );
}


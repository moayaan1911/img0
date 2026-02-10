type SearchBarProps = {
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

export default function SearchBar({
  id = "tool-search-input",
  placeholder = "Search tools... (preview only)",
  disabled = true,
  ariaLabel = "Search tools",
  className = "",
}: SearchBarProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 ${className}`.trim()}
    >
      <label htmlFor={id} className="sr-only">
        {ariaLabel}
      </label>
      <input
        id={id}
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        className="w-full border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-80"
      />
    </div>
  );
}

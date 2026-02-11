"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SearchBarProps = {
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  targetPath?: string;
  queryParam?: string;
  debounceMs?: number;
};

export default function SearchBar({
  id = "tool-search-input",
  placeholder = "Search tools...",
  disabled = false,
  ariaLabel = "Search tools",
  className = "",
  targetPath,
  queryParam = "q",
  debounceMs = 180,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activePath = targetPath ?? pathname;
  const currentQuery = searchParams.get(queryParam) ?? "";
  const [value, setValue] = useState(currentQuery);
  const hasInteractedRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setValue(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (disabled || !hasInteractedRef.current) {
      return;
    }

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      const params =
        activePath === pathname
          ? new URLSearchParams(searchParams.toString())
          : new URLSearchParams();

      const next = value.trim();
      if (next) {
        params.set(queryParam, next);
      } else {
        params.delete(queryParam);
      }

      const queryString = params.toString();
      const nextUrl = queryString ? `${activePath}?${queryString}` : activePath;
      router.replace(nextUrl, { scroll: false });
    }, debounceMs);
  }, [
    activePath,
    debounceMs,
    disabled,
    pathname,
    queryParam,
    router,
    searchParams,
    value,
  ]);

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
        value={value}
        onChange={(event) => {
          hasInteractedRef.current = true;
          setValue(event.target.value);
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-80"
      />
    </div>
  );
}

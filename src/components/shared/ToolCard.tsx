import Link from "next/link";
import type { ToolDefinition } from "@/src/lib/tools-registry";

type ToolCardProps = {
  tool: ToolDefinition;
};

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <article className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--text-secondary)]">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-md bg-[var(--background)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
          {tool.category}
        </span>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
          Coming Soon
        </span>
      </div>
      <h3 className="text-lg font-semibold">{tool.name}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {tool.description}
      </p>
      <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">
        {tool.route}
      </div>
      <Link
        href={tool.route}
        className="mt-4 block w-full rounded-xl border border-[var(--border)] px-3 py-2 text-center text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)]"
      >
        Open Placeholder
      </Link>
    </article>
  );
}


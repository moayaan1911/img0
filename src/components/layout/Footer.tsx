export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--text-secondary)]">
      <p>
        © {year} img0.xyz • Minimalist Image Studio in your browser
      </p>
      <p className="mt-1">Completely Vibe Coded with Codex</p>
    </footer>
  );
}

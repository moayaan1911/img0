export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--text-secondary)]">
      <p>&copy; {year} img0.xyz</p>
      <p className="mt-1">Vibe Coded with Codex</p>
    </footer>
  );
}

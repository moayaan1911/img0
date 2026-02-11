export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--text-secondary)]">
      <p>
        © {year} img0.xyz • Minimalist Image Studio in your browser
      </p>
    </footer>
  );
}

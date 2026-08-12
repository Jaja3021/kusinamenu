export function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-forest/40 px-4 py-1.5 text-sm font-medium text-forest transition hover:border-forest hover:bg-ivory-deep"
    >
      <span aria-hidden>←</span>
      {label}
    </button>
  );
}

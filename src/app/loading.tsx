export default function Loading() {
  return (
    <div className="loader-shell" role="status" aria-live="polite" aria-label="Loading WEZA Build">
      <div className="loader" aria-hidden="true" />
      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-ink-500">
        Loading WEZA Build
      </p>
    </div>
  );
}

import { cn } from "@/lib/cn";

export function WezaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn("h-6 w-6 shrink-0", className)}
      fill="none"
    >
      <rect width="64" height="64" rx="18" fill="#070910" />
      <path
        d="M14 42.5 23.2 18l8.8 19.2L40.8 18 50 42.5"
        stroke="#34d399"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 47.5h28"
        stroke="#f59e0b"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="50" cy="17" r="4" fill="#34d399" />
    </svg>
  );
}

export function WezaWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <WezaMark />
      <span className="font-semibold tracking-tight text-ink-900">
        WEZA{compact ? "" : " Build"}
      </span>
    </span>
  );
}

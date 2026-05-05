import { cn } from "@/lib/cn";

export function WezaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn("h-6 w-6 shrink-0", className)}
      fill="none"
    >
      <rect width="64" height="64" rx="16" fill="#0E121C" />
      <path
        d="M16 43 24 21 32 38 40 21 48 43"
        stroke="#34d399"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

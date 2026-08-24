import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Panel({
  children,
  className,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section className={cn("glass-panel p-5 sm:p-6", glow && "shadow-[var(--shadow-luxe)]", className)}>
      {children}
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("glass-panel p-4", accent && "luxe-surface")}>
      <p className="eyebrow">{label}</p>
      <p className={cn("mt-2 font-display text-3xl leading-none", accent && "text-accent-foreground")}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Ring({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
          <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="7" />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * Math.min(value, 100)) / 100}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-xl">
          {value}%
        </span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "gold" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs tracking-wide",
        tone === "gold"
          ? "bg-[image:var(--gradient-gold)] text-gold-foreground"
          : "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  qty,
  onChange,
  min = 1,
  max = 20,
  size = "md",
  className,
}: {
  qty: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const btnSize = size === "sm" ? "size-7" : "size-9";
  const iconSize = size === "sm" ? "size-3" : "size-3.5";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card p-1",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, qty - 1))}
        disabled={qty <= min}
        className={cn(
          "grid place-items-center rounded-full bg-muted text-foreground transition-transform active:scale-90 disabled:opacity-40",
          btnSize,
        )}
      >
        <Minus className={iconSize} />
      </button>
      <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, qty + 1))}
        disabled={qty >= max}
        className={cn(
          "grid place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-40",
          btnSize,
        )}
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}

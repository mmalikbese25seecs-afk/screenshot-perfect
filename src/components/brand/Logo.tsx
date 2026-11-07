import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      to="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="Pindi Crust home"
    >
      <span className="bg-ember-gradient grid size-9 shrink-0 place-items-center rounded-xl shadow-soft transition-transform group-hover:rotate-6">
        <Flame className="size-5 text-primary-foreground" strokeWidth={1.75} />
      </span>
      {!compact && (
        <span className="font-display text-lg leading-none font-bold tracking-tight text-primary sm:text-xl">
          PINDI <span className="text-foreground">CRUST</span>
        </span>
      )}
    </Link>
  );
}

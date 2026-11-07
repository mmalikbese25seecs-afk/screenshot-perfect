import { PlugZap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BACKEND_NOT_CONNECTED_MESSAGE,
  isBackendConfigured,
  isBackendNotConfigured,
} from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

/** Slim strip shown at the top of the storefront and staff console while no backend is configured. */
export function BackendPreviewBanner({ className }: { className?: string }) {
  if (isBackendConfigured) return null;
  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-2 border-b border-warning/40 bg-warning/15 px-4 py-1.5 text-center text-[11px] font-semibold text-foreground sm:text-xs",
        className,
      )}
    >
      <PlugZap className="size-3.5 shrink-0 text-warning-foreground" aria-hidden />
      <span>Frontend preview mode — backend not connected. Nothing is being saved.</span>
    </div>
  );
}

/** Card explaining that a screen's data source isn't connected yet. */
export function BackendNotice({
  title = "Backend not connected",
  description = BACKEND_NOT_CONNECTED_MESSAGE,
  className,
  compact,
  when = "always",
}: {
  /** "unconfigured" renders nothing once a backend is configured. */
  when?: "always" | "unconfigured";
  title?: string | undefined;
  description?: string | undefined;
  className?: string | undefined;
  compact?: boolean | undefined;
}) {
  if (when === "unconfigured" && isBackendConfigured) return null;
  return (
    <div
      role="status"
      className={cn(
        "rounded-2xl border border-dashed border-warning/50 bg-warning/10 text-center",
        compact ? "p-4" : "p-8",
        className,
      )}
    >
      <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-warning/20 text-warning-foreground">
        <PlugZap className="size-5" aria-hidden />
      </span>
      <p className="mt-3 font-display text-base font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-pretty text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/**
 * Error state for a failed query. Shows the not-connected notice when the
 * failure is the missing backend, otherwise a generic retry card.
 */
export function QueryErrorState({
  error,
  label = "this data",
  onRetry,
  className,
}: {
  error: unknown;
  label?: string | undefined;
  onRetry?: (() => void) | undefined;
  className?: string | undefined;
}) {
  if (isBackendNotConfigured(error) || !isBackendConfigured) {
    return (
      <BackendNotice
        className={className}
        description={`${label.charAt(0).toUpperCase()}${label.slice(1)} will appear here once the backend is connected. No information is being saved in preview mode.`}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 text-center shadow-soft",
        className,
      )}
    >
      <p className="text-sm font-semibold">Couldn't load {label}.</p>
      {onRetry && (
        <Button className="mt-3" variant="outline" onClick={onRetry}>
          <RefreshCw className="size-4" /> Try again
        </Button>
      )}
    </div>
  );
}

/** Shown on settings screens: edits are a local draft until the backend persists them. */
export function DraftNotice({ className }: { className?: string }) {
  if (isBackendConfigured) return null;
  return (
    <p
      role="status"
      className={cn(
        "mb-4 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-semibold text-foreground",
        className,
      )}
    >
      <PlugZap className="mt-0.5 size-3.5 shrink-0 text-warning-foreground" aria-hidden />
      <span>
        Draft only — changes here are not published. Saving needs the backend, which isn't connected
        yet.
      </span>
    </p>
  );
}

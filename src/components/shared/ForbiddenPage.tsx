import type { ReactNode } from "react";
import { ShieldAlert, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { authorize, isStaffRole } from "@/lib/authorization";
import { useAuth } from "@/store/auth";
import { useHydrated } from "@/hooks/use-hydrated";
import type { ModuleId } from "@/lib/modules";

export function UnauthorizedPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lift">
        <span className="bg-warning/15 grid size-14 place-items-center rounded-2xl text-warning mx-auto">
          <Lock className="size-7" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-bold">Sign in Required</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          You need to sign in with a staff account to access this area.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild variant="hero">
            <Link to="/login">
              <LogIn /> Staff Sign In
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Back to Store</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ForbiddenPage({ module }: { module?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lift">
        <span className="bg-destructive/12 grid size-14 place-items-center rounded-2xl text-destructive mx-auto">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          {module
            ? `You don't have permission to access the ${module} module. Contact your administrator if you believe this is an error.`
            : "You don't have permission to access this page. Your role does not include the required module access."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link to="/admin">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Back to Store</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * ModuleGuard — real frontend-only authorization guard.
 *
 * Checks the current user's role against the required module.
 * Shows ForbiddenPage if access is denied.
 *
 * IMPORTANT: This is UI visibility only. Backend must enforce.
 */
export function ModuleGuard({ moduleId, children }: { moduleId: ModuleId; children: ReactNode }) {
  const hydrated = useHydrated();
  const role = useAuth((s) => s.role);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const result = authorize(role, {
    requireAuth: true,
    requireStaff: true,
    requireModule: moduleId,
  });

  if (!result.allowed) {
    if (result.reason === "unauthenticated") {
      return <UnauthorizedPage />;
    }
    return <ForbiddenPage module={moduleId} />;
  }

  return <>{children}</>;
}

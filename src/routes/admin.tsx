import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { isStaff, useAuth } from "@/store/auth";
import { useHydrated } from "@/hooks/use-hydrated";
import { adminPreviewAvailable, setAdminPreview, useAdminPreview } from "@/lib/preview";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Staff Console — PINDI CRUST" },
      {
        name: "description",
        content:
          "Operate PINDI CRUST: orders, POS, menu, promotions, brand CMS, analytics and store settings.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Staff Console — PINDI CRUST" },
      {
        property: "og:description",
        content: "The PINDI CRUST staff console for orders, POS, menu and brand management.",
      },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const hydrated = useHydrated();
  const role = useAuth((s) => s.role);
  const authLoading = useAuth((s) => s.isLoading);
  const preview = useAdminPreview();

  // Not hydrated yet, or still restoring the Supabase session — show loading.
  // Without the authLoading check, a real staff session would flash the
  // "Staff access only" screen for a moment on every page refresh.
  if (!hydrated || authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Loading console…</p>
        </div>
      </div>
    );
  }

  if (preview && !isStaff(role)) {
    return (
      <AdminShell preview>
        <Outlet />
      </AdminShell>
    );
  }

  // 401 — Not authenticated
  if (role === "guest") {
    return (
      <div className="grid min-h-screen place-items-center bg-surface px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lift">
          <span className="bg-primary-soft grid size-14 place-items-center rounded-2xl text-primary mx-auto">
            <ShieldAlert className="size-7" />
          </span>
          <h1 className="font-display mt-5 text-2xl font-bold">Staff access only</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            This console is reserved for staff members. Sign in with a staff account to continue.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild variant="hero">
              <Link to="/login">Staff sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to store</Link>
            </Button>
          </div>
          {adminPreviewAvailable && (
            <div className="mt-6 border-t border-border pt-5">
              <Button variant="ghost" size="sm" onClick={() => setAdminPreview(true)}>
                Open local layout preview
              </Button>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Development only. No sign-in, no permissions, nothing saved.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 403 — Authenticated but not staff
  if (!isStaff(role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lift">
          <span className="bg-destructive/12 grid size-14 place-items-center rounded-2xl text-destructive mx-auto">
            <ShieldAlert className="size-7" />
          </span>
          <h1 className="font-display mt-5 text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Customer accounts cannot access the staff console. This incident has been logged.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline">
              <Link to="/">Back to store</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}

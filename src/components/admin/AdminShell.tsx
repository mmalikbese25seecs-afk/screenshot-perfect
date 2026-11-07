import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  BadgePercent,
  BarChart3,
  Bell,
  Brush,
  ClipboardList,
  Code,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Megaphone,
  Menu as MenuIcon,
  Moon,
  Package,
  Palette,
  PlusSquare,
  Power,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Sun,
  UserCog,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/store/auth";
import { usePermissions } from "@/store/permissions";
import { useThemeStore } from "@/store/theme";
import { cn } from "@/lib/utils";
import { getModuleGroups } from "@/lib/modules";
import { setAdminPreview } from "@/lib/preview";
import { BackendPreviewBanner } from "@/components/shared/BackendNotice";
import type { StaffRole, ModuleDef, ModuleId } from "@/lib/modules";

/* ------------------------------------------------------------------ */
/*  Icon resolver — maps icon string names from modules.ts to Lucide   */
/* ------------------------------------------------------------------ */

const iconMap: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  BarChart3,
  FileBarChart,
  ClipboardList,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  Star,
  LayoutGrid,
  Package,
  PlusSquare,
  BadgePercent,
  Megaphone,
  Brush,
  Palette,
  Store,
  CreditCard,
  UserCog,
  Settings,
  Activity,
  Power,
  Code,
};

function resolveIcon(name: string): typeof LayoutDashboard {
  return iconMap[name] ?? LayoutDashboard;
}

/* ------------------------------------------------------------------ */
/*  Navigation — driven by module registry, filtered by role           */
/* ------------------------------------------------------------------ */

function NavList({
  role,
  customPermissions,
  onNavigate,
}: {
  role: StaffRole;
  customPermissions: Record<StaffRole, ModuleId[]>;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = getModuleGroups(role, customPermissions);

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar" aria-label="Admin sections">
      {groups.map((group) => (
        <div key={group.group} className="mb-5">
          <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            {group.group}
          </p>
          <ul className="space-y-0.5">
            {group.modules.map((mod: ModuleDef) => {
              const Icon = resolveIcon(mod.icon);
              const isExact = mod.route === "/admin";
              const active = isExact ? pathname === mod.route : pathname.startsWith(mod.route);

              return (
                <li key={mod.id}>
                  <Link
                    to={mod.route}
                    onClick={onNavigate}
                    title={mod.description}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4.5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{mod.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  AdminShell                                                         */
/* ------------------------------------------------------------------ */

export function AdminShell({
  children,
  preview = false,
}: {
  children: ReactNode;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  // Preview mode shows every module for layout review only — it is not a role and grants nothing.
  const role = preview ? "developer" : auth.role;
  const name = preview ? "Preview" : auth.name;
  const signOut = preview ? () => setAdminPreview(false) : auth.signOut;
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);
  const modulePermissions = usePermissions((s) => s.modulePermissions);

  // Only staff roles should reach here, but narrow the type for safety
  const staffRole =
    role === "admin" || role === "manager" || role === "developer"
      ? (role as StaffRole)
      : "manager";

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden w-70 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <NavList role={staffRole} customPermissions={modulePermissions} />
        <div className="border-t border-border p-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Store className="size-4.5" strokeWidth={1.75} />
            View storefront
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              role="dialog"
              aria-label="Admin navigation"
              className="fixed inset-y-0 left-0 z-50 flex w-[84%] max-w-xs flex-col bg-card shadow-lift lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <Logo compact />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close admin navigation"
                  className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>
              <NavList
                role={staffRole}
                customPermissions={modulePermissions}
                onNavigate={() => setOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-40 border-b border-border/60">
          <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open admin navigation"
              aria-expanded={open}
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card/70 transition-colors hover:bg-muted lg:hidden"
            >
              <MenuIcon className="size-5" strokeWidth={1.75} />
            </button>
            <div className="hidden min-w-0 items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 lg:flex">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                aria-label="Search the dashboard"
                placeholder="Search orders, items, customers…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <span className="min-w-0 lg:hidden" />
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={toggleMode}
                aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
                className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95"
              >
                {mode === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
              </button>
              <button
                aria-label="Notifications"
                className="relative grid size-10 place-items-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95"
              >
                <Bell className="size-5" strokeWidth={1.75} />
              </button>
              <div className="ml-1 flex items-center gap-2 rounded-xl border border-border bg-card/70 py-1.5 pr-2 pl-1.5 transition-shadow duration-200 hover:shadow-soft">
                <span className="bg-primary-soft font-display grid size-8 place-items-center rounded-lg text-sm font-bold text-primary">
                  {name.slice(0, 1)}
                </span>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-xs font-bold">{name}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {preview ? "Local preview" : role}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  aria-label={preview ? "Exit preview" : "Sign out"}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <BackendPreviewBanner />
        {preview && (
          <div className="flex items-start gap-2.5 border-b border-warning/30 bg-warning/10 px-4 py-2.5 sm:px-6">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-xs font-semibold text-foreground">
              Local preview only — you are not signed in and have no staff permissions. Available in
              development builds only.
            </p>
          </div>
        )}

        {!preview && role === "manager" && (
          <div className="flex items-start gap-2.5 border-b border-warning/30 bg-warning/10 px-4 py-2.5 sm:px-6">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-xs font-semibold text-foreground">
              Manager access — deletions, admin accounts, passkeys and protected settings are
              locked.
            </p>
          </div>
        )}

        {!preview && role === "developer" && (
          <div className="flex items-start gap-2.5 border-b border-primary/30 bg-primary-soft px-4 py-2.5 sm:px-6">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-xs font-semibold text-foreground">
              Developer mode — full system access including module management and system
              configuration.
            </p>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable admin page wrapper                                       */
/* ------------------------------------------------------------------ */

export function AdminPage({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-balance sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground text-pretty">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card with micro-interaction                                  */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: ReactNode;
  tone?: "default" | "success" | "warning" | "primary";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <p className="min-w-0 truncate text-xs font-semibold text-muted-foreground uppercase">
          {label}
        </p>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl transition-transform duration-200",
            tone === "success" && "bg-success/12 text-success",
            tone === "warning" && "bg-warning/15 text-warning",
            tone === "primary" && "bg-primary-soft text-primary",
            tone === "default" && "bg-muted text-foreground",
          )}
        >
          {icon}
        </span>
      </div>
      <p className="font-display mt-2 text-2xl font-bold">{value}</p>
      {delta && (
        <Badge variant="secondary" className="mt-2 text-[11px]">
          {delta}
        </Badge>
      )}
    </div>
  );
}

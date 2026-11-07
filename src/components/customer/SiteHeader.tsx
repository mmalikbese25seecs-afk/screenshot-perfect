import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  ChevronRight,
  Heart,
  Home,
  Info,
  LayoutGrid,
  LogIn,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  Moon,
  Phone,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Sun,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cartCount, useCart } from "@/store/cart";
import { useAuth, isStaff } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { getStaffLoginUrl } from "@/lib/deployment";

const primaryLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/search", label: "Search", icon: Search },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
] as const;

const accountLinks = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/orders", label: "Order History", icon: Receipt },
  { to: "/track", label: "Track Order", icon: MapPin },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/addresses", label: "Saved Addresses", icon: MapPin },
] as const;

const supportLinks = [
  { to: "/contact", label: "Contact", icon: Phone },
  { to: "/about", label: "About Us", icon: Info },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const count = hydrated ? cartCount(lines) : 0;
  const { role, name, signOut } = useAuth();
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={open}
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card/70 text-foreground transition-all duration-200 hover:bg-muted hover:scale-105 active:scale-95"
            >
              <MenuIcon className="size-5" strokeWidth={1.75} />
            </button>
            <Logo className="hidden sm:flex" />
          </div>

          <Logo compact className="justify-self-center sm:hidden" />
          <nav className="hidden justify-self-center lg:flex lg:items-center lg:gap-1">
            {primaryLinks.slice(0, 4).map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:text-primary hover:bg-primary-soft/50",
                  pathname === l.to && "text-primary",
                )}
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={toggleMode}
              aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className="hidden size-10 place-items-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95 sm:grid"
            >
              {mode === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </button>
            <Link
              to="/search"
              search={{ q: "", category: undefined }}
              aria-label="Search the menu"
              className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95"
            >
              <Search className="size-5" strokeWidth={1.75} />
            </Link>
            <Link
              to="/cart"
              aria-label={`Cart, ${count} items`}
              className="relative grid size-10 place-items-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95"
            >
              <ShoppingBag className="size-5" strokeWidth={1.75} />
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 grid min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground animate-[badge-pop_0.3s_ease-out]">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              role="dialog"
              aria-label="Site navigation"
              className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-card shadow-lift"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <Logo />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:scale-105 active:scale-95"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="border-b border-border px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-primary-soft grid size-11 shrink-0 place-items-center rounded-2xl font-display text-base font-bold text-primary">
                    {name.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{name}</p>
                    <p className="truncate text-xs text-muted-foreground capitalize">
                      {role === "guest" ? "Browsing as guest" : `${role} account`}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
                <DrawerGroup
                  label="Browse"
                  items={primaryLinks}
                  onNavigate={() => setOpen(false)}
                />
                <DrawerGroup
                  label="My Account"
                  items={accountLinks}
                  onNavigate={() => setOpen(false)}
                />
                <DrawerGroup
                  label="Support"
                  items={supportLinks}
                  onNavigate={() => setOpen(false)}
                />

                {isStaff(role) && (
                  <>
                    <p className="mt-5 px-3 pb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                      Staff
                    </p>
                    <a
                      href={getStaffLoginUrl()}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl bg-primary-soft px-3 py-2.5 text-sm font-semibold text-primary"
                    >
                      <ShieldCheck className="size-4.5" />
                      <span className="min-w-0 flex-1 truncate">Staff Dashboard</span>
                      <ChevronRight className="size-4" />
                    </a>
                  </>
                )}
              </nav>

              <div className="border-t border-border p-4">
                <div className="mb-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                  <span className="text-xs font-semibold text-muted-foreground">Appearance</span>
                  <button
                    onClick={toggleMode}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary"
                  >
                    {mode === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                    {mode === "light" ? "Dark" : "Light"}
                  </button>
                </div>
                {role === "guest" ? (
                  <Button asChild variant="hero" className="w-full">
                    <Link to="/login" onClick={() => setOpen(false)}>
                      <LogIn /> Login / Register
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      signOut();
                      setOpen(false);
                    }}
                  >
                    <LogOut /> Log out
                  </Button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DrawerGroup({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: readonly { to: string; label: string; icon: typeof Home }[];
  onNavigate: () => void;
}) {
  return (
    <div className="mb-2">
      <p className="px-3 pb-2 text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted active:scale-[0.98]"
              activeProps={{ className: "bg-primary-soft text-primary font-semibold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              <item.icon className="size-4.5 shrink-0" strokeWidth={1.75} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.label === "Notifications" && (
                <Badge variant="default" className="px-1.5">
                  2
                </Badge>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

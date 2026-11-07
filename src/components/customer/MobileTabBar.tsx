import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, Heart, Receipt, ShoppingBag } from "lucide-react";
import { cartCount, useCart } from "@/store/cart";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/categories", label: "Browse", icon: LayoutGrid, exact: false },
  { to: "/cart", label: "Cart", icon: ShoppingBag, exact: false },
  { to: "/favorites", label: "Saved", icon: Heart, exact: false },
  { to: "/orders", label: "Orders", icon: Receipt, exact: false },
] as const;

export function MobileTabBar() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const count = hydrated ? cartCount(lines) : 0;

  return (
    <nav
      aria-label="Primary"
      className="glass-strong fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border/60 pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          activeOptions={{ exact: t.exact }}
          activeProps={{
            className: cn("text-primary", "[&>svg]:scale-110"),
          }}
          className={cn(
            "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold",
            "text-muted-foreground transition-all duration-200",
            "active:scale-90",
          )}
        >
          <t.icon className="size-5 transition-transform duration-200" strokeWidth={1.75} />
          {t.to === "/cart" && count > 0 && (
            <span
              className={cn(
                "absolute top-1 right-[26%] grid min-w-4 place-items-center rounded-full",
                "bg-primary px-1 text-[9px] font-bold text-primary-foreground",
                "animate-[badge-pop_0.3s_ease-out]",
              )}
            >
              {count}
            </span>
          )}
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

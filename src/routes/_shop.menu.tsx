import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/Primitives";
import { ProductCard, ProductCardSkeleton } from "@/components/customer/ProductCard";
import { formatPKR } from "@/lib/format";
import { fetchCategories, fetchProducts } from "@/lib/api";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

type MenuSearch = {
  category: string | undefined;
  sort: "popularity" | "price" | "spice" | undefined;
};

export const Route = createFileRoute("/_shop/menu")({
  validateSearch: (search: Record<string, unknown>): MenuSearch => {
    const rawCategory = search["category"];
    const rawSort = search["sort"];
    return {
      category: typeof rawCategory === "string" ? rawCategory : undefined,
      sort:
        rawSort === "price" || rawSort === "spice" || rawSort === "popularity"
          ? rawSort
          : undefined,
    };
  },

  head: () => ({
    meta: [
      { title: "Artisanal Menu — PINDI CRUST" },
      {
        name: "description",
        content:
          "The full Pindi Crust menu: wood-fired signature pizzas, wagyu burgers, hearth starters, dolci and craft drinks with live prices.",
      },
      { property: "og:title", content: "Artisanal Menu — PINDI CRUST" },
      {
        property: "og:description",
        content:
          "Savor the crunch of hearth-baked perfection. Browse the full menu and order online.",
      },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { category, sort = "popularity" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);

  const list = useMemo(() => {
    let items = category ? products.filter((p) => p.category === category) : products;
    items = [...items];
    if (sort === "price") items.sort((a, b) => a.price - b.price);
    else if (sort === "spice")
      items.sort((a, b) => Number(b.badges.includes("spicy")) - Number(a.badges.includes("spicy")));
    else items.sort((a, b) => b.reviewCount - a.reviewCount);
    return items;
  }, [products, category, sort]);

  const count = hydrated ? cartCount(lines) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar categories (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <h2 className="font-display text-xl font-bold text-primary">Categories</h2>
            <p className="text-xs text-muted-foreground">Handpicked selection</p>
            <ul className="mt-5 space-y-1">
              <li>
                <button
                  onClick={() => navigate({ to: ".", search: { category: undefined, sort } })}
                  className={cn(
                    "w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors",
                    !category ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  All Items
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => navigate({ to: ".", search: { category: c.slug, sort } })}
                    className={cn(
                      "w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors",
                      category === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                    )}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl leading-tight font-bold sm:text-4xl">
                Artisanal Menu
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Savor the crunch of hearth-baked perfection.
              </p>
            </div>
          </header>

          {/* Mobile category chips */}
          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            <Chip
              active={!category}
              onClick={() => navigate({ to: ".", search: { category: undefined, sort } })}
            >
              All
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c.id}
                active={category === c.slug}
                onClick={() => navigate({ to: ".", search: { category: c.slug, sort } })}
              >
                {c.name}
              </Chip>
            ))}
          </div>

          {/* Sort */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Sort by</span>
            <div className="flex gap-1 rounded-full bg-muted p-1">
              {(["popularity", "price", "spice"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => navigate({ to: ".", search: { category, sort: s } })}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                    sort === s ? "bg-card text-primary shadow-soft" : "text-muted-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grid — 3 across on mobile portrait */}
          <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>

          {!loading && list.length === 0 && (
            <div className="mt-8">
              <EmptyState
                icon={<UtensilsCrossed className="size-7" />}
                title="Nothing on this shelf yet"
                description="We're firing up new items for this category. Try another one in the meantime."
                action={
                  <Button asChild variant="hero">
                    <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
                      Browse everything
                    </Link>
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky cart bar */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-x-4 bottom-22 z-40 sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-105 sm:-translate-x-1/2"
          >
            <div className="glass-strong flex items-center gap-3 rounded-2xl p-3 shadow-lift">
              <span className="bg-primary-soft grid size-10 shrink-0 place-items-center rounded-xl text-primary">
                <ShoppingBag className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{count} items added</p>
                <p className="font-display truncate text-base font-bold text-primary">
                  {formatPKR(cartSubtotal(lines))}
                </p>
              </div>
              <Button asChild variant="hero" className="shrink-0">
                <Link to="/cart">
                  View Cart <ArrowRight />
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Search, TrendingUp, X } from "lucide-react";
import { EmptyState } from "@/components/shared/Primitives";
import { ProductCard, ProductCardSkeleton } from "@/components/customer/ProductCard";
import { Button } from "@/components/ui/button";
import { fetchCategories, fetchProducts } from "@/lib/api";
import { cn } from "@/lib/utils";

type SearchParams = { q: string; category: string | undefined };

export const Route = createFileRoute("/_shop/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    category: typeof search["category"] === "string" ? search["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search the Menu — PINDI CRUST" },
      {
        name: "description",
        content:
          "Search PINDI CRUST's full menu of wood-fired pizzas, burgers, starters, dolci and drinks.",
      },
      { property: "og:title", content: "Search the Menu — PINDI CRUST" },
      { property: "og:description", content: "Find your next favourite dish, fast." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [term, setTerm] = useState(q);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const loading = productsLoading;

  // "Trending" = the dishes flagged as best sellers / popular in the menu, not a hardcoded list.
  const trending = useMemo(
    () =>
      products
        .filter((p) => p.popular || p.badges.includes("bestseller"))
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 4)
        .map((p) => p.name),
    [products],
  );

  useEffect(() => setTerm(q), [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      navigate({ to: ".", search: { q: term, category }, replace: true });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.short.toLowerCase().includes(query);
      const matchesCategory = !category || p.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [q, category, products]);

  const hasQuery = q.trim().length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-2xl leading-tight font-bold sm:text-4xl">Search</h1>

      <div className="glass-strong mt-5 flex items-center gap-2 rounded-2xl p-2 shadow-lift">
        <Search className="ml-2 size-5 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search for pizza, burgers, dolci…"
          aria-label="Search the menu"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        {term && (
          <button
            aria-label="Clear search"
            onClick={() => setTerm("")}
            className="mr-1 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        <Chip
          active={!category}
          onClick={() => navigate({ to: ".", search: { q, category: undefined } })}
        >
          All
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            active={category === c.slug}
            onClick={() => navigate({ to: ".", search: { q, category: c.slug } })}
          >
            {c.name}
          </Chip>
        ))}
      </div>

      {!hasQuery && (
        <div className="mt-8 space-y-8">
          {trending.length > 0 && (
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-bold">
                <TrendingUp className="size-4 text-primary" /> Trending Searches
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {trending.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTerm(t)}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold">Popular Picks</h2>
            <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-4">
              {products
                .filter((p) => p.popular)
                .slice(0, 6)
                .map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
            </div>
          </div>
        </div>
      )}

      {hasQuery && (
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={<Flame className="size-7" />}
              title="No dishes found"
              description={`We couldn't find anything for "${q}". Try another search or browse the menu.`}
              action={
                <Button asChild variant="hero">
                  <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
                    Browse Menu
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {results.length} result{results.length !== 1 && "s"} for "{q}"
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-4">
                {results.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
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

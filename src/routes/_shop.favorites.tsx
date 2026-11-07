import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/shared/Primitives";
import { ProductCard, ProductCardSkeleton } from "@/components/customer/ProductCard";
import { fetchProducts } from "@/lib/api";
import { usePrefs } from "@/store/prefs";
import { useHydrated } from "@/hooks/use-hydrated";

export const Route = createFileRoute("/_shop/favorites")({
  head: () => ({
    meta: [
      { title: "My Favorites — PINDI CRUST" },
      {
        name: "description",
        content: "Your saved favourite dishes at PINDI CRUST, ready to order again in one tap.",
      },
      { property: "og:title", content: "My Favorites — PINDI CRUST" },
      { property: "og:description", content: "Quickly reorder the PINDI CRUST dishes you love." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const hydrated = useHydrated();
  const favorites = usePrefs((s) => s.favorites);
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  // Favorites are saved on this device. Dishes that were removed from the menu simply drop out.
  const items = hydrated ? products.filter((p) => favorites.includes(p.id)) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        title="My Favorites"
        subtitle="Your saved crust-lover picks, always one tap away."
      />

      {isLoading ? (
        <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : hydrated && items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<Heart className="size-7" />}
            title="No favorites yet"
            description="Tap the heart icon on any dish to save it here for quick reordering."
            action={
              <Button asChild variant="hero">
                <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
                  Explore the Menu
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

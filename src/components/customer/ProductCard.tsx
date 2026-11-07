import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Flame, Heart, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";
import { usePrefs } from "@/store/prefs";
import { useHydrated } from "@/hooks/use-hydrated";

const badgeLabel: Record<string, string> = {
  bestseller: "Best Seller",
  new: "New",
  spicy: "Spicy",
  vegetarian: "Veg",
  premium: "Premium",
};

/** Check reduced motion preference */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add);
  const favorites = usePrefs((s) => s.favorites);
  const toggleFavorite = usePrefs((s) => s.toggleFavorite);
  const hydrated = useHydrated();
  const faved = hydrated && favorites.includes(product.id);
  const primary = product.badges[0];
  const reduced = prefersReducedMotion();

  return (
    <motion.article
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: reduced ? 0 : 0.35,
        delay: reduced ? 0 : Math.min(index * 0.04, 0.24),
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift sm:rounded-3xl"
    >
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={900}
          height={900}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-107"
        />
        {primary && (
          <Badge
            variant={primary}
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[8px] sm:top-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-[11px]"
          >
            {primary === "spicy" && <Flame className="size-2.5 sm:size-3" />}
            {badgeLabel[primary]}
          </Badge>
        )}
        {product.oldPrice && (
          <span className="absolute top-1.5 right-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[8px] font-bold text-destructive-foreground sm:top-3 sm:right-3 sm:px-2 sm:py-1 sm:text-[11px]">
            -{Math.round((1 - product.price / product.oldPrice) * 100)}%
          </span>
        )}
      </Link>

      <button
        onClick={() => toggleFavorite(product.id)}
        aria-label={faved ? `Remove ${product.name} from favorites` : `Save ${product.name}`}
        aria-pressed={faved}
        className="glass absolute top-1.5 right-1.5 hidden size-8 place-items-center rounded-full text-foreground transition-all duration-200 hover:scale-110 active:scale-95 sm:grid"
        style={{ display: product.oldPrice ? "none" : undefined }}
      >
        <Heart
          className={cn(
            "size-4 transition-all duration-200",
            faved && "fill-primary text-primary scale-110",
          )}
        />
      </button>

      <div className="flex flex-1 flex-col p-2 sm:p-4">
        <div className="flex items-start justify-between gap-1">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="font-display line-clamp-2 text-[13px] leading-tight font-bold transition-colors duration-200 hover:text-primary sm:text-lg"
          >
            {product.name}
          </Link>
          <span className="hidden shrink-0 items-center gap-0.5 text-xs font-bold sm:flex">
            <Star className="size-3.5 fill-secondary text-secondary" />
            {product.rating}
          </span>
        </div>

        <p className="mt-1 hidden line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:block">
          {product.short}
        </p>

        <div className="mt-auto flex items-end justify-between gap-1 pt-2">
          <div className="min-w-0">
            {product.oldPrice && (
              <p className="text-[9px] text-muted-foreground line-through sm:text-xs">
                {formatPKR(product.oldPrice)}
              </p>
            )}
            <p className="font-display truncate text-sm font-bold text-primary sm:text-xl">
              {formatPKR(product.price)}
            </p>
          </div>
          <button
            onClick={() => {
              add(product);
              toast.success(`${product.name} added to cart`);
            }}
            aria-label={`Quick add ${product.name} to cart`}
            className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition-all duration-200 hover:scale-110 hover:shadow-glow active:scale-95 sm:size-10"
          >
            <Plus className="size-3.5 sm:size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card sm:rounded-3xl">
      <div className="skeleton-shimmer aspect-square" />
      <div className="space-y-2 p-2 sm:p-4">
        <div className="skeleton-shimmer h-3.5 w-3/4 rounded-full" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded-full" />
        <div className="skeleton-shimmer h-5 w-2/3 rounded-full" />
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import { motion } from "motion/react";
import {
  ArrowRight,
  Boxes,
  Beef,
  Croissant,
  CupSoda,
  IceCreamCone,
  MapPin,
  Phone,
  Pizza,
  Quote,
  Search,
  SlidersHorizontal,
  Star,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeAdvertisement } from "@/components/customer/HomeAdvertisement";
import { SectionHeading } from "@/components/shared/Primitives";
import { ProductCard } from "@/components/customer/ProductCard";
import { images } from "@/lib/images";
import { stores, storeInfo } from "@/lib/store-config";
import { fetchApprovedReviews, fetchCategories, fetchOffers, fetchProducts } from "@/lib/api";
import { useThemeStore } from "@/store/theme";

export const Route = createFileRoute("/_shop/")({
  head: () => ({
    meta: [
      { title: "PINDI CRUST — Artisanal Wood-Fired Pizza in Rawalpindi" },
      {
        name: "description",
        content:
          "Slow-fermented dough, wood-fired at 480°C. Order signature pizzas, burgers and dolci from Pindi Crust with live delivery tracking.",
      },
      { property: "og:title", content: "PINDI CRUST — Artisanal Crust, Pure Happiness" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Premium wood-fired pizza delivered hot across Rawalpindi & Islamabad.",
      },
    ],
  }),
  component: HomePage,
});

const iconMap = { Pizza, Beef, Croissant, IceCreamCone, CupSoda, Boxes };

function HomePage() {
  const promotionsEnabled = useThemeStore((s) => s.promotionsEnabled);
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const { data: offers = [] } = useQuery({ queryKey: ["offers"], queryFn: fetchOffers });
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "approved"],
    queryFn: fetchApprovedReviews,
  });
  const catalogMissing = !productsLoading && products.length === 0;
  const bestSellers = products.filter((p) => p.badges.includes("bestseller"));
  const recommended = products.filter((p) => p.recommended);
  const popular = products.filter((p) => p.popular);

  return (
    <div className="pb-4">
      <HomeAdvertisement offers={offers} enabled={promotionsEnabled} />
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={images.heroOven}
          alt="Pizzaiolo drawing a wood-fired pizza from the brick oven"
          width={1600}
          height={1000}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-charcoal/92 via-charcoal/70 to-charcoal/25" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl"
          >
            <h1 className="font-display mt-4 text-4xl leading-[1.05] font-bold text-cream text-balance sm:text-6xl">
              Artisanal Crust,
              <span className="block text-secondary">Pure Happiness</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/80 text-pretty sm:text-base">
              Experience the alchemy of ancient flour, fiercely local ingredients and the roaring
              heat of our stone ovens — delivered to your door.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="hero">
                <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
                  Order Now <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="glass">
                <Link to="/categories">View Categories</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search + filters */}
      <div className="relative z-10 mx-auto mt-6 max-w-5xl px-4 sm:px-6">
        <div className="glass-strong flex items-center gap-2 rounded-2xl p-2 shadow-lift">
          <Search className="ml-2 size-5 shrink-0 text-muted-foreground" />
          <input
            placeholder="Search for your favourite pizza, burger…"
            aria-label="Search the menu"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button asChild size="sm" variant="hero" className="shrink-0">
            <Link to="/search" search={{ q: "", category: undefined }}>
              <SlidersHorizontal /> <span className="hidden sm:inline">Filters</span>
            </Link>
          </Button>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {["Vegetarian", "Spicy", "Under Rs 1500", "Best Sellers", "New", "Bundles"].map((f) => (
            <Link
              key={f}
              to="/menu"
              search={{ category: undefined, sort: "popularity" as const }}
              className="shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {f}
            </Link>
          ))}
        </div>
      </div>

      {catalogMissing && (
        <section className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
          {productsError ? (
            <QueryErrorState error={productsError} label="the menu" />
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              The menu hasn't been published yet.
            </p>
          )}
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading
            center
            eyebrow="Handpicked"
            title="Explore Our Categories"
            subtitle="Find your favourite way to enjoy the hearth."
          />
          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c, i) => {
              const Icon = iconMap[c.icon as keyof typeof iconMap];
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to="/menu"
                    search={{ category: c.slug, sort: "popularity" as const }}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-3 text-center shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift sm:p-5"
                  >
                    <span className="bg-primary-soft grid size-11 place-items-center rounded-full text-primary transition-transform group-hover:scale-110 sm:size-14">
                      <Icon className="size-5 sm:size-6" strokeWidth={1.5} />
                    </span>
                    <span className="text-[11px] leading-tight font-semibold sm:text-sm">
                      {c.name}
                    </span>
                    <span className="hidden text-[11px] text-muted-foreground sm:block">
                      {c.count} items
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading
            center
            eyebrow="Crowd Favourites"
            title="Our Best Sellers"
            subtitle="The slices our regulars order on repeat."
          />
          <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {bestSellers.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended */}
      {recommended.length > 0 && (
        <section className="bg-surface-container py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="For You"
              title="Recommended Items"
              subtitle="Picked by our kitchen."
            />
            <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-4 lg:grid-cols-4">
              {recommended.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading eyebrow="Trending Now" title="Popular This Week" />
          <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {popular.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Promo strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="bg-ember-gradient grid gap-6 rounded-4xl p-8 text-primary-foreground sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight font-bold text-balance sm:text-4xl">
              Hand-stretched. Wood-fired. Made to order.
            </h2>
            <p className="mt-2 max-w-lg text-sm text-primary-foreground/80 text-pretty">
              Browse the full menu and build your perfect pie.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="glass">
              <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
                <Truck /> Start Ordering
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {reviews.some((r) => r.status === "approved") && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading center eyebrow="Kind Words" title="What Our Crust-Lovers Say" />
          <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3">
            {reviews
              .filter((r) => r.status === "approved")
              .slice(0, 3)
              .map((r) => (
                <figure
                  key={r.id}
                  className="w-[86%] shrink-0 snap-center rounded-3xl border border-border/70 bg-card p-6 shadow-soft lg:w-auto"
                >
                  <Quote className="size-7 text-primary/25" />
                  <blockquote className="mt-3 text-sm leading-relaxed text-pretty">
                    {r.body}
                  </blockquote>
                  <figcaption className="mt-5 flex min-w-0 items-center gap-3">
                    <span className="bg-primary-soft grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-primary">
                      {r.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{r.author}</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="size-3 fill-secondary text-secondary" />
                        ))}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
          </div>
        </section>
      )}

      {/* Stores + map */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
          <div>
            <SectionHeading eyebrow="Find Us" title="Visit Our Stores" />
            <ul className="mt-6 space-y-4">
              {stores.length === 0 && (
                <li className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Branch locations will be listed here once they're published.
                </li>
              )}
              {stores.map((s) => (
                <li
                  key={s.id}
                  className="flex min-w-0 gap-3 border-b border-border pb-4 last:border-0"
                >
                  <span className="bg-primary-soft grid size-10 shrink-0 place-items-center rounded-xl text-primary">
                    <MapPin className="size-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.address}</p>
                    <p className="mt-0.5 text-xs font-semibold text-primary">{s.hours}</p>
                  </div>
                </li>
              ))}
              {storeInfo.phone && (
                <li className="flex items-center gap-3">
                  <span className="bg-primary-soft grid size-10 shrink-0 place-items-center rounded-xl text-primary">
                    <Phone className="size-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-bold">Call for Delivery</p>
                    <p className="text-xs text-primary">{storeInfo.phone}</p>
                  </div>
                </li>
              )}
            </ul>
          </div>
          {stores.length > 0 && storeInfo.address && (
            <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
              <iframe
                title="Pindi Crust store locations map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=72.98%2C33.52%2C73.16%2C33.66&layer=mapnik"
                className="h-80 w-full lg:h-[26rem]"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

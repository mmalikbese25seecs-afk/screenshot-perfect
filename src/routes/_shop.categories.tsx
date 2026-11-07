import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Beef, Boxes, Croissant, CupSoda, IceCreamCone, Pizza, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/Primitives";
import { fetchCategories } from "@/lib/api";

export const Route = createFileRoute("/_shop/categories")({
  head: () => ({
    meta: [
      { title: "Menu Categories — PINDI CRUST" },
      {
        name: "description",
        content:
          "Browse Pindi Crust categories: signature wood-fired pizzas, burgers, hearth starters, dolci, craft drinks and family bundles.",
      },
      { property: "og:title", content: "Menu Categories — PINDI CRUST" },
      {
        property: "og:description",
        content: "Six ways to fall in love with the hearth. Browse every Pindi Crust category.",
      },
    ],
  }),
  component: CategoriesPage,
});

const iconMap = { Pizza, Beef, Croissant, IceCreamCone, CupSoda, Boxes };

function CategoriesPage() {
  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title="Explore Categories"
        subtitle="Every corner of the Pindi Crust hearth, organised."
      />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-52 rounded-3xl" />
            ))
          : categories.map((c) => {
              const Icon = iconMap[c.icon as keyof typeof iconMap];
              return (
                <Link
                  key={c.id}
                  to="/menu"
                  search={{ category: c.slug, sort: "popularity" as const }}
                  className="group relative isolate overflow-hidden rounded-3xl shadow-soft transition-transform hover:-translate-y-1"
                >
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    width={900}
                    height={900}
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-107 sm:h-56"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-charcoal/90 via-charcoal/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <span className="glass mb-2 inline-grid size-9 place-items-center rounded-xl text-cream">
                        <Icon className="size-4.5" strokeWidth={1.5} />
                      </span>
                      <h2 className="font-display truncate text-base leading-tight font-bold text-cream sm:text-xl">
                        {c.name}
                      </h2>
                      <p className="text-[11px] text-cream/70">{c.count} items</p>
                    </div>
                    <ArrowRight className="size-5 shrink-0 text-cream transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}

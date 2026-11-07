import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ChevronRight, Flame, ShoppingBag, Star, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/Primitives";
import { ProductCard } from "@/components/customer/ProductCard";
import { QuantityStepper } from "@/components/customer/QuantityStepper";
import { formatPKR } from "@/lib/format";
import type { AddOn, Product } from "@/lib/types";
import { BackendNotice } from "@/components/shared/BackendNotice";
import { isBackendNotConfigured } from "@/lib/supabaseClient";
import { fetchAddOns, fetchProductBySlug, fetchProductReviews, fetchProducts } from "@/lib/api";
import { useCart } from "@/store/cart";

const badgeLabel: Record<string, string> = {
  bestseller: "Best Seller",
  new: "New",
  spicy: "Spicy",
  vegetarian: "Veg",
  premium: "Premium",
};

export const Route = createFileRoute("/_shop/product/$slug")({
  loader: async ({ params }) => {
    try {
      const product = await fetchProductBySlug(params.slug);
      if (!product) throw notFound();
      return { product };
    } catch (err) {
      // No backend: show the honest not-connected state instead of a 500 error page.
      if (isBackendNotConfigured(err)) throw notFound({ data: { backendMissing: true } });
      throw err;
    }
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    return {
      meta: [
        { title: `${product ? product.name : "Product"} — PINDI CRUST` },
        {
          name: "description",
          content: product
            ? `${product.short} Order ${product.name} online from PINDI CRUST for hot, hearth-baked delivery.`
            : "Discover our artisanal menu at PINDI CRUST.",
        },
        { property: "og:title", content: `${product ? product.name : "Product"} — PINDI CRUST` },
        {
          property: "og:description",
          content: product?.short ?? "Premium wood-fired food, delivered hot.",
        },
      ],
    };
  },
  notFoundComponent: ({ data }) => (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {(data as { backendMissing?: boolean } | undefined)?.backendMissing ? (
        <BackendNotice description="Menu items will appear here once the backend is connected. No information is being saved in preview mode." />
      ) : (
        <EmptyState
          icon={<Flame className="size-7" />}
          title="This dish isn't on the menu"
          description="It may have been retired from our hearth. Explore the rest of the menu instead."
          action={
            <Button asChild variant="hero">
              <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
                Back to Menu
              </Link>
            </Button>
          }
        />
      )}
    </div>
  ),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const add = useCart((s) => s.add);
  const navigate = Route.useNavigate();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const { data: allAddOns = [] } = useQuery({ queryKey: ["add_ons"], queryFn: fetchAddOns });
  const { data: allProducts = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: productReviews = [] } = useQuery({
    queryKey: ["reviews", "product", product.name],
    queryFn: () => fetchProductReviews(product.name),
  });

  const groups = useMemo(() => {
    const map = new Map<string, AddOn[]>();
    for (const a of allAddOns) {
      if (!map.has(a.group)) map.set(a.group, []);
      map.get(a.group)!.push(a);
    }
    return Array.from(map.entries());
  }, [allAddOns]);

  const chosenAddOns = allAddOns.filter((a) => selected[a.id]);
  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const unitPrice = product.price + chosenAddOns.reduce((s, a) => s + a.price, 0);

  function handleAdd() {
    add(
      product,
      qty,
      chosenAddOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
    );
    toast.success(`${product.name} added to cart`);
  }

  function handleBuyNow() {
    handleAdd();
    navigate({ to: "/checkout" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <nav className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        <Link
          to="/menu"
          search={{ category: undefined, sort: "popularity" as const }}
          className="shrink-0 hover:text-primary"
        >
          Menu
        </Link>
        <ChevronRight className="size-3 shrink-0" />
        <span className="truncate font-semibold text-foreground">{product.name}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
            <motion.img
              key={activeImg}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              src={product.gallery[activeImg] ?? product.image}
              alt={product.name}
              width={900}
              height={900}
              className="size-full object-cover"
            />
          </div>
          {product.gallery.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              {product.gallery.map((img: string, i: number) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1} of ${product.name}`}
                  className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:size-20 ${
                    activeImg === i ? "border-primary" : "border-transparent opacity-70"
                  }`}
                >
                  <img src={img} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {product.badges.map((b) => (
              <Badge key={b} variant={b}>
                {b === "spicy" && <Flame className="size-3" />}
                {badgeLabel[b]}
              </Badge>
            ))}
          </div>
          <h1 className="font-display mt-3 text-2xl leading-tight font-bold text-balance sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 font-bold">
              <Star className="size-4 fill-secondary text-secondary" />
              {product.rating}
            </span>
            <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            {product.short}
          </p>

          <div className="mt-4 flex items-end gap-3">
            {product.oldPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPKR(product.oldPrice)}
              </span>
            )}
            <span className="font-display text-2xl font-bold text-primary sm:text-3xl">
              {formatPKR(unitPrice)}
            </span>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-pretty">{product.description}</p>

          {/* Ingredients */}
          <div className="mt-5">
            <h2 className="text-sm font-bold">Ingredients</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.ingredients.map((ing: string) => (
                <span
                  key={ing}
                  className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Nutrition */}
          <div className="mt-5">
            <h2 className="text-sm font-bold">Nutrition</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {product.nutrition.map((n: { label: string; value: string }) => (
                <div
                  key={n.label}
                  className="rounded-xl border border-border/70 bg-card px-3 py-2 text-center shadow-soft"
                >
                  <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                    {n.label}
                  </p>
                  <p className="text-sm font-bold">{n.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className="mt-6 space-y-5">
            {groups.map(([group, items]) => (
              <div key={group}>
                <h2 className="text-sm font-bold">{group}</h2>
                <div className="mt-2 space-y-2">
                  {items.map((a) => (
                    <label
                      key={a.id}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-soft"
                    >
                      <Checkbox
                        checked={!!selected[a.id]}
                        onCheckedChange={(v) => setSelected((s) => ({ ...s, [a.id]: v === true }))}
                        aria-label={a.name}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.name}</span>
                      <span className="shrink-0 text-xs font-bold text-primary">
                        +{formatPKR(a.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Qty + actions */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-semibold">Quantity</span>
            <QuantityStepper qty={qty} onChange={setQty} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button size="lg" variant="outline" onClick={handleAdd} className="min-h-11">
              <ShoppingBag /> Add to Cart
            </Button>
            <Button size="lg" variant="hero" onClick={handleBuyNow} className="min-h-11">
              <Zap /> Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-14">
        <h2 className="font-display text-xl font-bold sm:text-2xl">
          Reviews ({productReviews.length})
        </h2>
        {productReviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No reviews yet — be the first to try {product.name}.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {productReviews.map((r) => (
              <div
                key={r.id}
                className="min-w-0 rounded-2xl border border-border/70 bg-card p-4 shadow-soft"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-primary-soft grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-primary">
                    {r.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{r.author}</p>
                    <span className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="size-3 fill-secondary text-secondary" />
                      ))}
                    </span>
                  </div>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-pretty">{r.body}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{r.date}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold sm:text-2xl">You may also like</h2>
          <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

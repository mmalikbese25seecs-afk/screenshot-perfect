import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { LogIn, PackageSearch, ReceiptText, Repeat, Truck } from "lucide-react";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/shared/Primitives";
import { formatPKR } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { fetchAddOns, fetchMyOrders, fetchProducts } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shop/orders")({
  head: () => ({
    meta: [
      { title: "Order History — PINDI CRUST" },
      {
        name: "description",
        content:
          "Track and review your past PINDI CRUST orders, reorder favourites or track active deliveries.",
      },
      { property: "og:title", content: "Order History — PINDI CRUST" },
      {
        property: "og:description",
        content: "View your PINDI CRUST order history and delivery status.",
      },
    ],
  }),
  component: OrdersPage,
});

const filters = ["All", "Active", "Delivered", "Cancelled"] as const;

const statusMeta: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  preparing: { label: "Preparing", className: "bg-secondary/20 text-secondary-foreground" },
  baking: { label: "Baking", className: "bg-primary-soft text-primary" },
  out_for_delivery: { label: "Out for Delivery", className: "bg-chart-2/20 text-chart-2" },
  delivered: { label: "Delivered", className: "bg-success/15 text-success" },
  cancelled: { label: "Cancelled", className: "bg-destructive/15 text-destructive" },
};

const activeStatuses: OrderStatus[] = ["pending", "preparing", "baking", "out_for_delivery"];

function OrdersPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const add = useCart((s) => s.add);
  const userId = useAuth((s) => s.userId);
  const authLoading = useAuth((s) => s.isLoading);

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-orders", userId],
    queryFn: fetchMyOrders,
    enabled: !!userId,
    // Status changes while the page is open (e.g. "baking" -> "out for delivery").
    refetchInterval: 15000,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    enabled: !!userId,
  });
  const { data: addOns = [] } = useQuery({
    queryKey: ["add_ons"],
    queryFn: fetchAddOns,
    enabled: !!userId,
  });

  const filtered = orders.filter((o) => {
    if (filter === "All") return true;
    if (filter === "Active") return activeStatuses.includes(o.status);
    if (filter === "Delivered") return o.status === "delivered";
    return o.status === "cancelled";
  });

  const reorder = (order: Order) => {
    const activeAddOns = new Map(addOns.map((a) => [a.id, a]));
    let added = 0;
    let skipped = 0;
    order.items.forEach((item) => {
      // Match on product id so a renamed dish still reorders; skip dishes that were retired.
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        skipped += 1;
        return;
      }
      // Keep only add-ons that are still offered, at today's price.
      const chosen = item.addOns.flatMap((a) => {
        const current = activeAddOns.get(a.id);
        return current ? [{ id: current.id, name: current.name, price: current.price }] : [];
      });
      add(product, item.qty, chosen);
      added += 1;
    });
    if (added === 0) toast.error("None of these items are on the menu right now");
    else if (skipped > 0)
      toast.success(`Added ${added} item(s) from ${order.id}. ${skipped} no longer on the menu.`);
    else toast.success(`Items from ${order.id} added to cart`);
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader
          title="Order History"
          subtitle="Track, reorder and revisit your past cravings."
        />
        <div className="mt-6 space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader
          title="Order History"
          subtitle="Track, reorder and revisit your past cravings."
        />
        <div className="mt-10">
          <EmptyState
            icon={<LogIn className="size-7" />}
            title="Sign in to see your orders"
            description="Your order history is saved to your account. Placed an order as a guest? Use Track Order with your order number and phone."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="hero">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/track">Track an order</Link>
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader title="Order History" subtitle="Track, reorder and revisit your past cravings." />

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-3xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-10">
          <QueryErrorState error={error} label="your orders" onRetry={() => refetch()} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<PackageSearch className="size-7" />}
            title="No orders here"
            description="Once you place an order it will show up in this list."
            action={
              <Button asChild variant="hero">
                <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
                  Browse Menu
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((o, i) => {
            const meta = statusMeta[o.status];
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{o.id}</p>
                    <p className="text-xs text-muted-foreground">{o.placedAt}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
                      meta.className,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>

                <ul className="mt-3 space-y-1 border-y border-border/60 py-3 text-sm">
                  {o.items.map((item) => (
                    <li key={item.name} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-muted-foreground">
                        {item.qty}× {item.name}
                      </span>
                      <span className="shrink-0 font-semibold">
                        {formatPKR(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display text-lg font-bold text-primary">
                    {formatPKR(o.total)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="soft" onClick={() => reorder(o)}>
                      <Repeat className="size-3.5" /> Reorder
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/receipt" search={{ orderId: o.id }}>
                        <ReceiptText className="size-3.5" /> Receipt
                      </Link>
                    </Button>
                    {activeStatuses.includes(o.status) && (
                      <Button asChild size="sm" variant="hero">
                        <Link to="/track" search={{ orderId: o.id }}>
                          <Truck className="size-3.5" /> Track
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

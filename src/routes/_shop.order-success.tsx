import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CheckCircle2, MapPin, Truck, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storeInfo } from "@/lib/store-config";

type OrderSuccessSearch = { orderId: string | undefined };

export const Route = createFileRoute("/_shop/order-success")({
  validateSearch: (search: Record<string, unknown>): OrderSuccessSearch => ({
    orderId: typeof search["orderId"] === "string" ? search["orderId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmed — PINDI CRUST" },
      {
        name: "description",
        content: "Your PINDI CRUST order has been placed successfully and is being prepared fresh.",
      },
      { property: "og:title", content: "Order Confirmed — PINDI CRUST" },
      { property: "og:description", content: "Your hearth-baked order is on its way." },
    ],
  }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { orderId } = Route.useSearch();

  // Only a real order number (returned by placeOrder) justifies a success screen.
  if (!orderId) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:py-24">
        <span className="grid size-20 place-items-center rounded-full bg-surface-container text-muted-foreground">
          <UtensilsCrossed className="size-9" strokeWidth={1.5} />
        </span>
        <h1 className="font-display mt-6 text-2xl font-bold">No order to show</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          This page appears after an order is placed. Nothing has been ordered in this session.
        </p>
        <Button asChild size="lg" variant="hero" className="mt-6">
          <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
            Browse the menu
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:py-24">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="bg-primary-soft grid size-24 place-items-center rounded-full text-primary"
      >
        <CheckCircle2 className="size-12" strokeWidth={1.5} />
      </motion.div>

      <h1 className="font-display mt-6 text-3xl leading-tight font-bold text-balance sm:text-4xl">
        Order Placed Successfully!
      </h1>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">
        Thank you — your order is confirmed and headed straight to our wood-fired hearth.
      </p>

      <div className="mt-8 w-full rounded-2xl border border-border/70 bg-card p-5 text-left shadow-soft">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="font-display truncate text-lg font-bold">{orderId}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0 text-primary" />
          <span className="truncate">
            {storeInfo.address
              ? `Delivering from ${storeInfo.address}`
              : "Delivery details will be confirmed by the store."}
          </span>
        </div>
      </div>

      <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
        <Button asChild size="lg" variant="hero">
          <Link to="/track" search={{ orderId }}>
            <Truck /> Track Order
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
            <UtensilsCrossed /> Back to Menu
          </Link>
        </Button>
      </div>
    </div>
  );
}

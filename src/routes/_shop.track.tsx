import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Bike,
  Check,
  ChefHat,
  Flame,
  MapPin,
  MessageCircle,
  Package,
  PackageSearch,
  Phone,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/Primitives";
import { fetchMyOrders, trackOrder } from "@/lib/api";
import { formatPKR } from "@/lib/format";
import { storeInfo } from "@/lib/store-config";
import type { OrderStatus } from "@/lib/types";
import { useAuth } from "@/store/auth";

const steps = [
  { id: "pending", label: "Order Placed", icon: Package },
  { id: "preparing", label: "Preparing", icon: ChefHat },
  { id: "baking", label: "In the Oven", icon: Flame },
  { id: "out_for_delivery", label: "Out for Delivery", icon: Bike },
  { id: "delivered", label: "Delivered", icon: Check },
] as const;

const finished: OrderStatus[] = ["delivered", "cancelled"];

type TrackSearch = { orderId?: string | undefined };

export const Route = createFileRoute("/_shop/track")({
  validateSearch: (search: Record<string, unknown>): TrackSearch => ({
    orderId: typeof search["orderId"] === "string" ? search["orderId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track Your Order — PINDI CRUST" },
      {
        name: "description",
        content: "Follow your PINDI CRUST order in real time, from the hearth to your doorstep.",
      },
      { property: "og:title", content: "Track Your Order — PINDI CRUST" },
      { property: "og:description", content: "Live order status and delivery updates." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { orderId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const userId = useAuth((s) => s.userId);
  const authLoading = useAuth((s) => s.isLoading);

  // Guests prove ownership with the phone number the order was placed with.
  // It is kept in component state only, never in the URL.
  const [guestPhone, setGuestPhone] = useState<string | undefined>();
  const [orderInput, setOrderInput] = useState(orderId ?? "");
  const [phoneInput, setPhoneInput] = useState("");

  // Signed in and no order in the URL: follow their most recent order.
  const { data: mine = [], isLoading: mineLoading } = useQuery({
    queryKey: ["my-orders", userId],
    queryFn: fetchMyOrders,
    enabled: !!userId && !orderId,
  });
  const latestActive = mine.find((o) => !finished.includes(o.status)) ?? mine[0];
  const targetId = orderId ?? latestActive?.id;

  const {
    data: order,
    isLoading: orderLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["track", targetId, guestPhone],
    queryFn: () => trackOrder(targetId!, guestPhone),
    enabled: !!targetId,
    // Poll while the order is still moving; stop once it's delivered or cancelled.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && finished.includes(status) ? false : 8000;
    },
  });

  function submitLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = orderInput.trim().toUpperCase();
    if (!id) return;
    setGuestPhone(phoneInput.trim() || undefined);
    navigate({ to: ".", search: { orderId: id } });
  }

  if (authLoading || (!!userId && !orderId && mineLoading) || (!!targetId && orderLoading)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-6 h-40 w-full rounded-3xl" />
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!targetId || isError || !order) {
    const notFound = !!targetId;
    return (
      <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
        <EmptyState
          icon={<PackageSearch className="size-7" />}
          title={notFound ? "We couldn't find that order" : "Track your order"}
          description={
            notFound
              ? isError
                ? "Something went wrong while looking it up. Please try again."
                : "Check the order number, and if you're not signed in, the phone number you ordered with."
              : userId
                ? "You haven't placed an order yet. Enter an order number below to look one up."
                : "Enter your order number and the phone number you ordered with."
          }
        />
        <form
          onSubmit={submitLookup}
          className="mt-6 space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft"
        >
          <div>
            <Label htmlFor="track-order">Order number</Label>
            <Input
              id="track-order"
              className="mt-1.5"
              placeholder="PC-00042"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              autoComplete="off"
            />
          </div>
          {!userId && (
            <div>
              <Label htmlFor="track-phone">Phone number</Label>
              <Input
                id="track-phone"
                className="mt-1.5"
                placeholder="+92 300 1234567"
                inputMode="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="hero">
              Track order
            </Button>
            {isError && (
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            )}
            {!userId && (
              <Button asChild variant="ghost">
                <Link to="/login">Sign in instead</Link>
              </Button>
            )}
          </div>
        </form>
      </div>
    );
  }

  const cancelled = order.status === "cancelled";
  const stepIndex = steps.findIndex((s) => s.id === order.status);
  const current = cancelled ? null : steps[Math.max(stepIndex, 0)]!;
  const CurrentIcon = current?.icon ?? XCircle;

  const whatsappHref = storeInfo.whatsapp
    ? `https://wa.me/${storeInfo.whatsapp}?text=${encodeURIComponent(`Hi, I'd like an update on order ${order.id}`)}`
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight font-bold sm:text-4xl">Track Order</h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            Order {order.id} · placed {order.placedAt}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
            cancelled ? "bg-destructive/15 text-destructive" : "bg-primary-soft text-primary"
          }`}
        >
          {cancelled ? "Cancelled" : (current?.label ?? "")}
        </span>
      </div>

      {/* Current status */}
      <div className="relative mt-6 h-40 overflow-hidden rounded-3xl bg-brand-gradient shadow-soft sm:h-52">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <motion.div
            animate={cancelled || order.status === "delivered" ? {} : { y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
          >
            <CurrentIcon className="size-4 text-primary" />
            {cancelled
              ? "This order was cancelled"
              : order.status === "delivered"
                ? "Delivered. Enjoy!"
                : (current?.label ?? "")}
          </motion.div>
          {!cancelled && order.status !== "delivered" && (
            <p className="text-xs font-semibold text-primary-foreground/80">
              This page updates automatically
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      {!cancelled && (
        <div className="mt-8 space-y-0">
          {steps.map((s, i) => {
            const done = i <= stepIndex;
            const active = i === stepIndex && order.status !== "delivered";
            return (
              <div key={s.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
                <div className="flex flex-col items-center">
                  <motion.span
                    animate={active ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ repeat: active ? Infinity : 0, duration: 1.4 }}
                    className={`grid size-10 shrink-0 place-items-center rounded-full ${
                      done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <s.icon className="size-5" />
                  </motion.span>
                  {i < steps.length - 1 && (
                    <span
                      className={`w-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`}
                      style={{ minHeight: 32 }}
                    />
                  )}
                </div>
                <div className="pb-8">
                  <p className={`text-sm font-bold ${done ? "" : "text-muted-foreground"}`}>
                    {s.label}
                  </p>
                  {active && <p className="mt-0.5 text-xs text-primary">In progress…</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery + help */}
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-primary-soft grid size-11 shrink-0 place-items-center rounded-full text-primary">
            <MapPin className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Need a hand with this order?</p>
            <p className="truncate text-xs text-muted-foreground">
              {order.address || "Call or message the store"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {storeInfo.phone && (
            <Button asChild size="icon" variant="outline" aria-label="Call the store">
              <a href={`tel:${storeInfo.phone}`}>
                <Phone className="size-4" />
              </a>
            </Button>
          )}
          {whatsappHref && (
            <Button asChild size="icon" variant="hero" aria-label="Message the store on WhatsApp">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Order items recap */}
      <div className="mt-6 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
        <h2 className="text-sm font-bold">Order Items</h2>
        <ul className="mt-3 space-y-2">
          {order.items.map((it, i) => (
            <li
              key={`${it.name}-${i}`}
              className="flex min-w-0 items-center justify-between gap-2 text-sm"
            >
              <span className="min-w-0 truncate text-muted-foreground">
                {it.qty} × {it.name}
              </span>
              <span className="shrink-0 font-semibold">{formatPKR(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-bold">
          <span>Total</span>
          <span className="font-display text-lg text-primary">{formatPKR(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

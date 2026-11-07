import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChefHat, Clock, Flame, Inbox, StickyNote } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import {
  errorMessage,
  fetchOrders,
  subscribeToOrders,
  timeAgo,
  updateOrderStatus,
} from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen Display — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Kitchen queue for incoming, preparing and baking PINDI CRUST orders.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Kitchen Display — PINDI CRUST Admin" },
      { property: "og:description", content: "Live kitchen queue grouped by preparation stage." },
    ],
  }),
  component: KitchenPage,
});

/** Kitchen stages follow the existing order lifecycle; each advances to the next. */
const columns: {
  status: OrderStatus;
  label: string;
  next: OrderStatus;
  action: string;
  icon: typeof Inbox;
}[] = [
  { status: "pending", label: "New", next: "preparing", action: "Start prep", icon: Inbox },
  {
    status: "preparing",
    label: "Preparing",
    next: "baking",
    action: "Into the oven",
    icon: ChefHat,
  },
  {
    status: "baking",
    label: "In the oven",
    next: "out_for_delivery",
    action: "Ready / dispatch",
    icon: Flame,
  },
];

function KitchenPage() {
  const queryClient = useQueryClient();
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  // Live updates when a backend exists; a no-op otherwise.
  useEffect(
    () => subscribeToOrders(() => queryClient.invalidateQueries({ queryKey: ["orders"] })),
    [queryClient],
  );

  const advance = async (o: Order, next: OrderStatus) => {
    try {
      await updateOrderStatus(o.id, next);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <AdminPage title="Kitchen" subtitle="Tickets move left to right as they're prepared and baked.">
      {isError && (
        <QueryErrorState
          className="mb-4"
          error={error}
          label="live kitchen orders"
          onRetry={() => refetch()}
        />
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((col) => {
          const list = orders
            .filter((o) => o.status === col.status)
            .sort((a, b) => a.placedAtIso.localeCompare(b.placedAtIso));
          return (
            <section
              key={col.status}
              className="flex min-w-0 flex-col rounded-2xl border border-border bg-card shadow-soft"
            >
              <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h2 className="flex items-center gap-2 font-display text-base font-bold">
                  <col.icon className="size-4.5 text-primary" /> {col.label}
                </h2>
                <Badge variant="secondary">{list.length}</Badge>
              </header>
              <div className="flex-1 space-y-3 p-3">
                {isLoading &&
                  [0, 1].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
                {!isLoading && list.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                    No tickets here.
                  </p>
                )}
                {list.map((o) => (
                  <article key={o.id} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-bold">{o.id}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {o.customer} · {o.source === "pos" ? "Walk-in" : "Online"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground",
                        )}
                      >
                        <Clock className="size-3" /> {timeAgo(o.placedAtIso)}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm">
                      {o.items.map((it, i) => (
                        <li key={`${o.id}-${i}`} className="min-w-0">
                          <span className="font-bold">{it.qty}×</span> {it.name}
                          {it.addOns.length > 0 && (
                            <span className="block truncate pl-5 text-xs text-muted-foreground">
                              + {it.addOns.map((a) => a.name).join(", ")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {o.notes && (
                      <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-warning/10 px-2 py-1.5 text-xs">
                        <StickyNote className="mt-0.5 size-3 shrink-0 text-warning" /> {o.notes}
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="hero"
                      className="mt-3 w-full"
                      onClick={() => advance(o, col.next)}
                    >
                      {col.action}
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AdminPage>
  );
}

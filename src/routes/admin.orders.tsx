import { BackendNotice } from "@/components/shared/BackendNotice";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Ban,
  ClipboardList,
  MapPin,
  Phone,
  Printer,
  Search,
  ShoppingCart,
  Store,
} from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { fetchOrders, subscribeToOrders, updateOrderStatus } from "@/lib/api";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Track, filter and advance online and POS orders for PINDI CRUST in real time.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Orders — PINDI CRUST Admin" },
      { property: "og:description", content: "Live order management console for PINDI CRUST." },
    ],
  }),
  component: OrdersPage,
});

const statusFlow: OrderStatus[] = [
  "pending",
  "preparing",
  "baking",
  "out_for_delivery",
  "delivered",
];
const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  baking: "Baking",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const statusTone: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  preparing: "bg-primary-soft text-primary",
  baking: "bg-primary-soft text-primary",
  out_for_delivery: "bg-chart-2/15 text-chart-2",
  delivered: "bg-success/12 text-success",
  cancelled: "bg-destructive/12 text-destructive",
};

const statusFilters = ["all", ...statusFlow, "cancelled"] as const;

function OrdersPage() {
  const role = useAuth((s) => s.role);
  const isManager = role === "manager";
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders });

  // Live updates: whenever an order or order_item changes anywhere (e.g. a new
  // online order comes in), refetch so this dashboard updates without a reload.
  useEffect(() => {
    const unsubscribe = subscribeToOrders(() => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("all");
  const [source, setSource] = useState<"all" | "online" | "pos">("all");
  const [sort, setSort] = useState<"newest" | "total">("newest");
  const [active, setActive] = useState<Order | null>(null);
  const [receipt, setReceipt] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    let list = data.filter((o) => {
      const matchesQuery =
        !query ||
        o.id.toLowerCase().includes(query.toLowerCase()) ||
        o.customer.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || o.status === status;
      const matchesSource = source === "all" || o.source === source;
      return matchesQuery && matchesStatus && matchesSource;
    });
    if (sort === "total") list = [...list].sort((a, b) => b.total - a.total);
    return list;
  }, [data, query, status, source, sort]);

  const setOrderStatus = async (o: Order, s: OrderStatus) => {
    try {
      await updateOrderStatus(o.id, s);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`${o.id} set to ${statusLabel[s]}`);
    } catch (err) {
      console.error(err);
      toast.error(`Couldn't update ${o.id}`);
    }
  };

  const cancel = async (o: Order) => {
    if (isManager) return;
    await setOrderStatus(o, "cancelled");
  };

  const print = (o: Order) => setReceipt(o);

  return (
    <AdminPage title="Orders" subtitle="All online and POS orders across PINDI CRUST.">
      <BackendNotice
        when="unconfigured"
        compact
        className="mb-4"
        title="No live data"
        description="Figures below stay empty until the backend is connected. Zeros here are not real results."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 sm:max-w-xs">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order or customer…"
            aria-label="Search orders"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
            <SelectTrigger className="w-36" aria-label="Filter by source">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="pos">POS</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-36" aria-label="Sort orders">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="total">Highest total</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
              status === s
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {s === "all" ? "All" : statusLabel[s as OrderStatus]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="bg-muted grid size-14 place-items-center rounded-2xl text-muted-foreground">
            <ClipboardList className="size-6" />
          </span>
          <p className="font-display text-lg font-bold">No orders match your filters</p>
          <p className="text-sm text-muted-foreground">
            Try clearing the search or changing filters.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((o) => (
            <div
              key={o.id}
              className={cn(
                "flex min-w-0 flex-col gap-2 rounded-2xl border bg-card p-3 shadow-soft transition-shadow hover:shadow-lift sm:p-4",
                "border-border",
              )}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <p className="truncate text-sm font-bold">{o.id}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 gap-1",
                    o.source === "online" ? "text-primary" : "text-chart-2",
                  )}
                >
                  {o.source === "online" ? (
                    <ShoppingCart className="size-3" />
                  ) : (
                    <Store className="size-3" />
                  )}
                  {o.source}
                </Badge>
              </div>
              <Badge className={cn("w-fit capitalize", statusTone[o.status])} variant="outline">
                {statusLabel[o.status]}
              </Badge>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{o.customer}</p>
                <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                  <Phone className="size-3 shrink-0" /> {o.phone}
                </p>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">
                {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{formatPKR(o.total)}</p>
                <p className="text-[10px] text-muted-foreground">{o.placedAt}</p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 px-2 text-xs"
                  onClick={() => setActive(o)}
                >
                  Details
                </Button>
                <Select value={o.status} onValueChange={(v) => setOrderStatus(o, v as OrderStatus)}>
                  <SelectTrigger
                    className="h-8 w-[130px] text-xs"
                    aria-label={`Change status for ${o.id}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusFlow.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabel[s]}
                      </SelectItem>
                    ))}
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8"
                  aria-label={`Print receipt for ${o.id}`}
                  onClick={() => print(o)}
                >
                  <Printer className="size-3.5" />
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-8 text-destructive"
                        aria-label={`Cancel ${o.id}`}
                        disabled={isManager || o.status === "cancelled" || o.status === "delivered"}
                        onClick={() => cancel(o)}
                      >
                        <Ban className="size-3.5" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isManager && <TooltipContent>Managers cannot cancel orders</TooltipContent>}
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>{active.id}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Customer</p>
                  <p className="text-sm font-semibold">{active.customer}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="size-3" /> {active.phone}
                  </p>
                  <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 size-3 shrink-0" /> {active.address}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Items</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {active.items.map((i) => (
                      <li key={i.name} className="flex justify-between gap-2">
                        <span className="min-w-0 truncate">
                          {i.qty}× {i.name}
                        </span>
                        <span className="shrink-0">{formatPKR(i.price * i.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold">
                    <span>Total</span>
                    <span>{formatPKR(active.total)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    Status timeline
                  </p>
                  <ol className="mt-2 space-y-2">
                    {statusFlow.map((s, i) => {
                      const activeIdx = statusFlow.indexOf(
                        active.status === "cancelled" ? "pending" : active.status,
                      );
                      const reached = i <= activeIdx && active.status !== "cancelled";
                      return (
                        <li key={s} className="flex items-center gap-2 text-xs">
                          <span
                            className={cn(
                              "size-2.5 shrink-0 rounded-full",
                              reached ? "bg-primary" : "bg-muted",
                            )}
                          />
                          <span className={reached ? "font-semibold" : "text-muted-foreground"}>
                            {statusLabel[s]}
                          </span>
                        </li>
                      );
                    })}
                    {active.status === "cancelled" && (
                      <li className="flex items-center gap-2 text-xs text-destructive">
                        <span className="size-2.5 shrink-0 rounded-full bg-destructive" />
                        <span className="font-semibold">Cancelled</span>
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!receipt} onOpenChange={(v) => !v && setReceipt(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-sm">
          {receipt && (
            <>
              <SheetHeader>
                <SheetTitle>Receipt — {receipt.id}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 font-mono text-xs">
                <div className="text-center">
                  <p className="font-display text-sm font-bold">PINDI CRUST</p>
                  <p className="text-muted-foreground">{receipt.placedAt}</p>
                </div>
                <div className="border-t border-dashed border-border pt-2">
                  <p>{receipt.customer}</p>
                  <p className="text-muted-foreground">{receipt.phone}</p>
                  {receipt.address && <p className="text-muted-foreground">{receipt.address}</p>}
                </div>
                <ul className="space-y-1 border-t border-dashed border-border pt-2">
                  {receipt.items.map((i) => (
                    <li key={i.name} className="flex justify-between gap-2">
                      <span className="min-w-0 truncate">
                        {i.qty}× {i.name}
                      </span>
                      <span className="shrink-0">{formatPKR(i.price * i.qty)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between border-t border-dashed border-border pt-2 text-sm font-bold">
                  <span>Total</span>
                  <span>{formatPKR(receipt.total)}</span>
                </div>
                <p className="pt-2 text-center text-muted-foreground">Thank you!</p>
              </div>
              <Button className="mt-4 w-full" size="sm" onClick={() => window.print()}>
                <Printer className="mr-1 size-3.5" />
                Print
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminPage>
  );
}

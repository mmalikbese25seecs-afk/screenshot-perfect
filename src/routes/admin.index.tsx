import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BackendNotice } from "@/components/shared/BackendNotice";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Activity,
  BadgePercent,
  ClipboardList,
  DollarSign,
  LayoutGrid,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import { AdminPage, StatCard } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchOrdersSince,
  fetchPaymentSplit,
  fetchRevenueTrend,
  fetchTopProducts,
  subscribeToOrders,
} from "@/lib/api";
import { formatPKR } from "@/lib/format";
import type { Order } from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Live revenue, orders, best sellers and payment mix for PINDI CRUST.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Dashboard — PINDI CRUST Admin" },
      {
        property: "og:description",
        content: "Live operational overview for the PINDI CRUST team.",
      },
    ],
  }),
  component: DashboardPage,
});

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--color-chart-1)" },
  orders: { label: "Orders", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

const statusTone: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  preparing: "bg-primary-soft text-primary",
  baking: "bg-primary-soft text-primary",
  out_for_delivery: "bg-chart-2/15 text-chart-2",
  delivered: "bg-success/12 text-success",
  cancelled: "bg-destructive/12 text-destructive",
};

const quickActions = [
  { to: "/admin/pos", label: "New POS Sale", icon: ShoppingCart },
  { to: "/admin/orders", label: "View Orders", icon: ClipboardList },
  { to: "/admin/menu", label: "Manage Menu", icon: UtensilsCrossed },
  { to: "/admin/promotions", label: "Promotions", icon: BadgePercent },
];

const activeStatuses = ["pending", "preparing", "baking", "out_for_delivery"];

function startOfDay(offsetDays: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

function summarise(orders: Order[]) {
  const counted = orders.filter((o) => o.status !== "cancelled");
  const revenue = counted.reduce((sum, o) => sum + o.total, 0);
  return {
    revenue,
    orders: counted.length,
    avg: counted.length ? Math.round(revenue / counted.length) : 0,
  };
}

/** "+18% vs yesterday", or a plain fallback when yesterday has nothing to compare to. */
function deltaText(today: number, yesterday: number) {
  if (yesterday <= 0) return today > 0 ? "First sales in 2 days" : "No sales yet";
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return pct === 0 ? "Same as yesterday" : `${pct > 0 ? "+" : ""}${pct}% vs yesterday`;
}

function DashboardPage() {
  const queryClient = useQueryClient();
  const yesterdayIso = useMemo(() => startOfDay(-1).toISOString(), []);

  // Today + yesterday's orders drive the stat cards and the live list.
  const { data: recent = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", "dashboard", yesterdayIso],
    queryFn: () => fetchOrdersSince(yesterdayIso),
  });
  const { data: revenueSeries = [], isLoading: trendLoading } = useQuery({
    queryKey: ["dashboard-trend"],
    queryFn: () => fetchRevenueTrend(7),
  });
  const { data: rawSplit = [] } = useQuery({
    queryKey: ["dashboard-split"],
    queryFn: () => fetchPaymentSplit(7),
  });
  const { data: bestSellers = [] } = useQuery({
    queryKey: ["dashboard-best"],
    queryFn: () => fetchTopProducts(7, "best", 4),
  });

  // New orders show up here the moment they're placed.
  useEffect(() => {
    return subscribeToOrders(() => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-trend"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-split"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-best"] });
    });
  }, [queryClient]);

  const todayStart = startOfDay(0).getTime();
  const today = summarise(recent.filter((o) => new Date(o.placedAtIso).getTime() >= todayStart));
  const yesterday = summarise(recent.filter((o) => new Date(o.placedAtIso).getTime() < todayStart));
  const activeOrders = recent.filter((o) => activeStatuses.includes(o.status)).length;

  const splitTotal = rawSplit.reduce((sum, p) => sum + p.value, 0);
  const paymentSplit = rawSplit.map((p, i) => ({
    name: p.name,
    value: splitTotal > 0 ? Math.round((p.value / splitTotal) * 100) : 0,
    fill: `var(--color-chart-${(i % 3) + 1})`,
  }));

  const stat = (v: string) => (ordersLoading ? "…" : v);

  return (
    <AdminPage title="Dashboard" subtitle="Today's snapshot across all PINDI CRUST channels.">
      <BackendNotice
        when="unconfigured"
        compact
        className="mb-4"
        title="No live data"
        description="Figures below stay empty until the backend is connected. Zeros here are not real results."
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue Today"
          value={stat(formatPKR(today.revenue))}
          delta={deltaText(today.revenue, yesterday.revenue)}
          icon={<DollarSign className="size-4.5" />}
          tone="primary"
        />
        <StatCard
          label="Orders"
          value={stat(String(today.orders))}
          delta={deltaText(today.orders, yesterday.orders)}
          icon={<ShoppingBag className="size-4.5" />}
          tone="success"
        />
        <StatCard
          label="Avg. Order Value"
          value={stat(formatPKR(today.avg))}
          delta={yesterday.avg > 0 ? `Yesterday ${formatPKR(yesterday.avg)}` : "Today so far"}
          icon={<TrendingUp className="size-4.5" />}
        />
        <StatCard
          label="Active Orders"
          value={stat(String(activeOrders))}
          delta="Live"
          icon={<Activity className="size-4.5" />}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft lg:col-span-2 sm:p-5">
          <h2 className="font-display text-lg font-bold">Revenue trend</h2>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
          {trendLoading ? (
            <Skeleton className="mt-4 h-56 w-full" />
          ) : revenueSeries.length === 0 ? (
            <p className="mt-4 grid h-56 place-items-center text-sm text-muted-foreground">
              No orders in the last 7 days yet.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="mt-4 aspect-auto h-56 w-full">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="url(#revFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <h2 className="font-display text-lg font-bold">Payment split</h2>
          <p className="text-xs text-muted-foreground">This week</p>
          {paymentSplit.length === 0 && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No payments recorded yet.
            </p>
          )}
          <ChartContainer config={chartConfig} className="mx-auto mt-2 aspect-square h-52 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={paymentSplit}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={78}
                strokeWidth={4}
              >
                {paymentSplit.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-2 space-y-1.5">
            {paymentSplit.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: p.fill }}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.name}</span>
                <span className="shrink-0 font-semibold">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <h2 className="font-display text-lg font-bold">Orders by day</h2>
          <ChartContainer config={chartConfig} className="mt-4 aspect-auto h-48 w-full">
            <BarChart data={revenueSeries}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="orders" fill="var(--color-orders)" radius={6} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <h2 className="font-display text-lg font-bold">Live orders</h2>
          <ul className="mt-3 space-y-2.5">
            {recent.length === 0 && (
              <li className="text-sm text-muted-foreground">No orders in the last 2 days.</li>
            )}
            {recent.slice(0, 5).map((o) => (
              <li key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {o.id} · {o.customer}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {o.placedAt} · {formatPKR(o.total)}
                  </p>
                </div>
                <Badge className={`shrink-0 ${statusTone[o.status]}`} variant="outline">
                  {o.status.replace(/_/g, " ")}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <h2 className="font-display text-lg font-bold">Best sellers</h2>
          <ul className="mt-3 space-y-3">
            {bestSellers.length === 0 && (
              <li className="text-sm text-muted-foreground">No sales this week yet.</li>
            )}
            {bestSellers.map((b) => (
              <li key={b.name}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate font-semibold">{b.name}</span>
                  <span className="shrink-0 text-muted-foreground">{b.sold} sold</span>
                </div>
                <Progress value={(b.sold / (bestSellers[0]?.sold ?? 1)) * 100} className="h-1.5" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="font-display mb-3 text-lg font-bold">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((a, i) => (
            <motion.div
              key={a.to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={a.to}
                className="glass flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border p-4 text-center shadow-soft transition-shadow hover:shadow-lift"
              >
                <span className="bg-primary-soft grid size-10 place-items-center rounded-xl text-primary">
                  <a.icon className="size-5" />
                </span>
                <span className="text-xs font-bold">{a.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminPage>
  );
}

import { BackendNotice } from "@/components/shared/BackendNotice";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
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
import { AdminPage } from "@/components/admin/AdminShell";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DbRow } from "@/lib/supabaseClient";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  daysForRange,
  fetchRevenueTrend,
  fetchCategorySales,
  fetchPeakHours,
  fetchCustomerGrowth,
  fetchPaymentSplit,
  fetchTopProducts,
  fetchPromoCodes,
} from "@/lib/api";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Revenue, orders, category mix, peak hours and customer growth analytics.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Analytics — PINDI CRUST Admin" },
      { property: "og:description", content: "Deep performance analytics for PINDI CRUST." },
    ],
  }),
  component: AnalyticsPage,
});

const ranges = ["Today", "7 Days", "30 Days", "90 Days"];

const chartConfig = {
  revenue: { label: "Revenue", color: "var(--color-chart-1)" },
  orders: { label: "Orders", color: "var(--color-chart-2)" },
  newCustomers: { label: "New", color: "var(--color-chart-1)" },
  returning: { label: "Returning", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

const pieFills = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function AnalyticsPage() {
  const [range, setRange] = useState("7 Days");
  const days = daysForRange(range);

  const results = useQueries({
    queries: [
      { queryKey: ["an-revenue", days], queryFn: () => fetchRevenueTrend(days) },
      { queryKey: ["an-category", days], queryFn: () => fetchCategorySales(days) },
      { queryKey: ["an-peak", days], queryFn: () => fetchPeakHours(days) },
      { queryKey: ["an-growth"], queryFn: () => fetchCustomerGrowth() },
      { queryKey: ["an-payment", days], queryFn: () => fetchPaymentSplit(days) },
      { queryKey: ["an-best", days], queryFn: () => fetchTopProducts(days, "best") },
      { queryKey: ["an-slow", days], queryFn: () => fetchTopProducts(days, "slow") },
      { queryKey: ["an-promos"], queryFn: () => fetchPromoCodes() },
    ],
  });

  const [revenueQ, categoryQ, peakQ, growthQ, paymentQ, bestQ, slowQ, promosQ] = results;
  const loading = results.some((r) => r.isLoading);

  const revenueSeries = revenueQ.data ?? [];
  const categorySales = (categoryQ.data ?? []).map((c, i) => ({
    ...c,
    fill: pieFills[i % pieFills.length],
  }));
  const peakHours = peakQ.data ?? [];
  const growthSeries = growthQ.data ?? [];
  const paymentSplit = (paymentQ.data ?? []).map((p, i) => ({
    ...p,
    fill: pieFills[i % pieFills.length],
  }));
  const bestSellers = bestQ.data ?? [];
  const slowSellers = slowQ.data ?? [];
  const promoCodes = promosQ.data ?? [];

  const totalRevenue = revenueSeries.reduce((s, r) => s + r.revenue, 0);
  const half = Math.floor(revenueSeries.length / 2) || 1;
  const firstHalf = revenueSeries.slice(0, half).reduce((s, r) => s + r.revenue, 0);
  const secondHalf = revenueSeries.slice(half).reduce((s, r) => s + r.revenue, 0);
  const trendPct = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;
  const topHour = peakHours.length ? [...peakHours].sort((a, b) => b.orders - a.orders)[0] : null;

  return (
    <AdminPage
      title="Analytics"
      subtitle="Deep-dive into sales, customers and product performance."
      action={
        <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                range === r
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <BackendNotice
        when="unconfigured"
        compact
        className="mb-4"
        title="No live data"
        description="Figures below stay empty until the backend is connected. Zeros here are not real results."
      />
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-soft p-4">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary">Insight for {range}</p>
              <p className="text-sm text-foreground/80 text-pretty">
                {totalRevenue > 0 ? (
                  <>
                    Revenue is {trendPct >= 0 ? "up" : "down"} {Math.abs(trendPct)}% comparing the
                    first vs second half of this period.
                    {topHour ? ` Peak demand is around ${topHour.hour}.` : ""}
                  </>
                ) : (
                  "Not enough order data yet in this range to generate an insight."
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Revenue trend" subtitle={`Last ${range.toLowerCase()}`}>
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="anRevFill" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#anRevFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartCard>

            <ChartCard title="Orders volume" subtitle="Daily order count">
              <BarChart data={revenueSeries}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-orders)" radius={6} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Sales by category" subtitle="Items sold in range">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={categorySales}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={76}
                  strokeWidth={4}
                >
                  {categorySales.map((c) => (
                    <Cell key={c.name} fill={c.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartCard>

            <ChartCard title="Peak order hours" subtitle="Orders per hour bracket">
              <BarChart data={peakHours}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-chart-4)" radius={6} />
              </BarChart>
            </ChartCard>

            <ChartCard title="Customer growth" subtitle="New vs returning customers (6 months)">
              <AreaChart data={growthSeries}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="returning"
                  stackId="1"
                  stroke="var(--color-returning)"
                  fill="var(--color-returning)"
                  fillOpacity={0.35}
                />
                <Area
                  type="monotone"
                  dataKey="newCustomers"
                  stackId="1"
                  stroke="var(--color-newCustomers)"
                  fill="var(--color-newCustomers)"
                  fillOpacity={0.5}
                />
              </AreaChart>
            </ChartCard>

            <ChartCard title="Payment methods" subtitle="Share of settled orders">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={paymentSplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={76}
                  strokeWidth={4}
                >
                  {paymentSplit.map((p) => (
                    <Cell key={p.name} fill={p.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
              <h2 className="font-display text-lg font-bold">Coupon usage</h2>
              {promoCodes.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No promo codes yet.</p>
              ) : (
                <ul className="mt-3 space-y-2.5 overflow-x-auto">
                  {promoCodes.map((p: DbRow) => (
                    <li
                      key={p.code}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm"
                    >
                      <span className="min-w-0 truncate font-semibold">{p.code}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {p.usageCount}/{p.usageLimit ?? "∞"} uses
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
              <h2 className="font-display text-lg font-bold">Best vs slow sellers</h2>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-success">
                    <TrendingUp className="size-3.5" /> Best
                  </p>
                  <ul className="space-y-2">
                    {bestSellers.length === 0 && (
                      <li className="text-xs text-muted-foreground">No data</li>
                    )}
                    {bestSellers.map((b) => (
                      <li key={b.name} className="min-w-0 truncate text-xs">
                        {b.name} <span className="text-muted-foreground">· {b.sold}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-destructive">
                    <TrendingDown className="size-3.5" /> Slow
                  </p>
                  <ul className="space-y-2">
                    {slowSellers.length === 0 && (
                      <li className="text-xs text-muted-foreground">No data</li>
                    )}
                    {slowSellers.map((b) => (
                      <li key={b.name} className="min-w-0 truncate text-xs">
                        {b.name} <span className="text-muted-foreground">· {b.sold}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminPage>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactElement;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <ChartContainer config={chartConfig} className="mt-4 aspect-auto h-56 w-full">
        {children}
      </ChartContainer>
    </div>
  );
}

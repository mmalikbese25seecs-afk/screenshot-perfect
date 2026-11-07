import { BackendNotice } from "@/components/shared/BackendNotice";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  ClipboardList,
  Percent,
  Receipt,
  ShoppingBag,
  Users,
} from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DbRow } from "@/lib/supabaseClient";
import { useAuth } from "@/store/auth";
import {
  daysForReportRange,
  errorMessage,
  fetchReportHistory,
  createReportRow,
  markReportReady,
  fetchReportOrders,
  fetchReportItems,
  fetchReportPayments,
  fetchReportTaxes,
  fetchRevenueTrend,
  fetchCustomers,
} from "@/lib/api";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — PINDI CRUST Admin" },
      {
        name: "description",
        content:
          "Generate sales, orders, items, customer, payment and tax reports for PINDI CRUST.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Reports — PINDI CRUST Admin" },
      {
        property: "og:description",
        content: "Exportable business reports for the PINDI CRUST team.",
      },
    ],
  }),
  component: ReportsPage,
});

const reportTypes = [
  { id: "sales", label: "Sales", icon: Receipt },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "items", label: "Items", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "taxes", label: "Taxes", icon: Percent },
] as const;

const formats = [
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "csv", label: "CSV", icon: FileSpreadsheet },
  { id: "xlsx", label: "XLSX", icon: FileSpreadsheet },
] as const;

const ranges = ["7 Days", "30 Days", "This Quarter", "Custom"];

type ReportType = (typeof reportTypes)[number]["id"];
type ReportFormat = (typeof formats)[number]["id"];

function toCsv(headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function openPrintablePdf(title: string, headers: string[], rows: (string | number)[][]) {
  const w = window.open("", "_blank");
  if (!w) return;
  const tableRows = rows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td style="padding:6px 10px;border-bottom:1px solid #ddd">${c}</td>`).join("")}</tr>`,
    )
    .join("");
  w.document.write(`
    <html><head><title>${title}</title></head>
    <body style="font-family:sans-serif;padding:24px">
      <h2>${title}</h2>
      <table style="border-collapse:collapse;width:100%">
        <thead><tr>${headers.map((h) => `<th style="text-align:left;padding:6px 10px;border-bottom:2px solid #333">${h}</th>`).join("")}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <script>window.print()</script>
    </body></html>
  `);
  w.document.close();
}

async function buildReportData(
  type: ReportType,
  days: number,
): Promise<{ headers: string[]; rows: (string | number)[][] }> {
  switch (type) {
    case "sales": {
      const rows = await fetchRevenueTrend(days);
      return {
        headers: ["Day", "Revenue", "Orders"],
        rows: rows.map((r) => [r.day, r.revenue, r.orders]),
      };
    }
    case "orders": {
      const rows = await fetchReportOrders(days);
      return {
        headers: ["Order ID", "Date", "Status", "Total", "Payment"],
        rows: rows.map((r: DbRow) => [
          r.order_id,
          new Date(r.created_at).toLocaleString(),
          r.status,
          r.total,
          r.payment_method,
        ]),
      };
    }
    case "items": {
      const rows = await fetchReportItems(days);
      return {
        headers: ["Product", "Qty Sold", "Revenue"],
        rows: rows.map((r: DbRow) => [r.product_name, r.quantity_sold, r.revenue]),
      };
    }
    case "customers": {
      const rows = await fetchCustomers();
      return {
        headers: ["Name", "Email", "Orders", "Spend", "Tier"],
        rows: rows.map((r: DbRow) => [r.name, r.email, r.orders, r.spent, r.tier]),
      };
    }
    case "payments": {
      const rows = await fetchReportPayments(days);
      return {
        headers: ["Method", "Orders", "Total"],
        rows: rows.map((r: DbRow) => [r.payment_method, r.orders, r.total]),
      };
    }
    case "taxes": {
      const rows = await fetchReportTaxes(days);
      return {
        headers: ["Day", "Tax Collected", "Taxable Revenue"],
        rows: rows.map((r: DbRow) => [r.day, r.tax_collected, r.taxable_revenue]),
      };
    }
  }
}

function ReportsPage() {
  const [type, setType] = useState<ReportType>("sales");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [range, setRange] = useState<string>(ranges[0] ?? "7 Days");
  const [customFrom, setCustomFrom] = useState("");
  const todayIso = new Date().toISOString().slice(0, 10);

  /** Resolves the selected range to a day window ending today, or null if Custom is incomplete. */
  const resolveRange = (): { days: number; label: string } | null => {
    if (range !== "Custom") return { days: daysForReportRange(range), label: range };
    if (!customFrom || customFrom > todayIso) return null;
    const days = Math.max(
      1,
      Math.ceil((Date.now() - new Date(`${customFrom}T00:00:00`).getTime()) / 86_400_000),
    );
    return { days, label: `${customFrom} → today` };
  };
  const queryClient = useQueryClient();
  const { name, email } = useAuth();

  const { data: reports = [] } = useQuery({
    queryKey: ["reports-history"],
    queryFn: fetchReportHistory,
  });

  const generate = async () => {
    const resolved = resolveRange();
    if (!resolved) {
      toast.error("Pick a start date on or before today for a custom range");
      return;
    }
    const { days, label: rangeLabel } = resolved;
    const id = `RPT-${Math.floor(1000 + Math.random() * 9000)}`;
    const label = reportTypes.find((r) => r.id === type)?.label ?? "Sales";

    try {
      await createReportRow({
        id,
        type: label,
        format: format.toUpperCase(),
        range: rangeLabel,
        created_by_name: name ?? email ?? "Staff",
      });
      queryClient.invalidateQueries({ queryKey: ["reports-history"] });
      toast.success(`Generating ${type} report (${format.toUpperCase()})…`);

      const { headers, rows } = await buildReportData(type, days);
      const title = `${label} Report — ${rangeLabel}`;

      if (format === "csv") {
        downloadBlob(toCsv(headers, rows), `${id}.csv`, "text/csv;charset=utf-8;");
      } else if (format === "xlsx") {
        // Tab-separated .xls: opens correctly in Excel/Sheets without a spreadsheet library
        const tsv = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
        downloadBlob(tsv, `${id}.xls`, "application/vnd.ms-excel");
      } else {
        openPrintablePdf(title, headers, rows);
      }

      await markReportReady(id);
      queryClient.invalidateQueries({ queryKey: ["reports-history"] });
      toast.success(`${id} is ready`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not generate report"));
    }
  };

  const redownload = async (r: (typeof reports)[number]) => {
    const reportType = reportTypes.find((t) => t.label === r.type)?.id ?? "sales";
    const custom = /^(\d{4}-\d{2}-\d{2}) →/.exec(r.range);
    const days = custom
      ? Math.max(
          1,
          Math.ceil((Date.now() - new Date(`${custom[1]}T00:00:00`).getTime()) / 86_400_000),
        )
      : daysForReportRange(r.range);
    try {
      const { headers, rows } = await buildReportData(reportType, days);
      if (r.format === "CSV")
        downloadBlob(toCsv(headers, rows), `${r.id}.csv`, "text/csv;charset=utf-8;");
      else if (r.format === "XLSX") {
        const tsv = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
        downloadBlob(tsv, `${r.id}.xls`, "application/vnd.ms-excel");
      } else openPrintablePdf(`${r.type} Report — ${r.range}`, headers, rows);
      toast.success(`Downloading ${r.id}`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not rebuild report data"));
    }
  };

  return (
    <AdminPage title="Reports" subtitle="Generate and export business reports on demand.">
      <BackendNotice
        when="unconfigured"
        compact
        className="mb-4"
        title="No live data"
        description="Figures below stay empty until the backend is connected. Zeros here are not real results."
      />
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <h2 className="font-display text-lg font-bold">Report type</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {reportTypes.map((r) => (
            <button
              key={r.id}
              onClick={() => setType(r.id)}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                type === r.id
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <r.icon className="size-5" />
              <span className="truncate text-xs font-bold">{r.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Range</span>
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                range === r
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {r}
            </button>
          ))}
          {range === "Custom" && (
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              From
              <input
                type="date"
                max={todayIso}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                aria-label="Custom range start date"
                className="rounded-lg border border-border bg-card px-2 py-1 text-foreground"
              />
              <span>to today</span>
            </label>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase">Format</span>
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                format === f.id
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <f.icon className="size-3.5" />
              {f.label}
            </button>
          ))}
        </div>

        <Button variant="hero" className="mt-4 w-full sm:w-auto" onClick={generate}>
          Generate report
        </Button>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <h2 className="font-display text-lg font-bold">Generated reports</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs font-bold text-muted-foreground uppercase">
                <th className="pb-2 pr-3">Report</th>
                <th className="pb-2 pr-3">Range</th>
                <th className="pb-2 pr-3">Format</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Created</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-muted-foreground">
                    No reports generated yet.
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-2.5 pr-3 font-semibold">
                    {r.id} · {r.type}
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{r.range}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{r.format}</td>
                  <td className="py-2.5 pr-3">
                    <Badge
                      variant={r.status === "ready" ? "secondary" : "outline"}
                      className={r.status === "ready" ? "text-success" : "text-warning"}
                    >
                      {r.status === "ready" ? "Ready" : "Processing"}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={r.status !== "ready"}
                      onClick={() => redownload(r)}
                    >
                      <Download className="size-3.5" /> Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DailyFigures range={range} />
    </AdminPage>
  );
}

function DailyFigures({ range }: { range: string }) {
  const days = daysForReportRange(range);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["reports-daily-figures", days],
    queryFn: () => fetchRevenueTrend(days),
  });

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <h2 className="font-display text-lg font-bold">Daily figures</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="text-xs font-bold text-muted-foreground uppercase">
              <th className="pb-2 pr-3">Day</th>
              <th className="pb-2 pr-3">Revenue</th>
              <th className="pb-2">Orders</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {rows.map((d) => (
              <tr key={d.day} className="border-t border-border">
                <td className="py-2.5 pr-3 font-semibold">{d.day}</td>
                <td className="py-2.5 pr-3">PKR {d.revenue.toLocaleString()}</td>
                <td className="py-2.5">{d.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

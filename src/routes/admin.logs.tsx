import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import { AdminPage } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/Primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchActivityLogs, logActivity, type ActivityLog } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({
    meta: [
      { title: "Activity Logs — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Audit trail of every staff action across the PINDI CRUST console.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Activity Logs — PINDI CRUST Admin" },
      { property: "og:description", content: "Full audit trail of staff activity." },
    ],
  }),
  component: LogsPage,
});

const levelTone: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  warning: "bg-warning/15 text-warning",
  critical: "bg-destructive/12 text-destructive",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toCsv(rows: ActivityLog[]) {
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Time", "Actor", "Action", "Module", "Target", "Level"];
  const body = rows.map((l) =>
    [new Date(l.created_at).toISOString(), l.actor_name, l.action, l.module, l.target, l.level]
      .map(esc)
      .join(","),
  );
  return [header.join(","), ...body].join("\n");
}

function LogsPage() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");

  const {
    data: logs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: () => fetchActivityLogs(200),
    refetchInterval: 30_000,
  });

  const filtered = useMemo(
    () =>
      logs.filter(
        (l) =>
          (level === "all" || l.level === level) &&
          `${l.actor_name}${l.action}${l.target}${l.module}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [logs, q, level],
  );

  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
    try {
      await logActivity(`Exported ${filtered.length} activity log rows`, "", "logs", "info");
    } catch {
      /* export already succeeded; logging is best-effort */
    }
  };

  return (
    <AdminPage
      title="Activity Logs"
      subtitle="Every privileged action is recorded with actor, target and timestamp."
      action={
        <Button variant="outline" className="gap-1.5" onClick={handleExport}>
          <Download className="size-4" /> Export CSV
        </Button>
      }
    >
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search actor, action or module"
            aria-label="Search activity logs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger aria-label="Filter by severity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ul className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="h-[72px] animate-pulse rounded-2xl border border-border bg-muted/40"
            />
          ))}
        </ul>
      ) : isError ? (
        <div className="mt-6">
          <QueryErrorState error={error} label="activity" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Activity className="size-7" />}
            title="No matching activity"
            description="Try a different search term or clear the severity filter."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((l) => (
            <li
              key={l.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <span
                className={cn(
                  "mt-0.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                  levelTone[l.level],
                )}
              >
                {l.level}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-pretty">{l.action}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {l.actor_name} · {l.module}
                  {l.target ? ` · ${l.target.slice(0, 8)}` : ""} · {formatTime(l.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}

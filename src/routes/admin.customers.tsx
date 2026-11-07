import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, MessageCircle, Search, ShieldOff, Users } from "lucide-react";
import { AdminPage, StatCard } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import {
  type AdminCustomer,
  errorMessage,
  fetchCustomerOrders,
  fetchCustomers,
  saveCustomerNote,
  sendCustomerMessage,
  setCustomerBlocked,
} from "@/lib/api";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import { formatPKR } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({
    meta: [
      { title: "Customers — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Browse PINDI CRUST customers, tiers, spend and order history.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Customers — PINDI CRUST Admin" },
      {
        property: "og:description",
        content: "Browse PINDI CRUST customers, tiers, spend and order history.",
      },
    ],
  }),
  component: CustomersPage,
});

const tierTone: Record<string, string> = {
  Platinum: "bg-primary text-primary-foreground",
  Gold: "bg-warning/20 text-warning",
  Silver: "bg-muted text-foreground",
  Bronze: "bg-primary-soft text-primary",
};

function CustomersPage() {
  const { role } = useAuth();
  const isManager = role === "manager";
  const [query, setQuery] = useState("");
  const [active, setActiveState] = useState<AdminCustomer | null>(null);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  // Reset drafts when switching customers so one customer's note never leaks into another's.
  const setActive = (c: AdminCustomer | null) => {
    setActiveState(c);
    setNotes("");
    setMessage("");
  };

  const {
    data: customersList = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: fetchCustomers,
  });
  const { data: activeOrders = [] } = useQuery({
    queryKey: ["admin-customer-orders", active?.id],
    queryFn: () => fetchCustomerOrders(active!.id),
    enabled: !!active,
  });

  const filtered = useMemo(
    () =>
      customersList.filter(
        (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.includes(query),
      ),
    [customersList, query],
  );

  const totalSpend = customersList.reduce((s, c) => s + c.spent, 0);
  const avgSpend = customersList.length ? totalSpend / customersList.length : 0;
  const now = new Date();
  const newThisMonth = customersList.filter((c) => {
    const d = new Date(c.joined);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const returningRate = customersList.length
    ? Math.round((customersList.filter((c) => c.orders > 1).length / customersList.length) * 100)
    : 0;

  return (
    <AdminPage
      title="Customers"
      subtitle="Understand and support the people who keep PINDI CRUST busy."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Customers"
          value={String(customersList.length)}
          icon={<Users className="size-4.5" />}
          tone="primary"
        />
        <StatCard
          label="New This Month"
          value={String(newThisMonth)}
          icon={<Users className="size-4.5" />}
          tone="success"
        />
        <StatCard
          label="Returning Rate"
          value={`${returningRate}%`}
          icon={<Users className="size-4.5" />}
        />
        <StatCard
          label="Avg. Spend"
          value={formatPKR(Math.round(avgSpend))}
          icon={<Users className="size-4.5" />}
          tone="warning"
        />
      </div>

      {isError && (
        <QueryErrorState
          className="mt-4"
          error={error}
          label="customers"
          onRetry={() => refetch()}
        />
      )}
      {!isLoading && !isError && customersList.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No customers yet.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers by name or email…"
          aria-label="Search customers"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading customers…</p>}

      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-soft lg:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-bold text-muted-foreground uppercase">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Spent</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                onClick={() => setActive(c)}
              >
                <td className="px-4 py-3">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                </td>
                <td className="px-4 py-3">{c.orders}</td>
                <td className="px-4 py-3 font-semibold">{formatPKR(c.spent)}</td>
                <td className="px-4 py-3">
                  <Badge className={cn("border-0", tierTone[c.tier])}>{c.tier}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.joined}</td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Message ${c.name}`}
                      onClick={() => setActive(c)}
                    >
                      <MessageCircle className="size-4" />
                    </Button>
                    <BlockButton isManager={isManager} id={c.id} name={c.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c)}
            className="min-w-0 rounded-2xl border border-border bg-card p-3 text-left shadow-soft"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold">{c.name}</p>
              <Badge className={cn("border-0 shrink-0", tierTone[c.tier])}>{c.tier}</Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">{c.email}</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span>{c.orders} orders</span>
              <span className="font-semibold text-primary">{formatPKR(c.spent)}</span>
            </div>
          </button>
        ))}
      </div>

      <Sheet open={!!active} onOpenChange={(v) => !v && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>{active.name}</SheetTitle>
                <SheetDescription>
                  {active.email} · {active.phone}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-5 px-4 pb-6">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-border p-3">
                    <p className="font-display text-lg font-bold">{active.orders}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Orders</p>
                  </div>
                  <div className="rounded-xl border border-border p-3">
                    <p className="font-display text-lg font-bold">{formatPKR(active.spent)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Spent</p>
                  </div>
                  <div className="rounded-xl border border-border p-3">
                    <Badge className={cn("border-0", tierTone[active.tier])}>{active.tier}</Badge>
                    <p className="mt-1 text-[10px] text-muted-foreground uppercase">Tier</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Order history</h3>
                  <div className="mt-2 space-y-2">
                    {activeOrders.length === 0 && (
                      <p className="text-xs text-muted-foreground">No orders yet.</p>
                    )}
                    {activeOrders.map((o) => (
                      <div
                        key={o.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-xl border border-border/70 p-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{o.id}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {o.items.map((i) => i.name).join(", ")}
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold">{formatPKR(o.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Internal notes</h3>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add an internal note about this customer"
                    className="mt-2"
                    rows={3}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    disabled={!notes.trim()}
                    onClick={() =>
                      runAction(() => saveCustomerNote(active.id, notes.trim()), "Note saved")
                    }
                  >
                    Save note
                  </Button>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Message customer</h3>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Write a message to ${active.name}`}
                    className="mt-2"
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    disabled={message.trim().length < 2}
                    onClick={() =>
                      runAction(
                        () => sendCustomerMessage(active.id, message.trim()),
                        `Message sent to ${active.name}`,
                        () => setMessage(""),
                      )
                    }
                  >
                    <MessageCircle className="size-4" /> Send message
                  </Button>
                  <BlockButton isManager={isManager} id={active.id} name={active.name} full />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminPage>
  );
}

/** Runs a backend action and only reports success if it really happened. */
async function runAction(fn: () => Promise<void>, success: string, after?: () => void) {
  try {
    await fn();
    toast.success(success);
    after?.();
  } catch (err) {
    toast.error(errorMessage(err));
  }
}

function BlockButton({
  isManager,
  id,
  name,
  full,
}: {
  isManager: boolean;
  id: string;
  name: string;
  full?: boolean;
}) {
  if (isManager) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="outline"
              size={full ? "default" : "icon"}
              disabled
              className={cn(full && "gap-1.5")}
            >
              <Lock className="size-4" /> {full && "Block customer"}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Managers cannot block customer accounts</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Button
      variant="outline"
      size={full ? "default" : "icon"}
      className={cn("text-destructive hover:text-destructive", full && "gap-1.5")}
      aria-label={`Block ${name}`}
      onClick={() => {
        if (!window.confirm(`Block ${name}? They won't be able to place orders.`)) return;
        void runAction(() => setCustomerBlocked(id, true), `${name} has been blocked`);
      }}
    >
      <ShieldOff className="size-4" /> {full && "Block customer"}
    </Button>
  );
}

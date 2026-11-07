import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bell, BellRing, CheckCheck, Gift, Megaphone, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/shared/Primitives";
import { type Notification, fetchNotifications, markAllNotificationsRead } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shop/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — PINDI CRUST" },
      {
        name: "description",
        content: "Stay up to date with order status, exclusive offers and news from PINDI CRUST.",
      },
      { property: "og:title", content: "Notifications — PINDI CRUST" },
      { property: "og:description", content: "Your latest PINDI CRUST alerts and updates." },
    ],
  }),
  component: NotificationsPage,
});

const iconMap = { order: Truck, promo: Gift, review: Star, news: Megaphone };

function NotificationsPage() {
  const { role, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const signedIn = role !== "guest";

  useEffect(() => {
    if (authLoading) return;
    if (!signedIn) {
      setLoading(false);
      return;
    }
    fetchNotifications()
      .then(setItems)
      .catch(() => toast.error("Couldn't load your notifications"))
      .finally(() => setLoading(false));
  }, [authLoading, signedIn]);

  const today = items.filter(
    (n) => n.time.toLowerCase().includes("min") || n.time.toLowerCase().includes("hr"),
  );
  const earlier = items.filter((n) => !today.includes(n));

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await markAllNotificationsRead();
    } catch {
      toast.error("Couldn't sync read status — try again");
    }
  };

  const groups = [
    { label: "Today", items: today },
    { label: "Earlier", items: earlier },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        title="Notifications"
        subtitle="Order updates, offers and news, all in one place."
        action={
          items.some((n) => n.unread) && (
            <Button size="sm" variant="soft" onClick={markAllRead}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          )
        }
      />

      {!authLoading && !signedIn ? (
        <div className="mt-10">
          <EmptyState
            icon={<Bell className="size-7" />}
            title="Sign in for notifications"
            description="Create an account or sign in to get order updates, offers and news."
          />
        </div>
      ) : loading ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<Bell className="size-7" />}
            title="You're all caught up"
            description="New notifications will appear here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              <div className="space-y-3">
                {group.items.map((n, i) => {
                  const Icon = iconMap[n.type] ?? BellRing;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft",
                        n.unread && "border-primary/30",
                      )}
                    >
                      <span className="bg-primary-soft grid size-10 shrink-0 place-items-center rounded-xl text-primary">
                        <Icon className="size-5" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold">{n.title}</p>
                          {n.unread && (
                            <span
                              className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                              aria-label="Unread"
                            />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { errorMessage, saveMaintenanceSettings } from "@/lib/api";
import { DraftNotice } from "@/components/shared/BackendNotice";
import { AlertTriangle, Clock, Power, Save, Wrench } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useThemeStore } from "@/store/theme";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/admin/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance Mode — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Temporarily pause online ordering and show a maintenance notice to customers.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Maintenance Mode — PINDI CRUST Admin" },
      { property: "og:description", content: "Pause ordering and display a customer notice." },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const maintenance = useThemeStore((s) => s.maintenanceMode);
  const setMaintenance = useThemeStore((s) => s.setMaintenanceMode);
  const isManager = useAuth((s) => s.role) === "manager";
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [pauseOrders, setPauseOrders] = useState(true);
  const [pausePos, setPausePos] = useState(false);
  const [eta, setEta] = useState("");

  const save = async () => {
    if (maintenance && message.trim().length < 10) {
      toast.error("Write a customer notice of at least 10 characters");
      return;
    }
    setSaving(true);
    try {
      await saveMaintenanceSettings({
        enabled: maintenance,
        message: message.trim(),
        eta: eta.trim(),
      });
      toast.success("Maintenance settings saved");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage
      title="Maintenance Mode"
      subtitle="Pause the storefront gracefully without taking the site down."
      action={
        <Button variant="hero" className="gap-1.5" disabled={isManager || saving} onClick={save}>
          <Save className="size-4" /> Save
        </Button>
      }
    >
      <DraftNotice />
      <section
        className={`rounded-2xl border p-5 shadow-soft ${maintenance ? "border-destructive/40 bg-destructive/10" : "border-success/30 bg-success/10"}`}
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-foreground shadow-soft">
            <Power className={`size-5 ${maintenance ? "text-destructive" : "text-success"}`} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display truncate text-lg font-bold">
              {maintenance ? "Maintenance mode: ON (draft)" : "Maintenance mode: OFF (draft)"}
            </h2>
            <p className="text-xs text-muted-foreground text-pretty">
              {maintenance
                ? "Once saved, customers see the maintenance notice instead of the ordering flow."
                : "Once saved, customers can browse, order and track normally."}
            </p>
          </div>
          <Switch
            checked={maintenance}
            disabled={isManager}
            aria-label="Toggle maintenance mode"
            onCheckedChange={setMaintenance}
          />
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary-soft grid size-9 place-items-center rounded-xl text-primary">
              <Wrench className="size-4.5" />
            </span>
            <h2 className="font-display text-base font-bold">Scope</h2>
          </div>
          <div className="mt-4 space-y-2">
            {(
              [
                ["Pause online ordering", pauseOrders, setPauseOrders],
                ["Pause in-store POS", pausePos, setPausePos],
              ] as const
            ).map(([label, value, set]) => (
              <div
                key={label}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <p className="min-w-0 truncate text-sm font-semibold">{label}</p>
                <Switch
                  checked={value}
                  onCheckedChange={set}
                  disabled={isManager}
                  aria-label={label}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="eta" className="flex items-center gap-1.5">
              <Clock className="size-3.5" /> Expected return time
            </Label>
            <Input
              id="eta"
              placeholder="e.g. 11:00 AM"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              disabled={isManager}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary-soft grid size-9 place-items-center rounded-xl text-primary">
              <AlertTriangle className="size-4.5" />
            </span>
            <h2 className="font-display text-base font-bold">Customer notice</h2>
          </div>
          <Textarea
            className="mt-4"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isManager}
            placeholder="e.g. We're briefly offline — online ordering returns shortly."
            aria-label="Maintenance notice message"
          />
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-5 text-center">
            <Badge variant="secondary" className="mb-3">
              Preview
            </Badge>
            <p className="font-display text-lg font-bold">We'll be right back</p>
            <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
              {message || "Your notice will appear here."}
            </p>
            {eta && <p className="mt-3 text-xs font-semibold text-primary">Back at {eta}</p>}
          </div>
        </section>
      </div>

      {isManager && (
        <p className="mt-4 rounded-xl bg-warning/10 px-4 py-3 text-xs font-semibold text-warning">
          Manager access — maintenance mode is a protected setting and can only be changed by an
          administrator.
        </p>
      )}
    </AdminPage>
  );
}

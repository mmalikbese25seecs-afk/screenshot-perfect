import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bike, Clock, MapPin, Save, Store as StoreIcon } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { stores } from "@/lib/store-config";
import { useBrandStore } from "@/store/brand";
import { errorMessage, saveStoreSettings } from "@/lib/api";
import { DraftNotice } from "@/components/shared/BackendNotice";

export const Route = createFileRoute("/admin/store")({
  head: () => ({
    meta: [
      { title: "Store Settings — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Branch hours, delivery radius, charges and fulfilment options for PINDI CRUST.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Store Settings — PINDI CRUST Admin" },
      { property: "og:description", content: "Configure branches, hours and delivery rules." },
    ],
  }),
  component: StorePage,
});

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function StorePage() {
  const brand = useBrandStore();
  const [radius, setRadius] = useState<number[]>([brand.deliveryRadiusKm || 1]);
  const [radiusSet, setRadiusSet] = useState(brand.deliveryRadiusKm > 0);
  const [fee, setFee] = useState("");
  const [freeAbove, setFreeAbove] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [delivery, setDelivery] = useState(true);
  const [pickup, setPickup] = useState(true);
  const [dineIn, setDineIn] = useState(false);
  const [openDays, setOpenDays] = useState<string[]>(days);

  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const save = async () => {
    for (const [label, v] of [
      ["Delivery fee", fee],
      ["Free-delivery threshold", freeAbove],
      ["Prep time", prepTime],
    ] as const) {
      const n = num(v);
      if (n !== null && (Number.isNaN(n) || n < 0)) {
        toast.error(`${label} must be 0 or more`);
        return;
      }
    }
    if ((opensAt && !closesAt) || (!opensAt && closesAt)) {
      toast.error("Set both opening and closing time");
      return;
    }
    setSaving(true);
    try {
      await saveStoreSettings({
        storeName: brand.brandName,
        phone: brand.contactPhone,
        whatsapp: "",
        email: brand.contactEmail,
        address: brand.contactAddress,
        hours: opensAt && closesAt ? `${opensAt}–${closesAt}` : "",
        deliveryFee: num(fee),
        taxRate: null,
        minOrder: null,
        deliveryRadiusKm: radiusSet ? (radius[0] ?? null) : null,
        acceptingOrders: delivery || pickup || dineIn,
      });
      toast.success("Store settings saved");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage
      title="Store Settings"
      subtitle="Fulfilment, hours, delivery radius and branch configuration."
      action={
        <Button variant="hero" className="gap-1.5" disabled={saving} onClick={save}>
          <Save className="size-4" /> Save changes
        </Button>
      }
    >
      <DraftNotice />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary-soft grid size-9 place-items-center rounded-xl text-primary">
              <StoreIcon className="size-4.5" />
            </span>
            <h2 className="font-display text-base font-bold">Fulfilment options</h2>
          </div>
          <div className="mt-4 space-y-2">
            {(
              [
                ["Delivery", delivery, setDelivery],
                ["Pickup", pickup, setPickup],
                ["Dine-in", dineIn, setDineIn],
              ] as const
            ).map(([label, value, set]) => (
              <div
                key={label}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <p className="min-w-0 truncate text-sm font-semibold">{label}</p>
                <Switch checked={value} onCheckedChange={set} aria-label={`Toggle ${label}`} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary-soft grid size-9 place-items-center rounded-xl text-primary">
              <Bike className="size-4.5" />
            </span>
            <h2 className="font-display text-base font-bold">Delivery rules</h2>
          </div>
          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <Label>Delivery radius</Label>
                <Badge variant="secondary">{radiusSet ? `${radius[0]} km` : "Not set"}</Badge>
              </div>
              <Slider
                className="mt-3"
                value={radius}
                onValueChange={(v) => {
                  setRadius(v);
                  setRadiusSet(true);
                }}
                min={1}
                max={30}
                step={1}
                aria-label="Delivery radius in kilometres"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="fee">Delivery fee (Rs)</Label>
                <Input
                  id="fee"
                  type="number"
                  min={0}
                  placeholder="Not set"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="free">Free above (Rs)</Label>
                <Input
                  id="free"
                  type="number"
                  min={0}
                  placeholder="Not set"
                  value={freeAbove}
                  onChange={(e) => setFreeAbove(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prep">Prep time (min)</Label>
                <Input
                  id="prep"
                  type="number"
                  min={0}
                  placeholder="Not set"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary-soft grid size-9 place-items-center rounded-xl text-primary">
              <Clock className="size-4.5" />
            </span>
            <h2 className="font-display text-base font-bold">Business hours</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="opens">Opens at</Label>
              <Input
                id="opens"
                type="time"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closes">Closes at</Label>
              <Input
                id="closes"
                type="time"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {days.map((d) => {
              const open = openDays.includes(d);
              return (
                <div
                  key={d}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d}</p>
                    <p className="text-xs text-muted-foreground">
                      {open
                        ? opensAt && closesAt
                          ? `${opensAt} – ${closesAt}`
                          : "Open · hours not set"
                        : "Closed"}
                    </p>
                  </div>
                  <Switch
                    checked={open}
                    aria-label={`Toggle ${d}`}
                    onCheckedChange={(v) =>
                      setOpenDays((p) => (v ? [...p, d] : p.filter((x) => x !== d)))
                    }
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary-soft grid size-9 place-items-center rounded-xl text-primary">
              <MapPin className="size-4.5" />
            </span>
            <h2 className="font-display text-base font-bold">Branches</h2>
          </div>
          <ul className="mt-4 space-y-2">
            {stores.length === 0 && (
              <li className="rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
                No branches yet. Branch management arrives with the backend.
              </li>
            )}
            {stores.map((s) => (
              <li key={s.id} className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.address}</p>
                <p className="mt-1 text-xs font-semibold text-primary">{s.hours}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="maps">Google Maps URL</Label>
            <Input
              id="maps"
              value={brand.mapsUrl}
              onChange={(e) => brand.setField("mapsUrl", e.target.value)}
            />
          </div>
        </section>
      </div>
    </AdminPage>
  );
}

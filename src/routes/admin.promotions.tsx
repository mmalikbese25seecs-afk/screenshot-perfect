import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgePercent, Clock, Edit, Plus, Tag, Trash2 } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PromoCode,
  PromoCodeInput,
  createPromoCode,
  deletePromoCode,
  fetchPromoCodes,
  updatePromoCode,
} from "@/lib/api";
import { useThemeStore } from "@/store/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/promotions")({
  head: () => ({
    meta: [
      { title: "Promotions — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Manage promo codes, happy hour and limited offers for PINDI CRUST.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Promotions — PINDI CRUST Admin" },
      {
        property: "og:description",
        content: "Manage promo codes, happy hour and limited offers for PINDI CRUST.",
      },
    ],
  }),
  component: PromotionsPage,
});

type EditState = Partial<PromoCode> & { id?: string; discountType: "percent" | "flat" };

function statusOf(p: PromoCode): "Active" | "Inactive" | "Expired" {
  if (p.expiresAt && new Date(p.expiresAt) < new Date()) return "Expired";
  return p.active ? "Active" : "Inactive";
}

const statusTone: Record<string, string> = {
  Active: "bg-success/15 text-success",
  Inactive: "bg-muted text-muted-foreground",
  Expired: "bg-muted text-muted-foreground",
};

function PromotionsPage() {
  const promotionsEnabled = useThemeStore((s) => s.promotionsEnabled);
  const setPromotionsEnabled = useThemeStore((s) => s.setPromotionsEnabled);
  const queryClient = useQueryClient();

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: fetchPromoCodes,
  });

  const [editing, setEditing] = useState<EditState | null>(null);
  const [open, setOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-promos"] });

  const createMutation = useMutation({
    mutationFn: createPromoCode,
    onSuccess: () => {
      toast.success("Promo code created");
      invalidate();
      setOpen(false);
    },
    onError: () => toast.error("Couldn't create promo code"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PromoCodeInput }) =>
      updatePromoCode(id, input),
    onSuccess: () => {
      toast.success("Promo code updated");
      invalidate();
      setOpen(false);
    },
    onError: () => toast.error("Couldn't update promo code"),
  });
  const deleteMutation = useMutation({
    mutationFn: deletePromoCode,
    onSuccess: () => {
      toast.success("Promo code removed");
      invalidate();
    },
    onError: () => toast.error("Couldn't remove promo code"),
  });

  function openAdd() {
    setEditing({
      code: "",
      discountType: "percent",
      discountValue: 10,
      usageLimit: 100,
      expiresAt: null,
      active: true,
    });
    setIsNew(true);
    setOpen(true);
  }
  function openEdit(p: PromoCode) {
    setEditing({ ...p });
    setIsNew(false);
    setOpen(true);
  }
  function save() {
    if (!editing?.code) {
      toast.error("Promo code is required");
      return;
    }
    const input: PromoCodeInput = {
      code: editing.code.toUpperCase(),
      discountType: editing.discountType,
      discountValue: editing.discountValue ?? 0,
      usageLimit: editing.usageLimit ?? null,
      expiresAt: editing.expiresAt ?? null,
      active: editing.active ?? true,
    };
    if (isNew) createMutation.mutate(input);
    else updateMutation.mutate({ id: editing.id!, input });
  }

  return (
    <AdminPage
      title="Promotions"
      subtitle="Run promo codes, happy hour discounts and limited-time offers."
      action={
        <Button variant="hero" className="gap-1.5" onClick={openAdd}>
          <Plus className="size-4" /> New promo
        </Button>
      }
    >
      <div className="rounded-2xl border border-primary/30 bg-primary-soft p-4 shadow-soft sm:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-display text-lg font-bold text-primary">
              <BadgePercent className="size-5 shrink-0" /> Master promotions toggle
            </p>
            <p className="mt-1 text-sm text-pretty text-foreground/80">
              Turning this off completely hides the promo-code section from customer checkout
              storewide — existing codes stay saved but cannot be applied until re-enabled.
            </p>
          </div>
          <Switch
            checked={promotionsEnabled}
            onCheckedChange={setPromotionsEnabled}
            aria-label="Toggle promotions storewide"
          />
        </div>
      </div>

      {/* Static/informational — not wired to a table yet */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="flex items-center gap-2 font-bold">
            <Clock className="size-4 text-primary" /> Happy Hour Window
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily 10:00 PM – 1:00 AM · 30% off pizzas
          </p>
          <Badge className="mt-2 border-0 bg-warning/15 text-warning">Scheduled</Badge>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="flex items-center gap-2 font-bold">
            <Tag className="size-4 text-primary" /> Limited Offers
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            2 active limited-time bundle offers running
          </p>
          <Badge className="mt-2 border-0 bg-success/15 text-success">Active</Badge>
        </div>
      </div>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading promo codes…</p>}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-bold text-muted-foreground uppercase">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-mono font-semibold">{p.code}</td>
                <td className="px-4 py-3">
                  {p.discountType === "percent" ? "Percentage" : "Fixed"}
                </td>
                <td className="px-4 py-3">
                  {p.discountType === "percent" ? `${p.discountValue}%` : `Rs ${p.discountValue}`}
                </td>
                <td className="px-4 py-3">
                  {p.usageCount}
                  {p.usageLimit != null ? `/${p.usageLimit}` : ""}
                </td>
                <td className="px-4 py-3">
                  <Badge className={cn("border-0", statusTone[statusOf(p)])}>{statusOf(p)}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${p.code}`}
                      onClick={() => openEdit(p)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      aria-label={`Delete ${p.code}`}
                      onClick={() => deleteMutation.mutate(p.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isNew ? "New promo code" : "Edit promo code"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="promo-code">Code</Label>
                <Input
                  id="promo-code"
                  className="mt-1.5 font-mono"
                  value={editing.code ?? ""}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label htmlFor="promo-type">Type</Label>
                <Select
                  value={editing.discountType}
                  onValueChange={(v) =>
                    setEditing({ ...editing, discountType: v as "percent" | "flat" })
                  }
                >
                  <SelectTrigger id="promo-type" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="flat">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="promo-value">
                  Value {editing.discountType === "percent" ? "(%)" : "(Rs)"}
                </Label>
                <Input
                  id="promo-value"
                  type="number"
                  className="mt-1.5"
                  value={editing.discountValue ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, discountValue: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="promo-limit">Usage limit</Label>
                <Input
                  id="promo-limit"
                  type="number"
                  className="mt-1.5"
                  value={editing.usageLimit ?? 0}
                  onChange={(e) => setEditing({ ...editing, usageLimit: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="promo-expiry">Expiry date</Label>
                <Input
                  id="promo-expiry"
                  type="date"
                  className="mt-1.5"
                  value={editing.expiresAt ? editing.expiresAt.slice(0, 10) : ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={editing.active ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                  id="promo-active"
                />
                <Label htmlFor="promo-active">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={save}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

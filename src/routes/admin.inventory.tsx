import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Package, Pencil, Plus, Search } from "lucide-react";
import { AdminPage, StatCard } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import {
  type InventoryItem,
  type InventoryItemInput,
  type InventoryUnit,
  errorMessage,
  fetchInventory,
  isLowStock,
  saveInventoryItem,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Track ingredient stock levels and low-stock items for PINDI CRUST.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Inventory — PINDI CRUST Admin" },
      { property: "og:description", content: "Ingredient stock, units and low-stock alerts." },
    ],
  }),
  component: InventoryPage,
});

const units: { value: InventoryUnit; label: string }[] = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "l", label: "Litres (l)" },
  { value: "ml", label: "Millilitres (ml)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "pack", label: "Packs" },
];

type Draft = {
  id: string | null;
  name: string;
  group: string;
  unit: InventoryUnit;
  quantity: string;
  threshold: string;
};
const emptyDraft: Draft = {
  id: null,
  name: "",
  group: "",
  unit: "kg",
  quantity: "",
  threshold: "",
};

function validate(d: Draft): string | null {
  if (d.name.trim().length < 2) return "Enter an item name";
  if (d.group.trim().length < 2) return "Enter a group, e.g. Dairy or Packaging";
  const q = Number(d.quantity);
  const t = Number(d.threshold);
  if (d.quantity.trim() === "" || Number.isNaN(q) || q < 0) return "Quantity must be 0 or more";
  if (d.threshold.trim() === "" || Number.isNaN(t) || t < 0)
    return "Low-stock level must be 0 or more";
  return null;
}

function InventoryPage() {
  const queryClient = useQueryClient();
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
  });
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => [...new Set(items.map((i) => i.group))].sort(), [items]);
  const lowCount = items.filter(isLowStock).length;
  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) &&
      (group === "all" || i.group === group) &&
      (!lowOnly || isLowStock(i)),
  );

  const openEdit = (i: InventoryItem) =>
    setDraft({
      id: i.id,
      name: i.name,
      group: i.group,
      unit: i.unit,
      quantity: String(i.quantity),
      threshold: String(i.lowStockThreshold),
    });

  const save = async () => {
    if (!draft) return;
    const problem = validate(draft);
    if (problem) {
      toast.error(problem);
      return;
    }
    const input: InventoryItemInput = {
      name: draft.name.trim(),
      group: draft.group.trim(),
      unit: draft.unit,
      quantity: Number(draft.quantity),
      lowStockThreshold: Number(draft.threshold),
    };
    setSaving(true);
    try {
      await saveInventoryItem(draft.id, input);
      toast.success(draft.id ? "Item updated" : "Item added");
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage
      title="Inventory"
      subtitle="Ingredient and packaging stock, with low-stock flags."
      action={
        <Button variant="hero" className="gap-1.5" onClick={() => setDraft(emptyDraft)}>
          <Plus className="size-4" /> Add item
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Tracked items"
          value={String(items.length)}
          icon={<Package className="size-4.5" />}
          tone="primary"
        />
        <StatCard
          label="Low stock"
          value={String(lowCount)}
          icon={<AlertTriangle className="size-4.5" />}
          tone="warning"
        />
        <StatCard
          label="Groups"
          value={String(groups.length)}
          icon={<Package className="size-4.5" />}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items"
            aria-label="Search inventory"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="sm:w-48" aria-label="Filter by group">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant={lowOnly ? "hero" : "outline"} onClick={() => setLowOnly((v) => !v)}>
          <AlertTriangle className="size-4" /> Low stock only
        </Button>
      </div>

      <div className="mt-4">
        {isError && (
          <QueryErrorState error={error} label="inventory items" onRetry={() => refetch()} />
        )}
        {isLoading && <Skeleton className="h-40 w-full rounded-2xl" />}
        {!isLoading && !isError && filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {items.length === 0
              ? "No inventory items yet. Add your first ingredient."
              : "No items match these filters."}
          </p>
        )}
        {filtered.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-bold text-muted-foreground uppercase">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">In stock</th>
                  <th className="px-4 py-3">Low at</th>
                  <th className="px-4 py-3 text-right">Edit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const low = isLowStock(i);
                  return (
                    <tr key={i.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-semibold">{i.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{i.group}</td>
                      <td className="px-4 py-3">
                        <span className={cn("font-semibold", low && "text-destructive")}>
                          {i.quantity} {i.unit}
                        </span>
                        {low && (
                          <Badge className="ml-2 border-0 bg-destructive/12 text-destructive">
                            Low
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {i.lowStockThreshold} {i.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${i.name}`}
                          onClick={() => openEdit(i)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Stock is adjusted manually for now. Automatic deduction when orders are placed is not
        planned until the recipe-to-ingredient rules are confirmed.
      </p>

      <Dialog open={!!draft} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit item" : "Add inventory item"}</DialogTitle>
            <DialogDescription>Quantities use the unit you choose.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="inv-name">Name</Label>
                <Input
                  id="inv-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Mozzarella"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-group">Group</Label>
                  <Input
                    id="inv-group"
                    value={draft.group}
                    onChange={(e) => setDraft({ ...draft, group: e.target.value })}
                    placeholder="e.g. Dairy"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Select
                    value={draft.unit}
                    onValueChange={(v) => setDraft({ ...draft, unit: v as InventoryUnit })}
                  >
                    <SelectTrigger aria-label="Unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-qty">Quantity in stock</Label>
                  <Input
                    id="inv-qty"
                    type="number"
                    min={0}
                    step="any"
                    value={draft.quantity}
                    onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-low">Low-stock level</Label>
                  <Input
                    id="inv-low"
                    type="number"
                    min={0}
                    step="any"
                    value={draft.threshold}
                    onChange={(e) => setDraft({ ...draft, threshold: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="hero" disabled={saving} onClick={save}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

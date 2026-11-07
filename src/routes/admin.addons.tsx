import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import { Edit, Plus, Trash2 } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createAddOn,
  deleteAddOn,
  errorMessage,
  fetchAllAddOns,
  setAddOnActive,
  setAddOnPrice,
  updateAddOn,
} from "@/lib/api";
import { formatPKR } from "@/lib/format";
import type { AddOn } from "@/lib/types";

export const Route = createFileRoute("/admin/addons")({
  head: () => ({
    meta: [
      { title: "Add-ons — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Manage add-on groups, pricing and availability for PINDI CRUST orders.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Add-ons — PINDI CRUST Admin" },
      {
        property: "og:description",
        content: "Manage add-on groups, pricing and availability for PINDI CRUST orders.",
      },
    ],
  }),
  component: AddOnsPage,
});

type Draft = { id: string | null; name: string; price: number; group: string; active: boolean };

function AddOnsPage() {
  const queryClient = useQueryClient();
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-add-ons"],
    queryFn: fetchAllAddOns,
  });
  const [editing, setEditing] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const [groupDialog, setGroupDialog] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  // Price boxes are typed into locally and saved when you leave the field.
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-add-ons"] });
    queryClient.invalidateQueries({ queryKey: ["add_ons"] });
  };
  const onError = (err: unknown) =>
    toast.error(errorMessage(err, "That didn't work. Please try again."));

  const saveMutation = useMutation({
    mutationFn: (d: Draft) => {
      const input = { name: d.name, price: d.price, group: d.group, active: d.active };
      return d.id ? updateAddOn(d.id, input) : createAddOn(input);
    },
    onSuccess: (_, d) => {
      toast.success(d.id ? "Add-on updated" : "Add-on created");
      setOpen(false);
      refresh();
    },
    onError,
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteAddOn(id),
    onSuccess: () => {
      toast.success("Add-on removed");
      refresh();
    },
    onError,
  });
  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setAddOnActive(id, active),
    onSuccess: refresh,
    onError,
  });
  const priceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) => setAddOnPrice(id, price),
    onSuccess: refresh,
    onError,
  });

  const groups = useMemo(() => Array.from(new Set(items.map((i) => i.group))), [items]);
  const grouped = useMemo(
    () => groups.map((g) => ({ group: g, addOns: items.filter((i) => i.group === g) })),
    [groups, items],
  );

  function openAdd(group?: string) {
    setEditing({
      id: null,
      name: "",
      price: 0,
      group: group ?? groups[0] ?? "General",
      active: true,
    });
    setOpen(true);
  }

  function openEdit(item: AddOn) {
    setEditing({
      id: item.id,
      name: item.name,
      price: item.price,
      group: item.group,
      active: item.active,
    });
    setOpen(true);
  }

  function save() {
    if (!editing || !editing.name.trim()) {
      toast.error("Add-on name is required");
      return;
    }
    if (!Number.isFinite(editing.price) || editing.price < 0) {
      toast.error("Enter a valid price");
      return;
    }
    saveMutation.mutate(editing);
  }

  function commitPrice(item: AddOn) {
    const raw = priceDrafts[item.id];
    if (raw === undefined) return;
    const price = Number(raw);
    setPriceDrafts(({ [item.id]: _drop, ...rest }) => rest);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }
    if (price !== item.price) priceMutation.mutate({ id: item.id, price });
  }

  function addGroup() {
    if (!newGroup.trim()) return;
    openAdd(newGroup.trim());
    setNewGroup("");
    setGroupDialog(false);
  }

  return (
    <AdminPage
      title="Add-ons"
      subtitle="Group, price and toggle every extra customers can add to their order."
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGroupDialog(true)}>
            New group
          </Button>
          <Button variant="hero" className="gap-1.5" onClick={() => openAdd()}>
            <Plus className="size-4" /> Add-on
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        {isError && (
          <QueryErrorState className="" error={error} label="add-ons" onRetry={() => refetch()} />
        )}
        {!isLoading && !isError && items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No add-ons yet. Create a group and add your first extra.
          </p>
        )}
        {grouped.map(({ group, addOns }) => (
          <div key={group} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display truncate text-lg font-bold">{group}</h2>
              <Badge variant="secondary">{addOns.length} items</Badge>
            </div>
            <div className="space-y-2">
              {addOns.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/70 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.name}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Rs</span>
                      <Input
                        type="number"
                        min={0}
                        value={priceDrafts[item.id] ?? item.price}
                        onChange={(e) =>
                          setPriceDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                        }
                        onBlur={() => commitPrice(item)}
                        className="h-8 w-24"
                        aria-label={`Price for ${item.name}`}
                      />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Switch
                      checked={item.active}
                      onCheckedChange={(v) => activeMutation.mutate({ id: item.id, active: v })}
                      aria-label={`Toggle active for ${item.name}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${item.name}`}
                      onClick={() => openEdit(item)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${item.name}`}
                      className="text-destructive"
                      onClick={() => removeMutation.mutate(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => openAdd(group)}
              >
                <Plus className="size-3.5" /> Add to {group}
              </Button>
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          {formatPKR(items.reduce((s, i) => s + i.price, 0))} combined value across {items.length}{" "}
          add-ons.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit add-on" : "Add add-on"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div>
                <Label htmlFor="addon-name">Name</Label>
                <Input
                  id="addon-name"
                  className="mt-1.5"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="addon-price">Price (PKR)</Label>
                <Input
                  id="addon-price"
                  type="number"
                  className="mt-1.5"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="addon-group">Group</Label>
                <Input
                  id="addon-group"
                  className="mt-1.5"
                  value={editing.group}
                  onChange={(e) => setEditing({ ...editing, group: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={save} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupDialog} onOpenChange={setGroupDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New group</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="new-group">Group name</Label>
            <Input
              id="new-group"
              className="mt-1.5"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="e.g. Sauces"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialog(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={addGroup}>
              Create & add item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import { Edit, ImageOff, Lock, Plus, Search, Trash2 } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createProduct,
  deleteProducts,
  errorMessage,
  fetchAllCategories,
  fetchAllProducts,
  setProductsAvailable,
  updateProduct,
} from "@/lib/api";
import { formatPKR } from "@/lib/format";
import type { Badge as ProductBadge, Product } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/menu")({
  head: () => ({
    meta: [
      { title: "Menu Management — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Manage the PINDI CRUST menu: items, prices, badges and availability.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Menu Management — PINDI CRUST Admin" },
      {
        property: "og:description",
        content: "Manage the PINDI CRUST menu: items, prices, badges and availability.",
      },
    ],
  }),
  component: MenuPage,
});

const ALL_BADGES: ProductBadge[] = ["bestseller", "new", "spicy", "vegetarian", "premium"];

type Draft = {
  id: string | null;
  name: string;
  categoryId: string;
  price: string;
  oldPrice: string;
  image: string;
  short: string;
  description: string;
  ingredients: string;
  badges: ProductBadge[];
  available: boolean;
};

const emptyDraft: Draft = {
  id: null,
  name: "",
  categoryId: "",
  price: "",
  oldPrice: "",
  image: "",
  short: "",
  description: "",
  ingredients: "",
  badges: [],
  available: true,
};

function toDraft(p: Product): Draft {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    price: String(p.price),
    oldPrice: p.oldPrice ? String(p.oldPrice) : "",
    image: p.image,
    short: p.short,
    description: p.description,
    ingredients: p.ingredients.join(", "),
    badges: p.badges,
    available: p.available,
  };
}

function MenuPage() {
  const { role } = useAuth();
  const isManager = role === "manager";
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-products"],
    queryFn: fetchAllProducts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: fetchAllCategories,
  });
  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  };
  const onError = (err: unknown) =>
    toast.error(errorMessage(err, "That didn't work. Please try again."));

  const saveMutation = useMutation({
    mutationFn: (d: Draft) => {
      const input = {
        name: d.name,
        categoryId: d.categoryId,
        price: Number(d.price),
        oldPrice: d.oldPrice ? Number(d.oldPrice) : null,
        image: d.image,
        short: d.short,
        description: d.description,
        ingredients: d.ingredients
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
        badges: d.badges,
        available: d.available,
      };
      return d.id ? updateProduct(d.id, input) : createProduct(input);
    },
    onSuccess: (_, d) => {
      toast.success(d.id ? "Item updated" : "Item added to menu");
      setDialogOpen(false);
      refresh();
    },
    onError,
  });

  const availabilityMutation = useMutation({
    mutationFn: ({ ids, available }: { ids: string[]; available: boolean }) =>
      setProductsAvailable(ids, available),
    onSuccess: (_, { ids, available }) => {
      toast.success(
        ids.length > 1
          ? `${ids.length} item(s) updated`
          : available
            ? "Item marked available"
            : "Item marked unavailable",
      );
      setSelected([]);
      refresh();
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteProducts(ids),
    onSuccess: (_, ids) => {
      toast.success(ids.length > 1 ? `${ids.length} item(s) deleted` : "Item deleted");
      setSelected((prev) => prev.filter((x) => !ids.includes(x)));
      refresh();
    },
    onError,
  });

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
        return matchesQuery && matchesCategory;
      }),
    [items, query, categoryFilter],
  );

  function openEdit(item: Product) {
    setEditing(toDraft(item));
    setDialogOpen(true);
  }

  function openAdd() {
    setEditing({ ...emptyDraft, categoryId: categories[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function saveItem() {
    if (!editing) return;
    const price = Number(editing.price);
    const oldPrice = editing.oldPrice ? Number(editing.oldPrice) : 0;
    if (!editing.name.trim()) return void toast.error("Item name is required");
    if (!editing.categoryId) return void toast.error("Choose a category");
    if (!Number.isFinite(price) || price <= 0)
      return void toast.error("Enter a price greater than zero");
    if (!Number.isFinite(oldPrice) || oldPrice < 0)
      return void toast.error("Old price must be a valid number");
    if (editing.image.trim() && !/^https?:\/\//i.test(editing.image.trim())) {
      return void toast.error("Image URL must start with https://");
    }
    saveMutation.mutate(editing);
  }

  const toggleAvailable = (id: string, val: boolean) =>
    availabilityMutation.mutate({ ids: [id], available: val });
  const deleteItem = (id: string) => deleteMutation.mutate([id]);
  const bulkDelete = () => deleteMutation.mutate(selected);
  const bulkToggle = (val: boolean) =>
    availabilityMutation.mutate({ ids: selected, available: val });

  return (
    <AdminPage
      title="Menu Management"
      subtitle="Add, edit and control availability of every item on the PINDI CRUST menu."
      action={
        <Button variant="hero" onClick={openAdd} className="gap-1.5">
          <Plus className="size-4" /> Add item
        </Button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu items…"
            aria-label="Search menu items"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3">
          <p className="text-sm font-semibold text-primary">{selected.length} selected</p>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkToggle(true)}>
              Mark available
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkToggle(false)}>
              Mark unavailable
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isManager}
                    onClick={bulkDelete}
                    className="gap-1.5"
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </span>
              </TooltipTrigger>
              {isManager && <TooltipContent>Managers cannot delete items</TooltipContent>}
            </Tooltip>
          </div>
        </div>
      )}

      {isLoading && <Skeleton className="mt-4 h-64 w-full rounded-2xl" />}
      {isError && (
        <QueryErrorState
          className="mt-4"
          error={error}
          label="menu items"
          onRetry={() => refetch()}
        />
      )}
      {!isLoading && !isError && filtered.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {items.length === 0
            ? "No menu items yet. Add your first item."
            : "No items match your search."}
        </p>
      )}

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-soft lg:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-bold text-muted-foreground uppercase">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  aria-label="Select all"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onCheckedChange={(v) => setSelected(v ? filtered.map((f) => f.id) : [])}
                />
              </th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Badges</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 align-top">
                  <Checkbox
                    aria-label={`Select ${item.name}`}
                    checked={selected.includes(item.id)}
                    onCheckedChange={(v) =>
                      setSelected((prev) =>
                        v ? [...prev, item.id] : prev.filter((x) => x !== item.id),
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-11 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <ImageOff className="size-4" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.short}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{categoryName.get(item.categoryId) ?? "—"}</td>
                <td className="px-4 py-3 font-semibold">{formatPKR(item.price)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.badges.map((b) => (
                      <Badge key={b} variant="secondary" className="text-[10px] capitalize">
                        {b}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={item.available}
                    onCheckedChange={(v) => toggleAvailable(item.id, v)}
                    aria-label={`Toggle availability for ${item.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${item.name}`}
                      onClick={() => openEdit(item)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <DeleteButton
                      isManager={isManager}
                      onConfirm={() => deleteItem(item.id)}
                      name={item.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="size-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <ImageOff className="size-5" />
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-semibold">{item.name}</p>
                  <Checkbox
                    aria-label={`Select ${item.name}`}
                    checked={selected.includes(item.id)}
                    onCheckedChange={(v) =>
                      setSelected((prev) =>
                        v ? [...prev, item.id] : prev.filter((x) => x !== item.id),
                      )
                    }
                  />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {categoryName.get(item.categoryId) ?? "—"}
                </p>
                <p className="mt-1 font-semibold text-primary">{formatPKR(item.price)}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {item.badges.map((b) => (
                    <Badge key={b} variant="secondary" className="text-[10px] capitalize">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.available}
                  onCheckedChange={(v) => toggleAvailable(item.id, v)}
                  aria-label={`Toggle availability for ${item.name}`}
                />
                <span className="text-xs font-semibold text-muted-foreground">
                  {item.available ? "Available" : "Unavailable"}
                </span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${item.name}`}
                  onClick={() => openEdit(item)}
                >
                  <Edit className="size-4" />
                </Button>
                <DeleteButton
                  isManager={isManager}
                  onConfirm={() => deleteItem(item.id)}
                  name={item.name}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit menu item" : "Add menu item"}</DialogTitle>
            <DialogDescription>
              Changes go live on the storefront as soon as you save.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="item-category">Category</Label>
                <Select
                  value={editing.categoryId}
                  onValueChange={(v) => setEditing({ ...editing, categoryId: v })}
                >
                  <SelectTrigger id="item-category" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="item-price">Price (PKR)</Label>
                <Input
                  id="item-price"
                  type="number"
                  min={0}
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="item-old-price">Old price (optional, for discounts)</Label>
                <Input
                  id="item-old-price"
                  type="number"
                  min={0}
                  value={editing.oldPrice}
                  onChange={(e) => setEditing({ ...editing, oldPrice: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="item-image">Image URL</Label>
                <Input
                  id="item-image"
                  value={editing.image}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  placeholder="https://…"
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="item-short">Short description</Label>
                <Input
                  id="item-short"
                  maxLength={120}
                  value={editing.short}
                  onChange={(e) => setEditing({ ...editing, short: e.target.value })}
                  placeholder="One line shown on the menu card"
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="item-desc">Description</Label>
                <Textarea
                  id="item-desc"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="item-ingredients">Ingredients (comma separated)</Label>
                <Input
                  id="item-ingredients"
                  value={editing.ingredients}
                  onChange={(e) => setEditing({ ...editing, ingredients: e.target.value })}
                  placeholder="00 Flour, Fior di Latte, Basil"
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Badges</Label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {ALL_BADGES.map((b) => (
                    <label key={b} className="flex items-center gap-1.5 text-sm capitalize">
                      <Checkbox
                        checked={editing.badges.includes(b)}
                        onCheckedChange={(v) =>
                          setEditing({
                            ...editing,
                            badges: v
                              ? [...editing.badges, b]
                              : editing.badges.filter((x) => x !== b),
                          })
                        }
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={saveItem} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : editing?.id ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function DeleteButton({
  isManager,
  onConfirm,
  name,
}: {
  isManager: boolean;
  onConfirm: () => void;
  name: string;
}) {
  if (isManager) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button size="icon" variant="ghost" disabled aria-label={`Delete ${name} (locked)`}>
              <Lock className="size-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Managers cannot delete menu items</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Delete ${name}`}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the item from the live menu immediately. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn("bg-destructive text-destructive-foreground")}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

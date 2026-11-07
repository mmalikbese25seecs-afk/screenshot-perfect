import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import { Edit, GripVertical, Lock, Plus, Trash2 } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  createCategory,
  deleteCategory,
  errorMessage,
  fetchAllCategories,
  reorderCategories,
  setCategoryVisible,
  updateCategory,
} from "@/lib/api";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "Categories — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Organise menu categories, visibility and ordering for PINDI CRUST.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Categories — PINDI CRUST Admin" },
      {
        property: "og:description",
        content: "Organise menu categories, visibility and ordering for PINDI CRUST.",
      },
    ],
  }),
  component: CategoriesPage,
});

type Draft = { id: string | null; name: string; slug: string; image: string; visible: boolean };

const emptyDraft: Draft = { id: null, name: "", slug: "", image: "", visible: true };

function CategoriesPage() {
  const { role } = useAuth();
  const isManager = role === "manager";
  const queryClient = useQueryClient();
  const {
    data: cats = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: fetchAllCategories,
  });
  const [editing, setEditing] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);

  // Refresh the admin list and the storefront's copy after every change.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };
  const onError = (err: unknown) =>
    toast.error(errorMessage(err, "That didn't work. Please try again."));

  const saveMutation = useMutation({
    mutationFn: (d: Draft) => {
      const input = {
        name: d.name,
        slug: slugify(d.slug || d.name),
        image: d.image,
        visible: d.visible,
      };
      return d.id ? updateCategory(d.id, input) : createCategory(input);
    },
    onSuccess: (_, d) => {
      toast.success(d.id ? "Category updated" : "Category created");
      setOpen(false);
      refresh();
    },
    onError,
  });

  const visibleMutation = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      setCategoryVisible(id, visible),
    onSuccess: refresh,
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      refresh();
    },
    onError,
  });

  const moveMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderCategories(orderedIds),
    onSuccess: refresh,
    onError,
  });

  function move(id: string, dir: "up" | "down") {
    const ids = cats.map((c) => c.id);
    const i = ids.indexOf(id);
    const swap = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || swap < 0 || swap >= ids.length) return;
    [ids[i], ids[swap]] = [ids[swap]!, ids[i]!];
    moveMutation.mutate(ids);
  }

  function openEdit(c: Category) {
    setEditing({ id: c.id, name: c.name, slug: c.slug, image: c.image, visible: c.visible });
    setOpen(true);
  }

  function openAdd() {
    setEditing({ ...emptyDraft });
    setOpen(true);
  }

  function save() {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    saveMutation.mutate(editing);
  }

  return (
    <AdminPage
      title="Categories"
      subtitle="Control menu grouping, visibility and display order."
      action={
        <Button variant="hero" onClick={openAdd} className="gap-1.5">
          <Plus className="size-4" /> Add category
        </Button>
      }
    >
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      )}
      {isError && (
        <QueryErrorState className="" error={error} label="categories" onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && cats.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No categories yet. Add your first one to start building the menu.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c, idx) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
            <div className="relative h-28 w-full overflow-hidden rounded-xl">
              {c.image ? (
                <img src={c.image} alt={c.name} className="size-full object-cover" />
              ) : (
                <div className="size-full bg-muted" />
              )}
              <span className="absolute top-2 left-2 grid size-8 cursor-grab place-items-center rounded-lg bg-card/80 text-muted-foreground shadow-soft backdrop-blur">
                <GripVertical className="size-4" />
              </span>
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.count} items</p>
              </div>
              <Switch
                checked={c.visible}
                onCheckedChange={(v) => visibleMutation.mutate({ id: c.id, visible: v })}
                aria-label={`Toggle visibility for ${c.name}`}
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Move ${c.name} up`}
                  disabled={idx === 0 || moveMutation.isPending}
                  onClick={() => move(c.id, "up")}
                >
                  ↑
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Move ${c.name} down`}
                  disabled={idx === cats.length - 1 || moveMutation.isPending}
                  onClick={() => move(c.id, "down")}
                >
                  ↓
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${c.name}`}
                  onClick={() => openEdit(c)}
                >
                  <Edit className="size-4" />
                </Button>
                {isManager ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled
                          aria-label={`Delete ${c.name} (locked)`}
                        >
                          <Lock className="size-4" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Managers cannot delete categories</TooltipContent>
                  </Tooltip>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${c.name}`}
                        className="text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{c.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {c.count > 0
                            ? `This category has ${c.count} item(s). Reassign or delete them first, or they will become uncategorised.`
                            : "This action cannot be undone."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(c.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div>
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  className="mt-1.5"
                  maxLength={60}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cat-slug">Slug</Label>
                <Input
                  id="cat-slug"
                  className="mt-1.5"
                  maxLength={60}
                  placeholder={slugify(editing.name) || "auto-generated from the name"}
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cat-image">Image URL</Label>
                <Input
                  id="cat-image"
                  className="mt-1.5"
                  value={editing.image}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
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
    </AdminPage>
  );
}

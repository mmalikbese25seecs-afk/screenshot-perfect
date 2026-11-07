import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import { Image as ImageIcon, ImageOff, Megaphone, PauseCircle, Plus, Trash2 } from "lucide-react";
import { AdminPage, StatCard } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createOffer, deleteOffer, errorMessage, fetchAllOffers, setOfferActive } from "@/lib/api";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/admin/advertisements")({
  head: () => ({
    meta: [
      { title: "Advertisements — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Manage the promotional banners shown on the PINDI CRUST homepage.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Advertisements — PINDI CRUST Admin" },
      { property: "og:description", content: "Homepage banners and promotional placements." },
    ],
  }),
  component: AdsPage,
});

const emptyDraft = { title: "", subtitle: "", tag: "", cta: "Order now", image: "" };

function AdsPage() {
  const queryClient = useQueryClient();
  const isManager = useAuth((s) => s.role) === "manager";
  const {
    data: ads = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: fetchAllOffers,
  });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
    queryClient.invalidateQueries({ queryKey: ["offers"] });
  };
  const onError = (err: unknown) =>
    toast.error(errorMessage(err, "That didn't work. Please try again."));

  const createMutation = useMutation({
    mutationFn: () => createOffer({ ...draft, active: true }),
    onSuccess: () => {
      toast.success("Banner created");
      setDraft(emptyDraft);
      setOpen(false);
      refresh();
    },
    onError,
  });
  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setOfferActive(id, active),
    onSuccess: refresh,
    onError,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOffer(id),
    onSuccess: () => {
      toast.success("Banner removed");
      refresh();
    },
    onError,
  });

  function create() {
    if (!draft.title.trim()) return void toast.error("Banner title is required");
    if (draft.image.trim() && !/^https?:\/\//i.test(draft.image.trim())) {
      return void toast.error("Image URL must start with https://");
    }
    createMutation.mutate();
  }

  const running = ads.filter((a) => a.active).length;

  return (
    <AdminPage
      title="Advertisements"
      subtitle="Homepage banners customers see when they open the app."
      action={
        <Button variant="hero" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New banner
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Banners"
          value={String(ads.length)}
          icon={<ImageIcon className="size-4.5" />}
          tone="primary"
        />
        <StatCard
          label="Running"
          value={String(running)}
          icon={<Megaphone className="size-4.5" />}
          tone="success"
        />
        <StatCard
          label="Paused"
          value={String(ads.length - running)}
          icon={<PauseCircle className="size-4.5" />}
          tone="warning"
        />
      </div>

      {isLoading && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      )}
      {isError && (
        <QueryErrorState className="mt-6" error={error} label="banners" onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && ads.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No banners yet. Create one to feature an offer on the homepage.
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ads.map((ad) => (
          <article
            key={ad.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
          >
            <div className="relative h-32">
              {ad.image ? (
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="grid size-full place-items-center bg-muted text-muted-foreground">
                  <ImageOff className="size-6" />
                </span>
              )}
              <Badge
                className="absolute left-3 top-3 text-[10px]"
                variant={ad.active ? "default" : "secondary"}
              >
                {ad.active ? "Running" : "Paused"}
              </Badge>
            </div>
            <div className="p-4">
              <h3 className="font-display truncate text-sm font-bold">{ad.title}</h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {[ad.tag, ad.subtitle].filter(Boolean).join(" · ") || "No subtitle"}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Switch
                  checked={ad.active}
                  aria-label={`Toggle ${ad.title}`}
                  onCheckedChange={(v) => activeMutation.mutate({ id: ad.id, active: v })}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${ad.title}`}
                  disabled={isManager || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(ad.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New banner</DialogTitle>
            <DialogDescription>
              Shown in the homepage offers strip as soon as it's saved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ad-title">Title</Label>
              <Input
                id="ad-title"
                maxLength={60}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-subtitle">Subtitle</Label>
              <Input
                id="ad-subtitle"
                maxLength={100}
                value={draft.subtitle}
                onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ad-tag">Tag</Label>
                <Input
                  id="ad-tag"
                  maxLength={24}
                  placeholder="e.g. Weekend"
                  value={draft.tag}
                  onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ad-cta">Button text</Label>
                <Input
                  id="ad-cta"
                  maxLength={24}
                  value={draft.cta}
                  onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ad-image">Image URL</Label>
              <Input
                id="ad-image"
                placeholder="https://…"
                value={draft.image}
                onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={create} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

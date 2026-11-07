import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, EyeOff, Info, Lock, Star, Trash2 } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  deleteReview,
  fetchAllReviews,
  setReviewFeatured,
  updateReviewStatus,
  type ReviewStatus,
} from "@/lib/api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Review Moderation — PINDI CRUST Admin" },
      { name: "description", content: "Approve, hide or feature PINDI CRUST customer reviews." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Review Moderation — PINDI CRUST Admin" },
      {
        property: "og:description",
        content: "Approve, hide or feature PINDI CRUST customer reviews.",
      },
    ],
  }),
  component: ReviewsPage,
});

type Tab = "pending" | "approved" | "hidden" | "featured";

function ReviewsPage() {
  const { role } = useAuth();
  const isManager = role === "manager";
  const queryClient = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey: ["reviews", "all"], queryFn: fetchAllReviews });
  const [tab, setTab] = useState<Tab>("pending");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reviews"] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) =>
      updateReviewStatus(id, status),
    onSuccess: (_data, { status }) => {
      toast.success(`Review ${status}`);
      invalidate();
    },
    onError: () => toast.error("Couldn't update the review — try again."),
  });
  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      setReviewFeatured(id, featured),
    onSuccess: () => {
      toast.success("Featured status updated");
      invalidate();
    },
    onError: () => toast.error("Couldn't update the review — try again."),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      toast.success("Review deleted");
      invalidate();
    },
    onError: () => toast.error("Couldn't delete the review — try again."),
  });

  const filtered = useMemo(
    () => items.filter((r) => (tab === "featured" ? !!r.featured : r.status === tab)),
    [items, tab],
  );

  const setStatus = (id: string, status: ReviewStatus) => statusMutation.mutate({ id, status });
  const toggleFeature = (id: string, current: boolean) =>
    featureMutation.mutate({ id, featured: !current });
  const remove = (id: string) => deleteMutation.mutate(id);

  return (
    <AdminPage
      title="Review Moderation"
      subtitle="Only signed-in customers who purchased can submit reviews."
    >
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-border bg-primary-soft px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-xs font-semibold text-foreground">
          Reviews can only be submitted by authenticated, verified customers — this keeps moderation
          trustworthy.
        </p>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="hidden">Hidden</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            No reviews in this view.
          </p>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.author}</p>
                <p className="truncate text-xs text-muted-foreground">
                  on {r.product} · {r.date}
                </p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-3.5",
                      i < r.rating ? "fill-warning text-warning" : "text-muted-foreground",
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-pretty text-foreground/90">{r.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="capitalize">
                {r.status}
              </Badge>
              {r.featured && (
                <Badge className="border-0 bg-warning/20 text-warning">Featured</Badge>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setStatus(r.id, "approved")}
              >
                <Check className="size-3.5" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setStatus(r.id, "hidden")}
              >
                <EyeOff className="size-3.5" /> Hide
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => toggleFeature(r.id, r.featured)}
              >
                <Star className="size-3.5" /> {r.featured ? "Unfeature" : "Feature"}
              </Button>
              {isManager ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button size="sm" variant="outline" disabled className="gap-1.5">
                        <Lock className="size-3.5" /> Delete
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Managers cannot delete reviews</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => remove(r.id)}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminPage>
  );
}

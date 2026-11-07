import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { LogIn, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/shared/Primitives";
import { fetchApprovedReviews, submitReview } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shop/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — PINDI CRUST" },
      {
        name: "description",
        content: "Read what crust-lovers say about PINDI CRUST and share your own experience.",
      },
      { property: "og:title", content: "Reviews — PINDI CRUST" },
      { property: "og:description", content: "Real reviews from real PINDI CRUST customers." },
    ],
  }),
  component: ReviewsPage,
});

const schema = z.object({
  rating: z.number().min(1, "Choose a rating").max(5),
  body: z.string().min(10, "Tell us a little more (min 10 characters)"),
});
type FormValues = z.infer<typeof schema>;

function ReviewsPage() {
  const hydrated = useHydrated();
  const { role, name } = useAuth();
  const queryClient = useQueryClient();
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "approved"],
    queryFn: fetchApprovedReviews,
  });
  const [rating, setRating] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, body: "" },
  });

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const submitMutation = useMutation({
    mutationFn: () => submitReview({ author: name, rating: rating, body: form.getValues("body") }),
    onSuccess: () => {
      toast.success("Thanks! Your review is pending approval.");
      form.reset({ rating: 0, body: "" });
      setRating(0);
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: () => toast.error("Couldn't submit your review — try again."),
  });

  const onSubmit = () => submitMutation.mutate();

  const canReview = hydrated && role !== "guest";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader title="Reviews" subtitle="What crust-lovers are saying about us." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="h-fit rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
          <p className="font-display text-4xl font-bold text-primary">{avg.toFixed(1)}</p>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-4",
                  i < Math.round(avg) ? "fill-secondary text-secondary" : "text-muted-foreground",
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Based on {reviews.length} reviews</p>
          <div className="mt-4 space-y-1.5">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="w-3 shrink-0 text-muted-foreground">{d.star}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: `${(d.count / (reviews.length || 1)) * 100}%` }}
                  />
                </div>
                <span className="w-4 shrink-0 text-right text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {canReview ? (
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
              <h2 className="font-display text-lg font-bold">Write a review</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={() => (
                      <FormItem>
                        <FormLabel>Your rating</FormLabel>
                        <FormControl>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                aria-label={`Rate ${i + 1} star`}
                                onClick={() => {
                                  setRating(i + 1);
                                  form.setValue("rating", i + 1, { shouldValidate: true });
                                }}
                              >
                                <Star
                                  className={cn(
                                    "size-6",
                                    i < rating
                                      ? "fill-secondary text-secondary"
                                      : "text-muted-foreground",
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your review</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your experience…"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="hero" disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? "Submitting…" : "Submit Review"}
                  </Button>
                </form>
              </Form>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center">
              <span className="bg-primary-soft grid size-12 place-items-center rounded-2xl text-primary">
                <LogIn className="size-6" />
              </span>
              <p className="text-sm font-bold">Sign in to write a review</p>
              <p className="text-xs text-muted-foreground">
                Share your experience with fellow crust-lovers.
              </p>
              <Button asChild size="sm" variant="hero">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-primary-soft grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-primary">
                    {r.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{r.author}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={cn(
                            "size-3",
                            j < r.rating
                              ? "fill-secondary text-secondary"
                              : "text-muted-foreground",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{r.date}</span>
                </div>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">{r.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

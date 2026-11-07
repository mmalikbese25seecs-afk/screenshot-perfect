import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import {
  Award,
  Bell,
  Heart,
  LogOut,
  Mail,
  MapPin,
  LogIn,
  Package,
  Phone,
  Receipt,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmptyState, PageHeader } from "@/components/shared/Primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPKR } from "@/lib/format";
import { TIER_THRESHOLDS, errorMessage, fetchMyOrderStats, tierFor } from "@/lib/api";
import { fetchMyProfile, updateMyProfile } from "@/lib/auth-api";
import { useAuth } from "@/store/auth";
import { useHydrated } from "@/hooks/use-hydrated";

export const Route = createFileRoute("/_shop/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — PINDI CRUST" },
      {
        name: "description",
        content: "Manage your PINDI CRUST profile, loyalty tier, order stats and account details.",
      },
      { property: "og:title", content: "My Profile — PINDI CRUST" },
      { property: "og:description", content: "View and update your PINDI CRUST account." },
    ],
  }),
  component: ProfilePage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80, "That name is too long"),
  // Shown for reference only: changing an email goes through Supabase Auth, not this form.
  email: z.string(),
  phone: z
    .string()
    .trim()
    .min(9, "Enter a valid phone number")
    .max(20, "That phone number is too long")
    .regex(/^[0-9+\-\s()]+$/, "Use digits only, e.g. +92 300 1234567"),
});
type FormValues = z.infer<typeof schema>;

const quickLinks = [
  { to: "/addresses", label: "Addresses", icon: MapPin },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

function ProfilePage() {
  const hydrated = useHydrated();
  const { name, email, role, userId, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["me", userId],
    queryFn: fetchMyProfile,
    enabled: !!userId,
  });
  const { data: stats } = useQuery({
    queryKey: ["my-order-stats", userId],
    queryFn: fetchMyOrderStats,
    enabled: !!userId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: hydrated ? name : "Guest",
      email: hydrated ? email : "",
      phone: profile?.phone ?? "",
    },
  });

  const save = useMutation({
    mutationFn: (values: FormValues) => updateMyProfile({ name: values.name, phone: values.phone }),
    onSuccess: (updated) => {
      // Keep the header/account name in sync without a reload.
      useAuth.getState()._applyProfile(updated);
      queryClient.setQueryData(["me", userId], updated);
      toast.success("Profile updated");
    },
    onError: (err) =>
      toast.error(errorMessage(err, "Couldn't save your profile. Please try again.")),
  });

  const onSubmit = (values: FormValues) => save.mutate(values);

  const initials = (hydrated ? name : "Guest")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const spent = stats?.spent ?? 0;
  const tier = tierFor(spent);
  // TIER_THRESHOLDS is highest-first; the next tier is the one just above the current.
  const tierIndex = TIER_THRESHOLDS.findIndex((t) => t.tier === tier);
  const nextTier = tierIndex > 0 ? TIER_THRESHOLDS[tierIndex - 1] : undefined;

  if (authLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader title="My Profile" subtitle="Manage your account details and preferences." />
        <Skeleton className="mt-8 h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader title="My Profile" subtitle="Manage your account details and preferences." />
        <div className="mt-10">
          <EmptyState
            icon={<LogIn className="size-7" />}
            title="Sign in to manage your profile"
            description="Create an account to save addresses, track orders and earn loyalty tiers."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="hero">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/register">Create account</Link>
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader title="My Profile" subtitle="Manage your account details and preferences." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
            <span className="bg-primary-soft grid size-16 shrink-0 place-items-center rounded-2xl text-xl font-bold text-primary">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{hydrated ? name : "Guest"}</p>
              <p className="truncate text-sm text-muted-foreground">{hydrated ? email : ""}</p>
              <span className="mt-1 inline-block rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-bold text-primary capitalize">
                {hydrated ? role : "guest"}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
            <h2 className="font-display text-lg font-bold">Account Details</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input className="pl-9" readOnly disabled {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="hero" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </form>
            </Form>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickLinks.map((q, i) => (
              <motion.div
                key={q.to}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={q.to}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-4 text-center shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift"
                >
                  <span className="bg-primary-soft grid size-11 place-items-center rounded-full text-primary">
                    <q.icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-xs font-semibold">{q.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-ember-gradient rounded-3xl p-6 text-primary-foreground shadow-lift">
            <div className="flex items-center gap-2">
              <Award className="size-5" />
              <p className="text-xs font-bold tracking-wide uppercase">Loyalty Tier</p>
            </div>
            <p className="font-display mt-2 text-2xl font-bold">{tier} Crust Member</p>
            <p className="mt-1 text-xs text-primary-foreground/80">
              {nextTier
                ? `${formatPKR(Math.max(nextTier.min - spent, 0))} more to reach ${nextTier.tier}. Keep ordering to level up.`
                : "You've reached our highest tier. Thank you for being a regular!"}
            </p>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-bold">Your Stats</h2>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              {[
                { k: String(stats?.orders ?? 0), v: "Orders", icon: Receipt },
                { k: formatPKR(spent), v: "Spent", icon: Package },
                { k: tier, v: "Tier", icon: Award },
              ].map((s) => (
                <div key={s.v} className="min-w-0 rounded-2xl bg-surface-container p-3 text-center">
                  <dt className="font-display truncate text-sm font-bold text-primary sm:text-base">
                    {s.k}
                  </dt>
                  <dd className="mt-0.5 truncate text-[11px] text-muted-foreground">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              signOut();
              toast.success("Signed out");
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

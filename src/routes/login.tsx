import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { Eye, EyeOff, Flame, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api";
import { isBackendNotConfigured } from "@/lib/supabaseClient";
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
import { images } from "@/lib/images";
import { storeInfo } from "@/lib/store-config";
import { fetchMyProfile, landingRouteForRole, signInWithPassword } from "@/lib/auth-api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — PINDI CRUST" },
      {
        name: "description",
        content:
          "Sign in to your PINDI CRUST account to track orders, save addresses and earn loyalty rewards.",
      },
      { property: "og:title", content: "Sign In — PINDI CRUST" },
      { property: "og:description", content: "Access your PINDI CRUST account in seconds." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await signInWithPassword(values.email, values.password);
      // The profile row (and therefore role) lives server-side — fetch it
      // to know where to send this person. useAuth() will also pick this
      // up automatically via its onAuthStateChange listener.
      const profile = await fetchMyProfile();
      toast.success(profile ? `Welcome back, ${profile.name ?? profile.email}!` : "Welcome back!");
      navigate({ to: profile ? landingRouteForRole(profile.role) : "/" });
    } catch (err) {
      toast.error(
        isBackendNotConfigured(err)
          ? errorMessage(err)
          : err instanceof Error
            ? err.message
            : "Invalid email or password",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your crust journey."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="you@example.com" className="pl-9" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="px-9"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" size="lg" variant="hero" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </Form>

      <SocialRow />
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={images.heroOven}
          alt="Wood-fired oven at PINDI CRUST"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-charcoal/90 via-charcoal/40 to-charcoal/10" />
        <div className="relative z-10 flex h-full flex-col justify-end p-12">
          <span className="bg-brand-gradient grid size-12 place-items-center rounded-2xl shadow-glow">
            <Flame className="size-6 text-primary-foreground" strokeWidth={1.75} />
          </span>
          <h2 className="font-display mt-6 max-w-sm text-3xl font-bold text-balance text-cream">
            {storeInfo.tagline}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-cream/70">
            Artisanal wood-fired pizza, delivered hot across Rawalpindi & Islamabad.
          </p>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="bg-brand-gradient grid size-10 place-items-center rounded-xl shadow-glow">
              <Flame className="size-5 text-primary-foreground" strokeWidth={1.75} />
            </span>
            <span className="font-display text-lg font-bold">{storeInfo.brand}</span>
          </div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}

export function SocialRow() {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-semibold text-muted-foreground uppercase">
          or continue with
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" disabled title="Not available yet">
          <User className="size-4" /> Google
        </Button>
        <Button type="button" variant="outline" disabled title="Not available yet">
          <User className="size-4" /> Apple
        </Button>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Google and Apple sign-in are not available yet.
      </p>
    </div>
  );
}

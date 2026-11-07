import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { errorMessage, requestPasswordReset } from "@/lib/api";
import { isBackendConfigured } from "@/lib/supabaseClient";
import { BackendNotice } from "@/components/shared/BackendNotice";
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
import { AuthShell } from "@/routes/login";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — PINDI CRUST" },
      {
        name: "description",
        content:
          "Forgot your PINDI CRUST password? Enter your email and we'll send you a reset link.",
      },
      { property: "og:title", content: "Reset Password — PINDI CRUST" },
      { property: "og:description", content: "Recover access to your PINDI CRUST account." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  // Only confirm once the auth service has actually accepted the request.
  const onSubmit = async (values: FormValues) => {
    try {
      await requestPasswordReset(values.email, `${window.location.origin}/login`);
      setSubmitted(values.email);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      {submitted ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/60 p-6 text-center"
        >
          <span className="bg-primary-soft grid size-14 place-items-center rounded-2xl text-primary">
            <CheckCircle2 className="size-7" />
          </span>
          <p className="text-sm font-bold">Check your inbox</p>
          <p className="text-xs text-pretty text-muted-foreground">
            We've sent password reset instructions to{" "}
            <span className="font-semibold text-foreground">{submitted}</span>.
          </p>
          <Button variant="soft" size="sm" onClick={() => setSubmitted(null)}>
            Send to a different email
          </Button>
        </motion.div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isBackendConfigured && (
              <BackendNotice
                compact
                title="Password reset unavailable"
                description="Reset emails can't be sent until the backend is connected."
              />
            )}
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
            <Button
              type="submit"
              size="lg"
              variant="hero"
              className="w-full"
              disabled={!isBackendConfigured || form.formState.isSubmitting}
            >
              Send Reset Link
            </Button>
          </form>
        </Form>
      )}
    </AuthShell>
  );
}

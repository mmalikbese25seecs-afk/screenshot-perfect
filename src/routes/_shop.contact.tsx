import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { CheckCircle2, Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { NOT_CONFIGURED, storeInfo, stores } from "@/lib/store-config";
import { BackendNotice } from "@/components/shared/BackendNotice";
import { isBackendConfigured } from "@/lib/supabaseClient";
import { errorMessage, submitContactMessage } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_shop/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — PINDI CRUST" },
      {
        name: "description",
        content:
          "Get in touch with PINDI CRUST — call, WhatsApp, email or visit one of our branches.",
      },
      { property: "og:title", content: "Contact Us — PINDI CRUST" },
      { property: "og:description", content: "Reach the PINDI CRUST team any time." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email address"),
  subject: z.string().min(3, "Enter a subject"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});
type FormValues = z.infer<typeof schema>;

const cards = [
  { icon: Phone, label: "Call Us", value: storeInfo.phone ?? NOT_CONFIGURED },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: storeInfo.whatsapp ? `+${storeInfo.whatsapp}` : NOT_CONFIGURED,
  },
  { icon: Mail, label: "Email", value: storeInfo.email ?? NOT_CONFIGURED },
  { icon: Clock3, label: "Hours", value: storeInfo.hours ?? NOT_CONFIGURED },
];

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  // Only show "sent" after a real backend accepted the message.
  const onSubmit = async (values: FormValues) => {
    try {
      await submitContactMessage(values);
      setSubmitted(true);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        title="Contact Us"
        subtitle="We'd love to hear from you — questions, feedback or catering requests."
      />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border/70 bg-card p-4 text-center shadow-soft"
          >
            <span className="bg-primary-soft mx-auto grid size-10 place-items-center rounded-full text-primary">
              <c.icon className="size-5" strokeWidth={1.75} />
            </span>
            <p className="mt-2 text-xs font-bold">{c.label}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-bold">Our Branches</h2>
          <ul className="mt-4 space-y-3">
            {stores.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Branch locations will be listed here once they're published.
              </li>
            )}
            {stores.map((s) => (
              <li
                key={s.id}
                className="flex gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft"
              >
                <span className="bg-primary-soft grid size-10 shrink-0 place-items-center rounded-xl text-primary">
                  <MapPin className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.address}</p>
                  <p className="mt-0.5 text-xs font-semibold text-primary">{s.hours}</p>
                </div>
              </li>
            ))}
          </ul>
          {stores.length > 0 && storeInfo.address && (
            <div className="mt-4 overflow-hidden rounded-3xl border border-border shadow-soft">
              <iframe
                title="Pindi Crust branch locations map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=72.98%2C33.52%2C73.16%2C33.66&layer=mapnik"
                className="h-64 w-full"
                loading="lazy"
              />
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-xl font-bold">Send a Message</h2>
          {submitted ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-surface-container p-6 text-center">
              <span className="bg-primary-soft grid size-14 place-items-center rounded-2xl text-primary">
                <CheckCircle2 className="size-7" />
              </span>
              <p className="text-sm font-bold">Message sent!</p>
              <p className="text-xs text-muted-foreground">
                Thanks — the team will get back to you.
              </p>
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  setSubmitted(false);
                  form.reset();
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
                {!isBackendConfigured && (
                  <BackendNotice
                    compact
                    title="Messages can't be sent yet"
                    description="The form checks your details, but nothing is sent or saved until the backend is connected."
                  />
                )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
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
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="How can we help?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Tell us more…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={!isBackendConfigured || form.formState.isSubmitting}
                >
                  Send Message
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}

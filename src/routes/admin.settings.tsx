import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brush, CreditCard, Palette, Power, Store } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { BackendNotice } from "@/components/shared/BackendNotice";
import { isBackendConfigured } from "@/lib/supabaseClient";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PINDI CRUST Admin" },
      { name: "description", content: "All PINDI CRUST configuration screens in one place." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Settings — PINDI CRUST Admin" },
      {
        property: "og:description",
        content: "Store, payments, brand, themes and maintenance settings.",
      },
    ],
  }),
  component: SettingsPage,
});

const sections = [
  {
    to: "/admin/store",
    icon: Store,
    title: "Store",
    body: "Fulfilment options, delivery rules, hours and branches.",
  },
  {
    to: "/admin/payments",
    icon: CreditCard,
    title: "Payments",
    body: "Cash on delivery, EasyPaisa and JazzCash details.",
  },
  {
    to: "/admin/brand",
    icon: Brush,
    title: "Brand",
    body: "Name, logo, homepage content, contact details and SEO.",
  },
  {
    to: "/admin/themes",
    icon: Palette,
    title: "Themes",
    body: "Storefront colour themes and appearance.",
  },
  {
    to: "/admin/maintenance",
    icon: Power,
    title: "Maintenance",
    body: "Pause ordering and show customers a notice.",
  },
] as const;

function SettingsPage() {
  return (
    <AdminPage title="Settings" subtitle="Choose an area to configure.">
      {!isBackendConfigured && (
        <BackendNotice
          compact
          className="mb-4"
          title="Settings are drafts for now"
          description="You can edit each screen, but nothing is published until the backend is connected."
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="group flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="bg-primary-soft grid size-11 shrink-0 place-items-center rounded-xl text-primary">
              <s.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2 font-display text-base font-bold">
                {s.title}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1 block text-sm text-pretty text-muted-foreground">{s.body}</span>
            </span>
          </Link>
        ))}
      </div>
    </AdminPage>
  );
}

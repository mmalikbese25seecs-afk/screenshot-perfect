import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Check, Eye, Palette, Sparkles } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { seasonalThemes, useThemeStore } from "@/store/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/themes")({
  head: () => ({
    meta: [
      { title: "Theme Templates — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Switch the PINDI CRUST storefront between seasonal theme templates instantly.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Theme Templates — PINDI CRUST Admin" },
      { property: "og:description", content: "Seasonal storefront themes, applied in one click." },
    ],
  }),
  component: ThemesPage,
});

function ThemesPage() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const active = seasonalThemes.find((t) => t.id === theme);

  return (
    <AdminPage
      title="Theme Templates"
      subtitle="Seasonal skins for the storefront. Layouts, navigation and functionality stay identical."
    >
      <div className="rounded-2xl border border-primary/30 bg-primary-soft p-4 shadow-soft sm:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.18em] text-primary uppercase">
              Currently live
            </p>
            <h2 className="font-display mt-0.5 truncate text-xl font-bold">
              {active?.emoji} {active?.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">{active?.description}</p>
          </div>
          <Button asChild variant="outline" className="gap-1.5">
            <a href="/" target="_blank" rel="noreferrer">
              <Eye className="size-4" /> View store
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {seasonalThemes.map((t, i) => {
          const isActive = t.id === theme;
          return (
            <motion.button
              key={t.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              onClick={() => {
                setTheme(t.id);
                toast.success(`${t.name} theme previewed in this browser`);
              }}
              aria-pressed={isActive}
              className={cn(
                "group overflow-hidden rounded-2xl border bg-card text-left shadow-soft transition-colors",
                isActive
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div
                className="relative h-24"
                style={{
                  background: `linear-gradient(135deg, ${t.swatches[0]}, ${t.swatches[1]})`,
                }}
              >
                <span className="absolute left-3 top-3 text-2xl" aria-hidden>
                  {t.emoji}
                </span>
                {isActive && (
                  <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-card text-primary shadow-soft">
                    <Check className="size-4" />
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <h3 className="min-w-0 truncate font-display text-sm font-bold">{t.name}</h3>
                  {isActive && <Badge className="shrink-0 text-[10px]">Live</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                <div className="mt-3 flex gap-1.5">
                  {t.swatches.map((s) => (
                    <span
                      key={s}
                      className="size-4 rounded-full border border-border"
                      style={{ background: s }}
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Palette,
            title: "Colours & accents",
            body: "Primary, accent and surface tokens swap across every page.",
          },
          {
            icon: Sparkles,
            title: "Seasonal graphics",
            body: "Hero banner, decorations and promo art switch with the theme.",
          },
          {
            icon: Check,
            title: "Zero disruption",
            body: "Routes, cart, checkout and admin behaviour remain unchanged.",
          },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <span className="bg-primary-soft grid size-9 place-items-center rounded-xl text-primary">
              <c.icon className="size-4.5" />
            </span>
            <h3 className="font-display mt-3 text-sm font-bold">{c.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground text-pretty">{c.body}</p>
          </div>
        ))}
      </section>
    </AdminPage>
  );
}

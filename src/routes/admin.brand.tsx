import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { errorMessage, publishBrandSettings } from "@/lib/api";
import { DraftNotice } from "@/components/shared/BackendNotice";
import {
  ArrowDown,
  ArrowUp,
  Globe,
  Image as ImageIcon,
  Palette,
  RotateCcw,
  Save,
  Search,
  Type,
} from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrandStore } from "@/store/brand";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/admin/brand")({
  head: () => ({
    meta: [
      { title: "Brand Management — PINDI CRUST Admin" },
      {
        name: "description",
        content:
          "Visual CMS to edit the PINDI CRUST brand, hero, theme, footer, SEO and contact details.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Brand Management — PINDI CRUST Admin" },
      { property: "og:description", content: "Edit brand identity without touching code." },
    ],
  }),
  component: BrandPage,
});

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold tracking-wide uppercase">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2.5">
        <span className="bg-primary-soft grid size-9 place-items-center rounded-xl text-primary">
          {icon}
        </span>
        <h2 className="font-display text-base font-bold">{title}</h2>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function BrandPage() {
  const b = useBrandStore();
  const role = useAuth((s) => s.role);
  const isManager = role === "manager";

  return (
    <AdminPage
      title="Brand Management"
      subtitle="A visual CMS for the entire storefront — no code required."
      action={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={isManager}
            onClick={() => {
              b.reset();
              toast.success("Draft restored to defaults (this browser only)");
            }}
          >
            <RotateCcw className="size-4" /> Reset
          </Button>
          <Button
            variant="hero"
            className="gap-1.5"
            disabled={isManager}
            onClick={async () => {
              try {
                const {
                  setField: _s,
                  reorderSection: _r,
                  reset: _x,
                  ...draft
                } = useBrandStore.getState();
                await publishBrandSettings(draft);
                toast.success("Brand settings published");
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            <Save className="size-4" /> Publish
          </Button>
        </div>
      }
    >
      <DraftNotice />
      <Tabs defaultValue="identity">
        <TabsList className="no-scrollbar flex w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="home">Homepage</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="contact">Contact & Footer</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-5 space-y-4">
          <Panel title="Brand identity" icon={<Type className="size-4.5" />}>
            <Field label="Brand name">
              <Input
                value={b.brandName}
                onChange={(e) => b.setField("brandName", e.target.value)}
              />
            </Field>
            <Field label="Tagline">
              <Input value={b.tagline} onChange={(e) => b.setField("tagline", e.target.value)} />
            </Field>
            <Field label="Logo URL" hint="Leave empty to use the built-in wordmark.">
              <Input
                value={b.logoUrl}
                onChange={(e) => b.setField("logoUrl", e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Favicon URL">
              <Input
                value={b.faviconUrl}
                onChange={(e) => b.setField("faviconUrl", e.target.value)}
                placeholder="/favicon.ico"
              />
            </Field>
          </Panel>

          <Panel title="Announcement bar" icon={<Globe className="size-4.5" />}>
            <Field label="Message">
              <Input
                value={b.announcement}
                onChange={(e) => b.setField("announcement", e.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Show announcement</p>
                <p className="text-xs text-muted-foreground">
                  Displays above the storefront header.
                </p>
              </div>
              <Switch
                checked={b.announcementEnabled}
                onCheckedChange={(v) => b.setField("announcementEnabled", v)}
                aria-label="Toggle announcement bar"
              />
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="home" className="mt-5 space-y-4">
          <Panel title="Hero banner" icon={<ImageIcon className="size-4.5" />}>
            <Field label="Heading">
              <Input
                value={b.heroHeading}
                onChange={(e) => b.setField("heroHeading", e.target.value)}
              />
            </Field>
            <Field label="CTA label">
              <Input value={b.heroCta} onChange={(e) => b.setField("heroCta", e.target.value)} />
            </Field>
            <Field label="Subheading">
              <Textarea
                rows={2}
                value={b.heroSubheading}
                onChange={(e) => b.setField("heroSubheading", e.target.value)}
              />
            </Field>
            <Field label="Hero image URL" hint="Leave empty to use the default oven photography.">
              <Input
                value={b.heroImage}
                onChange={(e) => b.setField("heroImage", e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </Panel>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-bold">Homepage sections</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Reorder and toggle what customers see.
            </p>
            <ul className="mt-4 space-y-2">
              {b.homeSections.map((s, i) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
                >
                  <p className="min-w-0 truncate text-sm font-semibold">{s.label}</p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Move ${s.label} up`}
                      disabled={i === 0}
                      onClick={() => b.reorderSection(s.id, "up")}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Move ${s.label} down`}
                      disabled={i === b.homeSections.length - 1}
                      onClick={() => b.reorderSection(s.id, "down")}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Switch
                      checked={s.enabled}
                      aria-label={`Toggle ${s.label}`}
                      onCheckedChange={(v) =>
                        b.setField(
                          "homeSections",
                          b.homeSections.map((x) => (x.id === s.id ? { ...x, enabled: v } : x)),
                        )
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </TabsContent>

        <TabsContent value="style" className="mt-5 space-y-4">
          <Panel title="Theme colours" icon={<Palette className="size-4.5" />}>
            {(
              [
                ["primaryColor", "Primary"],
                ["accentColor", "Accent"],
                ["surfaceColor", "Surface"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`${label} colour`}
                    value={b[key]}
                    onChange={(e) => b.setField(key, e.target.value)}
                    className="size-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
                  />
                  <Input value={b[key]} onChange={(e) => b.setField(key, e.target.value)} />
                </div>
              </Field>
            ))}
            <Field label="Display font">
              <Select value={b.font} onValueChange={(v) => b.setField("font", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Poppins", "Inter", "Sora", "Playfair Display", "Manrope"].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Button style">
              <Select
                value={b.buttonStyle}
                onValueChange={(v) => b.setField("buttonStyle", v as typeof b.buttonStyle)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="pill">Pill</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Corner radius">
              <Input value={b.radius} onChange={(e) => b.setField("radius", e.target.value)} />
            </Field>
          </Panel>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-bold tracking-wide uppercase text-muted-foreground">
              Live preview
            </p>
            <div
              className="mt-3 rounded-2xl p-6 shadow-soft"
              style={{ background: `linear-gradient(135deg, ${b.primaryColor}, ${b.accentColor})` }}
            >
              <p className="font-display text-lg font-bold text-white">{b.brandName}</p>
              <p className="text-sm text-white/85">{b.tagline}</p>
              <span
                className="mt-4 inline-block px-4 py-2 text-sm font-bold"
                style={{
                  background: b.surfaceColor,
                  color: b.primaryColor,
                  borderRadius:
                    b.buttonStyle === "pill"
                      ? "999px"
                      : b.buttonStyle === "square"
                        ? "4px"
                        : b.radius,
                }}
              >
                {b.heroCta}
              </span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="mt-5 space-y-4">
          <Panel title="Contact details" icon={<Globe className="size-4.5" />}>
            <Field label="Phone">
              <Input
                value={b.contactPhone}
                onChange={(e) => b.setField("contactPhone", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <Input
                value={b.contactEmail}
                onChange={(e) => b.setField("contactEmail", e.target.value)}
              />
            </Field>
            <Field label="Address">
              <Input
                value={b.contactAddress}
                onChange={(e) => b.setField("contactAddress", e.target.value)}
              />
            </Field>
            <Field label="Business hours">
              <Input value={b.hours} onChange={(e) => b.setField("hours", e.target.value)} />
            </Field>
            <Field label="Google Maps URL">
              <Input value={b.mapsUrl} onChange={(e) => b.setField("mapsUrl", e.target.value)} />
            </Field>
            <Field label="Delivery radius (km)">
              <Input
                type="number"
                value={b.deliveryRadiusKm}
                onChange={(e) => b.setField("deliveryRadiusKm", Number(e.target.value))}
              />
            </Field>
            <Field label="Instagram handle">
              <Input
                value={b.social.instagram}
                onChange={(e) => b.setField("social", { ...b.social, instagram: e.target.value })}
              />
            </Field>
            <Field label="Facebook handle">
              <Input
                value={b.social.facebook}
                onChange={(e) => b.setField("social", { ...b.social, facebook: e.target.value })}
              />
            </Field>
            <Field label="Footer text">
              <Textarea
                rows={2}
                value={b.footerText}
                onChange={(e) => b.setField("footerText", e.target.value)}
              />
            </Field>
            <Field label="Copyright">
              <Input
                value={b.copyright}
                onChange={(e) => b.setField("copyright", e.target.value)}
              />
            </Field>
          </Panel>
        </TabsContent>

        <TabsContent value="seo" className="mt-5 space-y-4">
          <Panel title="Search appearance" icon={<Search className="size-4.5" />}>
            <Field label="SEO title" hint={`${b.seoTitle.length}/60 characters`}>
              <Input value={b.seoTitle} onChange={(e) => b.setField("seoTitle", e.target.value)} />
            </Field>
            <Field label="Meta description" hint={`${b.seoDescription.length}/160 characters`}>
              <Textarea
                rows={3}
                value={b.seoDescription}
                onChange={(e) => b.setField("seoDescription", e.target.value)}
              />
            </Field>
          </Panel>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-bold tracking-wide uppercase text-muted-foreground">
              Google preview
            </p>
            <div className="mt-3 rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted-foreground">pindicrust.pk</p>
              <p className="mt-0.5 text-lg font-medium text-primary">{b.seoTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">{b.seoDescription}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}

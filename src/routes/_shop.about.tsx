import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Award, Flame, Leaf, Timer, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeading } from "@/components/shared/Primitives";
import { images } from "@/lib/images";
import { stores } from "@/lib/store-config";

export const Route = createFileRoute("/_shop/about")({
  head: () => ({
    meta: [
      { title: "About Us — PINDI CRUST" },
      {
        name: "description",
        content:
          "The story behind PINDI CRUST: slow-fermented dough, wood-fired ovens and fiercely local ingredients from Rawalpindi.",
      },
      { property: "og:title", content: "About Us — PINDI CRUST" },
      {
        property: "og:description",
        content: "Slow-fermented dough, wood-fired ovens, and a craft-first kitchen in Rawalpindi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Flame,
    title: "Wood-Fired Only",
    body: "480°C stone hearths — a 90-second bake that blisters the crust perfectly.",
  },
  {
    icon: Timer,
    title: "48-Hour Dough",
    body: "Slow cold fermentation for a lighter, deeply flavoured, easy-to-digest base.",
  },
  {
    icon: Leaf,
    title: "Fresh Ingredients",
    body: "Toppings prepared fresh in our kitchen for every bake.",
  },
  {
    icon: Truck,
    title: "Hot-Box Delivery",
    body: "Insulated thermal bags keep every pie at serving temperature to your door.",
  },
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        title="Our Story"
        subtitle="Artisanal excellence in every slice — built in Rawalpindi, obsessed with the crust."
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 overflow-hidden rounded-3xl border border-border shadow-lift"
      >
        <div className="relative">
          <img
            src={images.heroOven}
            alt="Wood-fired oven at the PINDI CRUST kitchen"
            className="h-56 w-full object-cover sm:h-80"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
            <h2 className="font-display mt-1 max-w-lg text-2xl font-bold text-primary-foreground text-balance sm:text-4xl">
              We only make pizza. So we make it properly.
            </h2>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <span className="bg-primary-soft grid size-11 place-items-center rounded-xl text-primary">
              <v.icon className="size-5" strokeWidth={1.75} />
            </span>
            <h3 className="font-display mt-4 text-base font-bold">{v.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
              {v.body}
            </p>
          </motion.div>
        ))}
      </div>

      <section className="mt-14">
        <SectionHeading eyebrow="Visit us" title="Our kitchens" />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {stores.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground sm:col-span-3">
              Branch locations will be listed here once they're published.
            </p>
          )}
          {stores.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="font-display text-base font-bold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.address}</p>
              <p className="mt-2 text-xs font-semibold text-primary">{s.hours}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-14 grid gap-4 rounded-3xl border border-border bg-surface-container p-6 text-center shadow-soft sm:p-10">
        <span className="bg-primary-soft mx-auto grid size-12 place-items-center rounded-2xl text-primary">
          <Award className="size-6" />
        </span>
        <h2 className="font-display text-2xl font-bold text-balance sm:text-3xl">
          Hungry yet? The oven is already hot.
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground text-pretty">
          Explore the full menu and get a hand-stretched pie delivered to your door.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="hero">
            <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
              Browse the menu
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">
              <Users className="size-4" /> Talk to us
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

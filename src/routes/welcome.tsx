import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Clock3, Flame, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplashScreen } from "@/components/customer/SplashScreen";
import { images } from "@/lib/images";
import { storeInfo } from "@/lib/store-config";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to PINDI CRUST" },
      {
        name: "description",
        content:
          "Discover PINDI CRUST — artisanal wood-fired pizza, hand-stretched dough and hearth-baked happiness delivered across Rawalpindi & Islamabad.",
      },
      { property: "og:title", content: "Welcome to PINDI CRUST" },
      {
        property: "og:description",
        content: "Artisanal Crust, Pure Happiness — start your order in seconds.",
      },
    ],
  }),
  component: WelcomePage,
});

const valueProps = [
  {
    icon: Flame,
    title: "Wood-Fired at 480°C",
    body: "Every base is stone-baked in a roaring hearth for that signature leopard-spot char.",
  },
  {
    icon: Clock3,
    title: "30-Minute Promise",
    body: "Hot, fresh and on your doorstep — tracked live from oven to door.",
  },
  {
    icon: ShieldCheck,
    title: "Quality You Can Trust",
    body: "72-hour fermented dough, cold-pressed oils and hand-torn herbs, always.",
  },
];

function WelcomePage() {
  return (
    <div className="relative min-h-screen">
      <SplashScreen />
      <div className="relative isolate min-h-screen overflow-hidden">
        <img
          src={images.heroOven}
          alt="Pizzaiolo sliding a wood-fired pizza into the brick oven"
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-charcoal/85 via-charcoal/80 to-charcoal/95" />

        <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-10 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5"
          >
            <span className="bg-brand-gradient grid size-11 place-items-center rounded-2xl shadow-glow">
              <Flame className="size-6 text-primary-foreground" strokeWidth={1.75} />
            </span>
            <span className="font-display text-xl font-bold text-cream">{storeInfo.brand}</span>
          </motion.div>

          <div className="flex flex-1 flex-col justify-center py-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-display mt-4 text-4xl leading-[1.05] font-bold text-balance text-cream sm:text-5xl">
                {storeInfo.tagline}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-pretty text-cream/75 sm:text-base">
                Slow-fermented dough, roaring hearth heat and fiercely local ingredients — welcome
                to a pizza experience built for crust-lovers.
              </p>
            </motion.div>

            <div className="mt-10 space-y-4">
              {valueProps.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="glass flex items-start gap-3 rounded-2xl p-4"
                >
                  <span className="bg-primary-soft grid size-10 shrink-0 place-items-center rounded-xl text-primary">
                    <v.icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-cream">{v.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-cream/70 text-pretty">
                      {v.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-3"
          >
            <Button asChild size="xl" variant="hero" className="w-full">
              <Link to="/">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="glass" className="w-full">
              <Link to="/login">I already have an account</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

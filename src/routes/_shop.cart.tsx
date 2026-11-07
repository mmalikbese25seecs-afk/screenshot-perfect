import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, ShoppingBag, Tag, Trash2, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/Primitives";
import { QuantityStepper } from "@/components/customer/QuantityStepper";
import { cartSubtotal, useCart } from "@/store/cart";
import { formatPKR } from "@/lib/format";
import { DELIVERY_FEE, computeTotals, promoLabel, taxLabel } from "@/lib/pricing";
import { errorMessage, validatePromoCode } from "@/lib/api";
import { useThemeStore } from "@/store/theme";
import { useHydrated } from "@/hooks/use-hydrated";

export const Route = createFileRoute("/_shop/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — PINDI CRUST" },
      {
        name: "description",
        content:
          "Review your Pindi Crust order, apply promo codes and proceed to a swift checkout.",
      },
      { property: "og:title", content: "Your Cart — PINDI CRUST" },
      { property: "og:description", content: "Review and check out your hearth-baked order." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const promo = useCart((s) => s.promo);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const setPromo = useCart((s) => s.setPromo);
  const clearPromo = useCart((s) => s.clearPromo);
  const promotionsEnabled = useThemeStore((s) => s.promotionsEnabled);
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);

  if (!hydrated) return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6" />;

  const { subtotal, discount, tax, deliveryFee, total } = computeTotals(cartSubtotal(lines), promo);

  async function handleApply() {
    if (!code.trim() || applying) return;
    setApplying(true);
    try {
      // Checked against the promo_codes table, not a list baked into the app.
      const valid = await validatePromoCode(code);
      setPromo(valid);
      setCode("");
      toast.success(`Promo code ${valid.code} applied`);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't check that promo code. Please try again."));
    } finally {
      setApplying(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="size-7" />}
          title="Your cart is empty"
          description="Looks like you haven't added anything from the hearth yet. Let's fix that."
          action={
            <Button asChild variant="hero">
              <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
                <UtensilsCrossed /> Browse Menu
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-32 sm:px-6 sm:py-12 sm:pb-12">
      <h1 className="font-display text-2xl leading-tight font-bold sm:text-4xl">Your Cart</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {lines.map((l) => (
            <motion.div
              key={l.key}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-soft sm:grid-cols-[80px_minmax(0,1fr)_auto]"
            >
              <img
                src={l.image}
                alt={l.name}
                className="size-16 shrink-0 rounded-xl object-cover sm:size-20"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold sm:text-base">{l.name}</p>
                {l.addOns.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {l.addOns.map((a) => a.name).join(", ")}
                  </p>
                )}
                {l.notes && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground italic">
                    "{l.notes}"
                  </p>
                )}
                <p className="mt-1.5 font-display text-sm font-bold text-primary">
                  {formatPKR(l.unitPrice)}
                </p>
                <div className="mt-2">
                  <QuantityStepper size="sm" qty={l.qty} onChange={(q) => setQty(l.key, q)} />
                </div>
              </div>
              <button
                onClick={() => remove(l.key)}
                aria-label={`Remove ${l.name} from cart`}
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {promotionsEnabled && (
            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
              <h2 className="flex items-center gap-1.5 text-sm font-bold">
                <Tag className="size-4 text-primary" /> Promo Code
              </h2>
              {promo ? (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-primary-soft px-3 py-2">
                  <span className="truncate text-sm font-bold text-primary">
                    {promo.code} · {promoLabel(promo)}
                  </span>
                  <button
                    onClick={() => {
                      clearPromo();
                      toast("Promo code removed");
                    }}
                    aria-label="Remove promo code"
                    className="grid size-7 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/10"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter code"
                    aria-label="Promo code"
                    className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <Button onClick={handleApply} disabled={applying} className="shrink-0">
                    {applying ? "Checking…" : "Apply"}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <h2 className="text-sm font-bold">Order Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Subtotal" value={formatPKR(subtotal)} />
              {discount > 0 && (
                <Row label="Discount" value={`-${formatPKR(discount)}`} valueClass="text-primary" />
              )}
              <Row
                label="Delivery Fee"
                value={DELIVERY_FEE === null ? "Not configured" : formatPKR(deliveryFee)}
              />
              <Row label={taxLabel()} value={formatPKR(tax)} />
              <div className="border-t border-border pt-2">
                <Row label="Total" value={formatPKR(total)} bold />
              </div>
            </dl>
            <Button asChild size="lg" variant="hero" className="mt-4 hidden w-full sm:flex">
              <Link to="/checkout">
                Proceed to Checkout <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky mobile checkout CTA */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-card/95 p-3 backdrop-blur sm:hidden">
        <Button asChild size="lg" variant="hero" className="w-full">
          <Link to="/checkout">
            Checkout · {formatPKR(total)} <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  valueClass,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className={bold ? "font-bold" : "text-muted-foreground"}>{label}</dt>
      <dd
        className={`shrink-0 font-semibold ${bold ? "font-display text-lg text-primary" : ""} ${valueClass ?? ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

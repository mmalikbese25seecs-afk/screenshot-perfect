import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Flame, ShoppingBag, Star, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuantityStepper } from "@/components/customer/QuantityStepper";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { fetchAddOns } from "@/lib/api";
import { useCart } from "@/store/cart";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const badgeLabel: Record<string, string> = {
  bestseller: "Best Seller",
  new: "New",
  spicy: "Spicy",
  vegetarian: "Veg",
  premium: "Premium",
};

const badgeIcon: Record<string, typeof Flame> = {
  spicy: Flame,
};

/** Check whether the user prefers reduced motion. */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProductModal({ product, open, onClose }: ProductModalProps) {
  const add = useCart((s) => s.add);
  const navigate = useNavigate({ from: "/" });

  const [qty, setQty] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const { data: addOns = [] } = useQuery({ queryKey: ["add_ons"], queryFn: fetchAddOns });

  /* Reset local state when the product changes */
  useEffect(() => {
    setQty(1);
    setSelectedAddOns(new Set());
  }, [product?.id]);

  /* Group add-ons by their `group` field */
  const grouped = useMemo(() => {
    const map = new Map<string, typeof addOns>();
    for (const a of addOns) {
      const arr = map.get(a.group) ?? [];
      arr.push(a);
      map.set(a.group, arr);
    }
    return map;
  }, [addOns]);

  /* Toggle an add-on checkbox */
  const toggleAddOn = useCallback((id: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* Resolve selected add-on objects */
  const resolvedAddOns = useMemo(
    () => addOns.filter((a) => selectedAddOns.has(a.id)),
    [addOns, selectedAddOns],
  );

  /* Total price including add-ons × qty */
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const addOnTotal = resolvedAddOns.reduce((s, a) => s + a.price, 0);
    return (product.price + addOnTotal) * qty;
  }, [product, resolvedAddOns, qty]);

  /* Handlers */
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    add(product, qty, resolvedAddOns);
    toast.success(`${product.name} added to cart`);
  }, [product, qty, resolvedAddOns, add]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    add(product, qty, resolvedAddOns);
    onClose();
    navigate({ to: "/checkout" });
  }, [product, qty, resolvedAddOns, add, onClose, navigate]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const reduced = prefersReducedMotion();

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <AnimatePresence>
      {open && product && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.25 }}
        >
          {/* ── Backdrop ── */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
          />

          {/* ── Modal Panel ── */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            className={cn(
              "relative z-10 flex flex-col overflow-hidden",
              "w-full max-w-3xl",
              "rounded-[20px]",
              "bg-card",
              "shadow-[0_25px_80px_-12px_oklch(0.15_0.08_25/0.35)]",
              "md:flex-row md:max-h-[85vh]",
            )}
            initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0, scale: 1 } : { opacity: 0, scale: 0.92 }}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    type: "spring",
                    damping: 28,
                    stiffness: 320,
                  }
            }
          >
            {/* ── Close Button ── */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={cn(
                "absolute right-3 top-3 z-20",
                "grid size-8 place-items-center rounded-full",
                "bg-white/80 backdrop-blur-md text-foreground",
                "transition-all hover:bg-white hover:scale-110 active:scale-95",
                "shadow-soft",
              )}
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>

            {/* ── Left: Product Image ── */}
            <div className="relative w-full aspect-[4/3] md:aspect-auto md:w-[45%] md:min-h-0 shrink-0">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              {/* Discount badge on image */}
              {product.oldPrice && (
                <span className="absolute top-3 left-3 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-destructive-foreground">
                  -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                </span>
              )}
            </div>

            {/* ── Right: Product Details ── */}
            <ScrollArea className="flex-1 md:max-h-[85vh]">
              <div className="flex flex-col gap-4 p-5 pt-4 sm:p-6 sm:pt-5">
                {/* Badges */}
                {product.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {product.badges.map((b) => {
                      const Icon = badgeIcon[b];
                      return (
                        <Badge key={b} variant={b as never}>
                          {Icon && <Icon className="size-3" />}
                          {badgeLabel[b] ?? b}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Name */}
                <h2 className="font-display text-[28px] leading-tight font-bold tracking-tight text-foreground sm:text-[34px]">
                  {product.name}
                </h2>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <Star className="size-4 fill-secondary text-secondary" />
                  <span className="text-sm font-semibold">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount} reviews)
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>

                {/* Price row */}
                <div className="flex items-baseline gap-2.5">
                  <span className="font-display text-2xl font-bold text-primary">
                    {formatPKR(product.price)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPKR(product.oldPrice)}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-border/60" />

                {/* Quantity Stepper */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Quantity</span>
                  <QuantityStepper qty={qty} onChange={setQty} min={1} max={20} />
                </div>

                {/* ── Add-ons ── */}
                {grouped.size > 0 && (
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      Customise your order
                    </span>
                    {Array.from(grouped.entries()).map(([group, items]) => (
                      <div key={group} className="flex flex-col gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {group}
                        </p>
                        {items.map((a) => (
                          <label
                            key={a.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                              "transition-colors",
                              selectedAddOns.has(a.id) ? "bg-primary-soft/60" : "hover:bg-muted/50",
                            )}
                          >
                            <Checkbox
                              checked={selectedAddOns.has(a.id)}
                              onCheckedChange={() => toggleAddOn(a.id)}
                            />
                            <span className="flex-1 text-sm text-foreground">{a.name}</span>
                            <span className="text-sm font-semibold text-muted-foreground">
                              +{formatPKR(a.price)}
                            </span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-border/60" />

                {/* ── Actions ── */}
                <div className="flex flex-col gap-2.5 pb-1">
                  {/* Add to Cart — white pill */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={cn(
                      "inline-flex items-center justify-center gap-2",
                      "h-11 rounded-full",
                      "bg-white text-foreground border border-border",
                      "text-sm font-semibold",
                      "shadow-soft",
                      "transition-all hover:shadow-lift hover:-translate-y-0.5 active:scale-[0.97]",
                    )}
                  >
                    <ShoppingBag className="size-4" />
                    Add to cart
                  </button>

                  {/* Buy Now — primary pill, full width */}
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className={cn(
                      "inline-flex items-center justify-center gap-2",
                      "h-12 w-full rounded-full",
                      "bg-primary text-primary-foreground",
                      "text-sm font-bold",
                      "shadow-glow",
                      "transition-all hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.97]",
                    )}
                  >
                    <Zap className="size-4" />
                    Buy Now · {formatPKR(totalPrice)}
                  </button>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

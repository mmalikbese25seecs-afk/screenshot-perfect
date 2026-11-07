import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/types";
import type { AppliedPromo } from "@/lib/pricing";

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  image: string;
  /**
   * Price shown in the cart (product + add-ons at the time it was added).
   * Display only: the database re-prices every line when the order is placed.
   */
  unitPrice: number;
  qty: number;
  addOns: { id: string; name: string; price: number }[];
  notes?: string;
};

type CartState = {
  lines: CartLine[];
  /** A promo that has been validated against the database (see validatePromoCode). */
  promo: AppliedPromo | null;
  add: (p: Product, qty?: number, addOns?: CartLine["addOns"]) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  setPromo: (promo: AppliedPromo) => void;
  clearPromo: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      promo: null,
      add: (p, qty = 1, addOns = []) => {
        const key = `${p.id}::${addOns
          .map((a) => a.id)
          .sort()
          .join(",")}`;
        const existing = get().lines.find((l) => l.key === key);
        if (existing) {
          set({ lines: get().lines.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l)) });
          return;
        }
        set({
          lines: [
            ...get().lines,
            {
              key,
              productId: p.id,
              name: p.name,
              image: p.image,
              unitPrice: p.price + addOns.reduce((s, a) => s + a.price, 0),
              qty,
              addOns,
            },
          ],
        });
      },
      remove: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),
      setQty: (key, qty) =>
        set({
          lines:
            qty <= 0
              ? get().lines.filter((l) => l.key !== key)
              : get().lines.map((l) => (l.key === key ? { ...l, qty } : l)),
        }),
      clear: () => set({ lines: [], promo: null }),
      setPromo: (promo) => set({ promo }),
      clearPromo: () => set({ promo: null }),
    }),
    {
      name: "pindi-cart",
      // v1 carts held mock product ids ("p1"...) and a hardcoded promo shape.
      // Neither exists in the real database, so old carts are dropped.
      version: 2,
      migrate: () => ({ lines: [], promo: null }),
    },
  ),
);

export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.qty, 0);

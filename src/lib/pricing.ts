/**
 * Checkout maths, in ONE place.
 *
 * This file only produces the *preview* the customer sees in the cart and
 * checkout. The authoritative numbers must be recomputed server-side (the
 * future `place_order` function) from live prices.
 *
 * DELIVERY_FEE and TAX_RATE are UNSET (null) until the store's real values
 * are published from the backend. Previously several screens assumed
 * different defaults; now there is a single source and no invented number.
 * While unset, totals exclude them and the UI labels them "Not configured".
 */

export const DELIVERY_FEE: number | null = null;
export const TAX_RATE: number | null = null;

export const pricingConfigured = DELIVERY_FEE !== null && TAX_RATE !== null;

export type AppliedPromo = {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
};

export type Totals = {
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
};

export function promoDiscount(subtotal: number, promo: AppliedPromo | null): number {
  if (!promo || subtotal <= 0) return 0;
  const raw =
    promo.discountType === "percent" ? (subtotal * promo.discountValue) / 100 : promo.discountValue;
  return Math.min(Math.round(raw), subtotal);
}

/** Human label for a promo, e.g. "20% off" or "Rs 500 off". */
export function promoLabel(promo: AppliedPromo): string {
  return promo.discountType === "percent"
    ? `${promo.discountValue}% off`
    : `Rs ${promo.discountValue.toLocaleString("en-PK")} off`;
}

/** Label for the tax row, e.g. "Tax (5%)" or "Tax (not configured)". */
export function taxLabel(rate: number | null = TAX_RATE): string {
  return rate === null ? "Tax (not configured)" : `Tax (${Math.round(rate * 100)}%)`;
}

/** Online orders pay delivery + tax; POS (walk-in) orders don't. Unset values count as 0. */
export function computeTotals(
  subtotal: number,
  promo: AppliedPromo | null,
  source: "online" | "pos" = "online",
  config: { deliveryFee: number | null; taxRate: number | null } = {
    deliveryFee: DELIVERY_FEE,
    taxRate: TAX_RATE,
  },
): Totals {
  const discount = promoDiscount(subtotal, promo);
  const taxable = subtotal - discount;
  const online = source === "online" && subtotal > 0;
  const tax = online && config.taxRate !== null ? Math.round(taxable * config.taxRate) : 0;
  const deliveryFee = online && config.deliveryFee !== null ? config.deliveryFee : 0;
  return { subtotal, discount, tax, deliveryFee, total: taxable + tax + deliveryFee };
}

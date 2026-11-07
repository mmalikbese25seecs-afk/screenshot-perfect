/**
 * Shared domain types.
 *
 * These used to live in a mock data file. They are plain TypeScript types with
 * no runtime code, so they are safe to import from anywhere. Every value of
 * these types now comes from Supabase via src/lib/api.ts.
 */

export type Badge = "bestseller" | "new" | "spicy" | "vegetarian" | "premium";

export type AddOn = {
  id: string;
  name: string;
  price: number;
  group: string;
  /** Inactive add-ons are hidden from customers but kept for old orders. */
  active: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Category slug (used for URLs and filtering). */
  category: string;
  /** Category row id (used when saving). */
  categoryId: string;
  price: number;
  oldPrice?: number | undefined;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  short: string;
  description: string;
  ingredients: string[];
  nutrition: { label: string; value: string }[];
  badges: Badge[];
  popular?: boolean | undefined;
  recommended?: boolean | undefined;
  /** Unavailable items are hidden from the storefront but kept in admin. */
  available: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
  image: string;
  /** Hidden categories don't show on the storefront. */
  visible: boolean;
  sortOrder: number;
};

export type OrderStatus =
  "pending" | "preparing" | "baking" | "out_for_delivery" | "delivered" | "cancelled";

export type PaymentMethod = "cod" | "easypaisa" | "jazzcash";
export type OrderSource = "online" | "pos";

export type OrderItem = {
  name: string;
  qty: number;
  /** Unit price at the time of the order (add-ons included). */
  price: number;
  productId?: string;
  addOns: { id: string; name: string; price: number }[];
};

export type Order = {
  /** Human-readable order number, e.g. PC-00042. */
  id: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  source: OrderSource;
  payment: PaymentMethod;
  /** Relative time, e.g. "2 min ago". */
  placedAt: string;
  /** Raw ISO timestamp, for real date maths. */
  placedAtIso: string;
  address: string;
  notes?: string | undefined;
  transactionId?: string | undefined;
  promoCode?: string | undefined;
  subtotal?: number | undefined;
  discount?: number | undefined;
  deliveryFee?: number | undefined;
  tax?: number | undefined;
};

import {
  db,
  isBackendConfigured,
  isBackendNotConfigured,
  BACKEND_NOT_CONNECTED_MESSAGE,
  type DbRow,
} from "./supabaseClient";
import type {
  AddOn,
  Badge,
  Category,
  Order,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  Product,
} from "./types";
import type { CartLine } from "@/store/cart";
import type { AppliedPromo } from "./pricing";
import { slugify } from "./format";

// ============================================================
// Helpers
// ============================================================

/** Turns an ISO timestamp into "2 min ago" style text. */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/**
 * Turns a Supabase / Postgres error into a sentence that's safe to show a
 * user. Raw database messages can leak table and column names, so unknown
 * errors get the generic fallback. Messages we raise ourselves inside SQL
 * functions start with "PC:" and are written for customers, so those pass
 * through.
 */
export function errorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isBackendNotConfigured(err)) return BACKEND_NOT_CONNECTED_MESSAGE;
  const e = err as { code?: string; message?: string } | null;
  if (!e) return fallback;
  if (typeof e.message === "string" && e.message.startsWith("PC:"))
    return e.message.slice(3).trim();
  switch (e.code) {
    case "23505":
      return "That already exists. Try a different name.";
    case "23503":
      return "That's still in use by other records, so it can't be removed.";
    case "42501":
      return "You don't have permission to do that.";
    case "PGRST301":
      return "Your session has expired. Please sign in again.";
    default:
      return fallback;
  }
}

async function currentUserId(): Promise<string | null> {
  if (!isBackendConfigured) return null;
  const { data } = await db().auth.getSession();
  return data.session?.user.id ?? null;
}

// ============================================================
// Categories
// ============================================================

function mapCategory(row: DbRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon ?? "",
    count: row.products?.[0]?.count ?? 0,
    image: row.image_url ?? "",
    visible: row.is_visible ?? true,
    sortOrder: row.sort_order ?? 0,
  };
}

/** Storefront: visible categories only, with a count of *available* items. */
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await db()
    .from("categories")
    .select("*, products(count)")
    .eq("is_visible", true)
    .eq("products.is_available", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapCategory);
}

/** Admin: every category, hidden ones included. */
export async function fetchAllCategories(): Promise<Category[]> {
  const { data, error } = await db()
    .from("categories")
    .select("*, products(count)")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapCategory);
}

export type CategoryInput = { name: string; slug: string; image: string; visible: boolean };

export async function createCategory(input: CategoryInput): Promise<void> {
  const { data: last, error: lastError } = await db()
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw lastError;

  const { error } = await db()
    .from("categories")
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim() || slugify(input.name),
      icon: "Pizza",
      image_url: input.image.trim() || null,
      is_visible: input.visible,
      sort_order: (last?.sort_order ?? 0) + 1,
    });
  if (error) throw error;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  const { error } = await db()
    .from("categories")
    .update({
      name: input.name.trim(),
      slug: input.slug.trim() || slugify(input.name),
      image_url: input.image.trim() || null,
      is_visible: input.visible,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function setCategoryVisible(id: string, visible: boolean): Promise<void> {
  const { error } = await db().from("categories").update({ is_visible: visible }).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await db().from("categories").delete().eq("id", id);
  if (error) throw error;
}

/** Saves a new display order. `orderedIds` is the full list, first = top. */
export async function reorderCategories(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, i) =>
      db()
        .from("categories")
        .update({ sort_order: i + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

// ============================================================
// Products
// ============================================================

function mapProduct(row: DbRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.categories?.slug ?? "",
    categoryId: row.category_id ?? "",
    price: Number(row.price),
    oldPrice: row.old_price != null ? Number(row.old_price) : undefined,
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    image: row.image_url ?? "",
    gallery: row.gallery ?? [],
    short: row.short_description ?? "",
    description: row.description ?? "",
    ingredients: row.ingredients ?? [],
    nutrition: row.nutrition ?? [],
    badges: row.badges ?? [],
    popular: row.popular,
    recommended: row.recommended,
    available: row.is_available ?? true,
  };
}

/** Storefront: only items that are currently available. */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await db()
    .from("products")
    .select("*, categories(slug)")
    .eq("is_available", true);
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

/** Admin / POS management: everything, including unavailable items. */
export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await db()
    .from("products")
    .select("*, categories(slug)")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await db()
    .from("products")
    .select("*, categories(slug)")
    .eq("slug", slug)
    .eq("is_available", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export type ProductInput = {
  name: string;
  categoryId: string;
  price: number;
  oldPrice: number | null;
  image: string;
  short: string;
  description: string;
  ingredients: string[];
  badges: Badge[];
  available: boolean;
  /**
   * Existing gallery/nutrition. Optional so the edit form can omit them: when
   * omitted on update, the stored values are left untouched (previously every
   * edit overwrote gallery with [image] and could wipe nutrition data).
   */
  gallery?: string[];
  nutrition?: { label: string; value: string }[];
};

/** Main image first, then the remaining gallery entries without duplicates. */
export function mergeGallery(image: string, gallery: string[] = []): string[] {
  const main = image.trim();
  const rest = gallery.filter((g) => g && g !== main);
  return main ? [main, ...rest] : rest;
}

function productPayload(input: ProductInput) {
  const image = input.image.trim();
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    category_id: input.categoryId,
    price: input.price,
    old_price: input.oldPrice && input.oldPrice > 0 ? input.oldPrice : null,
    image_url: image || null,
    short_description: input.short.trim(),
    description: input.description.trim(),
    ingredients: input.ingredients,
    badges: input.badges,
    is_available: input.available,
  };
  if (input.gallery !== undefined) payload["gallery"] = mergeGallery(image, input.gallery);
  if (input.nutrition !== undefined) payload["nutrition"] = input.nutrition;
  return payload;
}

export async function createProduct(input: ProductInput): Promise<void> {
  const { error } = await db()
    .from("products")
    .insert({
      gallery: mergeGallery(input.image, input.gallery),
      nutrition: input.nutrition ?? [],
      ...productPayload(input),
      slug: slugify(input.name),
    });
  if (error) throw error;
}

/** The slug is left alone on edit so existing links to the product keep working. */
export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { error } = await db().from("products").update(productPayload(input)).eq("id", id);
  if (error) throw error;
}

export async function setProductsAvailable(ids: string[], available: boolean): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await db().from("products").update({ is_available: available }).in("id", ids);
  if (error) throw error;
}

export async function deleteProducts(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await db().from("products").delete().in("id", ids);
  if (error) throw error;
}

// ============================================================
// Add-ons
// ============================================================

function mapAddOn(row: DbRow): AddOn {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    group: row.group_name,
    active: row.is_active ?? true,
  };
}

/** Storefront: active add-ons only. */
export async function fetchAddOns(): Promise<AddOn[]> {
  const { data, error } = await db()
    .from("add_ons")
    .select("*")
    .eq("is_active", true)
    .order("group_name", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAddOn);
}

/** Admin: every add-on, inactive ones included. */
export async function fetchAllAddOns(): Promise<AddOn[]> {
  const { data, error } = await db()
    .from("add_ons")
    .select("*")
    .order("group_name", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAddOn);
}

export type AddOnInput = { name: string; price: number; group: string; active: boolean };

export async function createAddOn(input: AddOnInput): Promise<void> {
  const { error } = await db()
    .from("add_ons")
    .insert({
      name: input.name.trim(),
      price: input.price,
      group_name: input.group.trim() || "General",
      is_active: input.active,
    });
  if (error) throw error;
}

export async function updateAddOn(id: string, input: AddOnInput): Promise<void> {
  const { error } = await db()
    .from("add_ons")
    .update({
      name: input.name.trim(),
      price: input.price,
      group_name: input.group.trim() || "General",
      is_active: input.active,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function setAddOnActive(id: string, active: boolean): Promise<void> {
  const { error } = await db().from("add_ons").update({ is_active: active }).eq("id", id);
  if (error) throw error;
}

export async function setAddOnPrice(id: string, price: number): Promise<void> {
  const { error } = await db().from("add_ons").update({ price }).eq("id", id);
  if (error) throw error;
}

export async function deleteAddOn(id: string): Promise<void> {
  const { error } = await db().from("add_ons").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Promo codes (customer side)
// Admin CRUD lives further down in the "Promotions" section.
// ============================================================

/**
 * Checks a code against the promo_codes table (active, not expired, under its
 * usage limit) and returns the discount rule. Throws a friendly error if it's
 * not usable. The discount is applied for real by `place_order`, which
 * re-validates the code, so this call is only for showing the customer a
 * preview.
 */
export async function validatePromoCode(code: string): Promise<AppliedPromo> {
  const { data, error } = await db().rpc("validate_promo", { p_code: code.trim() });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("PC: That promo code is invalid or has expired.");
  return {
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
  };
}

// ============================================================
// Orders
// ============================================================

const ORDER_SELECT = "*, order_items(name, qty, price, product_id, addons)";

export type PlaceOrderInput = {
  customerName: string;
  phone: string;
  address: string;
  payment: PaymentMethod;
  source: OrderSource;
  notes?: string | undefined;
  /** EasyPaisa / JazzCash transaction reference. */
  transactionId?: string | undefined;
  promoCode?: string | null | undefined;
  /** POS only: admin-approved manual discount, enforced server-side. */
  manualDiscountPercent?: number | undefined;
  lines: { productId: string; qty: number; addOnIds: string[] }[];
};

export type PlacedOrder = {
  orderNumber: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
};

/** Adapts the customer's cart to the shape place_order expects. */
export function cartToOrderLines(lines: CartLine[]): PlaceOrderInput["lines"] {
  return lines.map((l) => ({
    productId: l.productId,
    qty: l.qty,
    addOnIds: l.addOns.map((a) => a.id),
  }));
}

/**
 * Places an order through the `place_order` database function.
 *
 * The browser only says WHAT is being ordered (product ids, quantities,
 * add-on ids, promo code). The database looks up the real prices, applies the
 * promo, adds tax and delivery, checks stock/availability, and stamps the
 * signed-in user as the customer. Nothing price-related from the client is
 * trusted.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const { data, error } = await db().rpc("place_order", {
    p_customer_name: input.customerName.trim(),
    p_phone: input.phone.trim(),
    p_address: input.address.trim(),
    p_payment: input.payment,
    p_source: input.source,
    p_notes: input.notes?.trim() || null,
    p_transaction_id: input.transactionId?.trim() || null,
    p_promo_code: input.promoCode ?? null,
    p_manual_discount_percent: input.manualDiscountPercent ?? 0,
    p_items: input.lines.map((l) => ({
      product_id: l.productId,
      qty: l.qty,
      addon_ids: l.addOnIds,
    })),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("PC: Your order couldn't be created. Please try again.");
  return {
    orderNumber: row.order_number,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    deliveryFee: Number(row.delivery_fee),
    tax: Number(row.tax),
    total: Number(row.total),
  };
}

function mapOrder(row: DbRow): Order {
  return {
    id: row.order_number,
    customer: row.customer_name,
    phone: row.phone ?? "—",
    items: (row.order_items ?? []).map((i: DbRow) => ({
      name: i.name,
      qty: i.qty,
      price: Number(i.price),
      productId: i.product_id ?? undefined,
      addOns: Array.isArray(i.addons) ? i.addons : [],
    })),
    total: Number(row.total),
    status: row.status as OrderStatus,
    source: row.source,
    payment: row.payment,
    placedAt: timeAgo(row.placed_at),
    placedAtIso: row.placed_at,
    address: row.address ?? "",
    notes: row.notes ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    promoCode: row.promo_code ?? undefined,
    subtotal: row.subtotal != null ? Number(row.subtotal) : undefined,
    discount: row.discount != null ? Number(row.discount) : undefined,
    deliveryFee: row.delivery_fee != null ? Number(row.delivery_fee) : undefined,
    tax: row.tax != null ? Number(row.tax) : undefined,
  };
}

/**
 * Admin-only: the latest 500 orders. (Deliberately takes no arguments, since
 * react-query passes a context object as the first argument to a queryFn.)
 */
export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await db()
    .from("orders")
    .select(ORDER_SELECT)
    .order("placed_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

/** Admin-only: every order placed at or after `sinceIso` (used by the dashboard). */
export async function fetchOrdersSince(sinceIso: string): Promise<Order[]> {
  const { data, error } = await db()
    .from("orders")
    .select(ORDER_SELECT)
    .gte("placed_at", sinceIso)
    .order("placed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

/** The signed-in customer's own orders, newest first. Empty when signed out. */
export async function fetchMyOrders(): Promise<Order[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const { data, error } = await db()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_id", uid)
    .order("placed_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

/** Lifetime order count and spend for the signed-in customer (cancelled orders excluded). */
export async function fetchMyOrderStats(): Promise<{ orders: number; spent: number }> {
  const uid = await currentUserId();
  if (!uid) return { orders: 0, spent: 0 };
  const { data, error } = await db().from("orders").select("total, status").eq("customer_id", uid);
  if (error) throw error;
  const counted = (data ?? []).filter((o) => o.status !== "cancelled");
  return { orders: counted.length, spent: counted.reduce((sum, o) => sum + Number(o.total), 0) };
}

/**
 * Looks up ONE order for tracking or a receipt. The database function only
 * returns it if the caller owns it, is staff, or supplies the phone number
 * the order was placed with, so order numbers alone can't be used to browse
 * other people's orders.
 */
export async function trackOrder(orderNumber: string, phone?: string): Promise<Order | null> {
  const { data, error } = await db().rpc("track_order", {
    p_order_number: orderNumber.trim().toUpperCase(),
    p_phone: phone?.trim() || null,
  });
  if (error) throw error;
  return data ? mapOrder(data) : null;
}

export async function updateOrderStatus(orderNumber: string, status: OrderStatus): Promise<void> {
  const { error } = await db().from("orders").update({ status }).eq("order_number", orderNumber);
  if (error) throw error;
}

/** Subscribes to live order changes. Call the returned function to unsubscribe (e.g. in a useEffect cleanup). */
export function subscribeToOrders(onChange: () => void): () => void {
  // No backend → no realtime feed. Return a no-op unsubscribe; screens show the not-connected notice.
  if (!isBackendConfigured) return () => {};
  const channel = db()
    .channel("orders-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, onChange)
    .subscribe();

  return () => {
    db().removeChannel(channel);
  };
}

// ============================================================
// Customers (admin)
// ============================================================

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  tier: "Platinum" | "Gold" | "Silver" | "Bronze";
  joined: string;
};

/** Spend needed for each loyalty tier, highest first. */
export const TIER_THRESHOLDS: { tier: AdminCustomer["tier"]; min: number }[] = [
  { tier: "Platinum", min: 200000 },
  { tier: "Gold", min: 100000 },
  { tier: "Silver", min: 50000 },
  { tier: "Bronze", min: 0 },
];

export function tierFor(spent: number): AdminCustomer["tier"] {
  return (
    TIER_THRESHOLDS.find((t) => spent >= t.min) ?? TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1]!
  ).tier;
}

/** Admin-only: real customers (profiles with role='customer') + order stats. */
export async function fetchCustomers(): Promise<AdminCustomer[]> {
  const { data: profiles, error: profilesError } = await db()
    .from("profiles")
    .select("id, name, email, phone, created_at")
    .eq("role", "customer");
  if (profilesError) throw profilesError;

  const { data: orderRows, error: ordersError } = await db()
    .from("orders")
    .select("customer_id, total, status")
    .neq("status", "cancelled");
  if (ordersError) throw ordersError;

  const stats = new Map<string, { orders: number; spent: number }>();
  for (const o of orderRows ?? []) {
    if (!o.customer_id) continue;
    const s = stats.get(o.customer_id) ?? { orders: 0, spent: 0 };
    s.orders += 1;
    s.spent += Number(o.total);
    stats.set(o.customer_id, s);
  }

  return (profiles ?? []).map((p) => {
    const s = stats.get(p.id) ?? { orders: 0, spent: 0 };
    return {
      id: p.id,
      name: p.name ?? "—",
      email: p.email,
      phone: p.phone ?? "—",
      orders: s.orders,
      spent: s.spent,
      tier: tierFor(s.spent),
      joined: new Date(p.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    };
  });
}

/** Admin-only: a single customer's recent orders (for the detail drawer). */
export async function fetchCustomerOrders(customerId: string): Promise<Order[]> {
  const { data, error } = await db()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_id", customerId)
    .order("placed_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

// ============================================================
// Reviews
// ============================================================

export type ReviewStatus = "approved" | "pending" | "hidden";

export type Review = {
  id: string;
  author: string;
  initials: string;
  rating: number;
  product: string;
  body: string;
  date: string;
  status: ReviewStatus;
  featured: boolean;
};

/** "Ayesha Khan" -> "AK" */
export function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapReview(row: DbRow): Review {
  return {
    id: row.id,
    author: row.author,
    initials: initialsFromName(row.author),
    rating: row.rating,
    product: row.product_name ?? "General",
    body: row.body,
    date: timeAgo(row.created_at),
    status: row.status,
    featured: row.featured,
  };
}

/** Public reviews page: only ever shows approved reviews. */
export async function fetchApprovedReviews(): Promise<Review[]> {
  const { data, error } = await db()
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReview);
}

/** Approved reviews for one dish, shown on its product page. */
export async function fetchProductReviews(productName: string): Promise<Review[]> {
  const { data, error } = await db()
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .eq("product_name", productName)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReview);
}

/** Admin moderation queue: every review regardless of status. */
export async function fetchAllReviews(): Promise<Review[]> {
  const { data, error } = await db()
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReview);
}

export type NewReviewInput = { author: string; rating: number; body: string; product?: string };

/** New reviews always start as "pending" until an admin approves them. */
export async function submitReview(input: NewReviewInput): Promise<void> {
  const { error } = await db()
    .from("reviews")
    .insert({
      author: input.author,
      rating: input.rating,
      body: input.body,
      product_name: input.product ?? "General",
      status: "pending",
    });
  if (error) throw error;
}

export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<void> {
  const { error } = await db().from("reviews").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function setReviewFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await db().from("reviews").update({ featured }).eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await db().from("reviews").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Offers (homepage promo banners)
// ============================================================

export type Offer = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  cta: string;
  image: string;
  active: boolean;
};

function mapOffer(row: DbRow): Offer {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? "",
    tag: row.tag ?? "",
    cta: row.cta ?? "",
    image: row.image_url ?? "",
    active: row.is_active ?? true,
  };
}

/** Homepage: active banners only. */
export async function fetchOffers(): Promise<Offer[]> {
  const { data, error } = await db()
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapOffer);
}

/** Admin: every banner, paused ones included. */
export async function fetchAllOffers(): Promise<Offer[]> {
  const { data, error } = await db()
    .from("offers")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapOffer);
}

export type OfferInput = {
  title: string;
  subtitle: string;
  tag: string;
  cta: string;
  image: string;
  active: boolean;
};

export async function createOffer(input: OfferInput): Promise<void> {
  const { data: last, error: lastError } = await db()
    .from("offers")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw lastError;
  const { error } = await db()
    .from("offers")
    .insert({
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      tag: input.tag.trim(),
      cta: input.cta.trim(),
      image_url: input.image.trim() || null,
      is_active: input.active,
      sort_order: (last?.sort_order ?? 0) + 1,
    });
  if (error) throw error;
}

export async function setOfferActive(id: string, active: boolean): Promise<void> {
  const { error } = await db().from("offers").update({ is_active: active }).eq("id", id);
  if (error) throw error;
}

export async function deleteOffer(id: string): Promise<void> {
  const { error } = await db().from("offers").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Saved Addresses (per-customer, requires a signed-in session — see RLS)
// ============================================================

export type SavedAddress = { id: string; label: string; line: string; isDefault: boolean };

function mapAddress(row: DbRow): SavedAddress {
  return { id: row.id, label: row.label, line: row.line, isDefault: row.is_default };
}

export async function fetchSavedAddresses(): Promise<SavedAddress[]> {
  const { data, error } = await db()
    .from("saved_addresses")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAddress);
}

export type NewAddressInput = { label: string; line: string };

/** First address a customer adds becomes their default automatically. */
export async function addSavedAddress(input: NewAddressInput): Promise<SavedAddress> {
  const { data: sessionData } = await db().auth.getSession();
  const customerId = sessionData.session?.user.id;
  if (!customerId) throw new Error("You need to be signed in to save an address.");

  const existing = await fetchSavedAddresses();
  const { data, error } = await db()
    .from("saved_addresses")
    .insert({
      customer_id: customerId,
      label: input.label,
      line: input.line,
      is_default: existing.length === 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapAddress(data);
}

export async function updateSavedAddress(id: string, input: NewAddressInput): Promise<void> {
  const { error } = await db().from("saved_addresses").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteSavedAddress(id: string): Promise<void> {
  const { error } = await db().from("saved_addresses").delete().eq("id", id);
  if (error) throw error;
}

/** Clears is_default on every one of the customer's addresses, then sets it on `id`. */
export async function setDefaultAddress(id: string): Promise<void> {
  const { data: sessionData } = await db().auth.getSession();
  const customerId = sessionData.session?.user.id;
  if (!customerId) throw new Error("You need to be signed in to do that.");

  const { error: clearError } = await db()
    .from("saved_addresses")
    .update({ is_default: false })
    .eq("customer_id", customerId);
  if (clearError) throw clearError;

  const { error: setError } = await db()
    .from("saved_addresses")
    .update({ is_default: true })
    .eq("id", id);
  if (setError) throw setError;
}

// ============================================================
// Notifications (per-customer; rows are created server-side only — see
// the on_order_status_change trigger in schema-phase4-addresses-notifications.sql)
// ============================================================

export type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: "order" | "promo" | "review" | "news";
};

function mapNotification(row: DbRow): Notification {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? "",
    time: timeAgo(row.created_at),
    unread: row.unread,
    type: row.type,
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await db()
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapNotification);
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data: sessionData } = await db().auth.getSession();
  const customerId = sessionData.session?.user.id;
  if (!customerId) return;
  const { error } = await db()
    .from("notifications")
    .update({ unread: false })
    .eq("customer_id", customerId)
    .eq("unread", true);
  if (error) throw error;
}

// ============================================================
// Promotions (admin)
// ============================================================

export type PromoCode = {
  id: string;
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  active: boolean;
  usageCount: number;
  usageLimit: number | null;
  expiresAt: string | null;
};

function mapPromo(row: DbRow): PromoCode {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    active: row.active,
    usageCount: row.usage_count,
    usageLimit: row.usage_limit,
    expiresAt: row.expires_at,
  };
}

export async function fetchPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await db()
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPromo);
}

export type PromoCodeInput = {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  usageLimit: number | null;
  expiresAt: string | null;
  active: boolean;
};

export async function createPromoCode(input: PromoCodeInput): Promise<void> {
  const { error } = await db().from("promo_codes").insert({
    code: input.code,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    usage_limit: input.usageLimit,
    expires_at: input.expiresAt,
    active: input.active,
  });
  if (error) throw error;
}

export async function updatePromoCode(id: string, input: PromoCodeInput): Promise<void> {
  const { error } = await db()
    .from("promo_codes")
    .update({
      code: input.code,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      usage_limit: input.usageLimit,
      expires_at: input.expiresAt,
      active: input.active,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePromoCode(id: string): Promise<void> {
  const { error } = await db().from("promo_codes").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Activity Logs
// ============================================================

export type ActivityLog = {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  target: string;
  module: string;
  level: "info" | "warning" | "critical";
  created_at: string;
};

export async function fetchActivityLogs(limit = 200): Promise<ActivityLog[]> {
  const { data, error } = await db()
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ActivityLog[];
}

/** Manual logging for actions that aren't DB writes (exports, logins, etc.) */
export async function logActivity(
  action: string,
  target = "",
  module = "general",
  level: "info" | "warning" | "critical" = "info",
) {
  const { error } = await db().rpc("log_activity", {
    p_action: action,
    p_target: target,
    p_module: module,
    p_level: level,
  });
  if (error) throw error;
}

// ============================================================
// Analytics
// ============================================================

export type RevenuePoint = { day: string; revenue: number; orders: number };
export type CategorySale = { name: string; value: number };
export type PeakHour = { hour: string; orders: number };
export type GrowthPoint = { month: string; newCustomers: number; returning: number };
export type PaymentSplit = { name: string; value: number };
export type TopProduct = { name: string; sold: number };

const rangeToDays: Record<string, number> = {
  Today: 1,
  "7 Days": 7,
  "30 Days": 30,
  "90 Days": 90,
};

export function daysForRange(range: string) {
  return rangeToDays[range] ?? 7;
}

export async function fetchRevenueTrend(days: number): Promise<RevenuePoint[]> {
  const { data, error } = await db().rpc("analytics_revenue_trend", { p_days: days });
  if (error) throw error;
  return (data ?? []).map((r: DbRow) => ({
    day: new Date(r.day).toLocaleDateString(undefined, { weekday: "short" }),
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));
}

export async function fetchCategorySales(days: number): Promise<CategorySale[]> {
  const { data, error } = await db().rpc("analytics_category_sales", { p_days: days });
  if (error) throw error;
  return (data ?? []).map((r: DbRow) => ({ name: r.name, value: Number(r.value) }));
}

export async function fetchPeakHours(days: number): Promise<PeakHour[]> {
  const { data, error } = await db().rpc("analytics_peak_hours", { p_days: days });
  if (error) throw error;
  return (data ?? []).map((r: DbRow) => ({ hour: r.hour, orders: Number(r.orders) }));
}

export async function fetchCustomerGrowth(): Promise<GrowthPoint[]> {
  const { data, error } = await db().rpc("analytics_customer_growth");
  if (error) throw error;
  return (data ?? []).map((r: DbRow) => ({
    month: r.month,
    newCustomers: Number(r.newCustomers),
    returning: Number(r.returning),
  }));
}

export async function fetchPaymentSplit(days: number): Promise<PaymentSplit[]> {
  const { data, error } = await db().rpc("analytics_payment_split", { p_days: days });
  if (error) throw error;
  return (data ?? []).map((r: DbRow) => ({ name: r.name, value: Number(r.value) }));
}

export async function fetchTopProducts(
  days: number,
  direction: "best" | "slow",
  limit = 5,
): Promise<TopProduct[]> {
  const { data, error } = await db().rpc("analytics_top_products", {
    p_days: days,
    p_limit: limit,
    p_direction: direction,
  });
  if (error) throw error;
  return (data ?? []).map((r: DbRow) => ({ name: r.name, sold: Number(r.sold) }));
}

// ============================================================
// Reports
// ============================================================

export type ReportRow = {
  id: string;
  type: string;
  format: string;
  range: string;
  status: "processing" | "ready" | "failed";
  created_by_name: string;
  created_at: string;
};

const reportRangeToDays: Record<string, number> = {
  "7 Days": 7,
  "30 Days": 30,
  "This Quarter": 90,
  Custom: 30, // TODO: no date-range picker built yet, defaults to 30
};

export function daysForReportRange(range: string) {
  return reportRangeToDays[range] ?? 7;
}

export async function fetchReportHistory(): Promise<ReportRow[]> {
  const { data, error } = await db()
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as ReportRow[];
}

export async function createReportRow(row: {
  id: string;
  type: string;
  format: string;
  range: string;
  created_by_name: string;
}) {
  const { error } = await db()
    .from("reports")
    .insert({ ...row, status: "processing" });
  if (error) throw error;
}

export async function markReportReady(id: string) {
  const { error } = await db().from("reports").update({ status: "ready" }).eq("id", id);
  if (error) throw error;
}

export async function fetchReportOrders(days: number) {
  const { data, error } = await db().rpc("report_orders", { p_days: days });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReportItems(days: number) {
  const { data, error } = await db().rpc("report_items", { p_days: days });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReportPayments(days: number) {
  const { data, error } = await db().rpc("report_payments", { p_days: days });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReportTaxes(days: number) {
  const { data, error } = await db().rpc("report_taxes", { p_days: days });
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// Contracts added in the frontend-completion phase.
//
// These operations have UI but no backend implementation yet. Each one
// calls db(), so without a backend it throws BackendNotConfiguredError and
// the UI shows the not-connected message instead of a fake success. The
// table / RPC names below are the proposed contract — see
// docs/frontend-completion/BACKEND_HANDOFF.md.
// ============================================================

export type ContactMessageInput = { name: string; email: string; subject: string; message: string };

export async function submitContactMessage(input: ContactMessageInput): Promise<void> {
  const { error } = await db().from("contact_messages").insert(input);
  if (error) throw error;
}

export async function subscribeNewsletter(email: string): Promise<void> {
  const { error } = await db()
    .from("newsletter_subscribers")
    .insert({ email: email.trim().toLowerCase() });
  if (error) throw error;
}

export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  const { error } = await db().auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw error;
}

export type StoreSettings = {
  storeName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  deliveryFee: number | null;
  taxRate: number | null;
  minOrder: number | null;
  deliveryRadiusKm: number | null;
  acceptingOrders: boolean;
};

export async function fetchStoreSettings(): Promise<StoreSettings | null> {
  const { data, error } = await db().from("store_settings").select("*").maybeSingle();
  if (error) throw error;
  return (data as StoreSettings | null) ?? null;
}

export async function saveStoreSettings(input: StoreSettings): Promise<void> {
  const { error } = await db()
    .from("store_settings")
    .upsert({ id: 1, ...input });
  if (error) throw error;
}

export type PaymentSettings = {
  codEnabled: boolean;
  easypaisaEnabled: boolean;
  easypaisaNumber: string;
  jazzcashEnabled: boolean;
  jazzcashNumber: string;
  cardEnabled: boolean;
};

export async function savePaymentSettings(input: PaymentSettings): Promise<void> {
  const { error } = await db()
    .from("payment_settings")
    .upsert({ id: 1, ...input });
  if (error) throw error;
}

export type MaintenanceSettings = { enabled: boolean; message: string; eta: string };

export async function fetchMaintenanceSettings(): Promise<MaintenanceSettings | null> {
  if (!isBackendConfigured) return null;
  const { data, error } = await db().from("maintenance_settings").select("*").maybeSingle();
  if (error) throw error;
  return (data as MaintenanceSettings | null) ?? null;
}

export async function saveMaintenanceSettings(input: MaintenanceSettings): Promise<void> {
  const { error } = await db()
    .from("maintenance_settings")
    .upsert({ id: 1, ...input });
  if (error) throw error;
}

/** Publishes the locally edited brand draft so every visitor sees it. */
export async function publishBrandSettings(draft: Record<string, unknown>): Promise<void> {
  const { error } = await db().from("brand_settings").upsert({ id: 1, settings: draft });
  if (error) throw error;
}

export async function sendCustomerMessage(customerId: string, body: string): Promise<void> {
  const { error } = await db().rpc("send_customer_message", {
    p_customer_id: customerId,
    p_body: body,
  });
  if (error) throw error;
}

export async function setCustomerBlocked(customerId: string, blocked: boolean): Promise<void> {
  const { error } = await db()
    .from("profiles")
    .update({ is_blocked: blocked })
    .eq("id", customerId);
  if (error) throw error;
}

export async function saveCustomerNote(customerId: string, note: string): Promise<void> {
  const { error } = await db().from("customer_notes").upsert({ customer_id: customerId, note });
  if (error) throw error;
}

// ---------- Inventory (assumed model — confirm before backend work) ----------

export type InventoryUnit = "kg" | "g" | "l" | "ml" | "pcs" | "pack";

export type InventoryItem = {
  id: string;
  name: string;
  group: string;
  unit: InventoryUnit;
  quantity: number;
  /** At or below this quantity the item is flagged "low stock". */
  lowStockThreshold: number;
  updatedAt: string;
};

export type InventoryItemInput = Omit<InventoryItem, "id" | "updatedAt">;

export async function fetchInventory(): Promise<InventoryItem[]> {
  const { data, error } = await db().from("inventory_items").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as InventoryItem[];
}

export async function saveInventoryItem(
  id: string | null,
  input: InventoryItemInput,
): Promise<void> {
  const q = id
    ? db().from("inventory_items").update(input).eq("id", id)
    : db().from("inventory_items").insert(input);
  const { error } = await q;
  if (error) throw error;
}

export function isLowStock(item: Pick<InventoryItem, "quantity" | "lowStockThreshold">): boolean {
  return item.quantity <= item.lowStockThreshold;
}

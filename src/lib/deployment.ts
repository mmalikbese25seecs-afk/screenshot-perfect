/**
 * Deployment Configuration
 *
 * This file defines the architecture for separate customer and staff deployments.
 * In production, these are set via environment variables.
 *
 * Customer app:  VITE_PUBLIC_APP_URL (e.g. pindicrust.com)
 * Staff app:     VITE_STAFF_APP_URL  (e.g. staff.pindicrust.com)
 * App type:      VITE_APP_TYPE ("customer" | "staff")
 *
 * The frontend uses these to:
 * - Generate correct absolute URLs
 * - Know which routes belong to which deployment
 * - Avoid leaking staff routes into the customer app
 */

export type AppType = "customer" | "staff";

/** Get the app type from the environment. Falls back to 'customer'. */
export function getAppType(): AppType {
  try {
    const env = import.meta.env as Record<string, string | undefined>;
    const t = env["VITE_APP_TYPE"];
    if (t === "staff") return "staff";
  } catch {
    // SSR or non-Vite environment
  }
  return "customer";
}

export function isStaffApp(): boolean {
  return getAppType() === "staff";
}

export function isCustomerApp(): boolean {
  return getAppType() === "customer";
}

export function getPublicAppUrl(): string {
  try {
    const env = import.meta.env as Record<string, string | undefined>;
    if (env["VITE_PUBLIC_APP_URL"]) return env["VITE_PUBLIC_APP_URL"];
  } catch {
    // SSR or non-Vite environment
  }
  return "/";
}

export function getStaffAppUrl(): string {
  try {
    const env = import.meta.env as Record<string, string | undefined>;
    if (env["VITE_STAFF_APP_URL"]) return env["VITE_STAFF_APP_URL"];
  } catch {
    // SSR or non-Vite environment
  }
  return "/admin";
}

/**
 * Routes that belong exclusively to the customer application.
 * Staff routes should NOT appear in the customer app's route tree.
 */
export const CUSTOMER_ROUTES = [
  "/",
  "/menu",
  "/categories",
  "/product/",
  "/cart",
  "/checkout",
  "/order-success",
  "/orders",
  "/track",
  "/search",
  "/favorites",
  "/profile",
  "/addresses",
  "/notifications",
  "/reviews",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/receipt",
] as const;

/**
 * Routes that belong exclusively to the staff application.
 * These should be hidden from the customer app's navigation, sitemap, and robots.
 */
export const STAFF_ROUTES = [
  "/admin",
  "/admin/analytics",
  "/admin/reports",
  "/admin/orders",
  "/admin/pos",
  "/admin/customers",
  "/admin/reviews",
  "/admin/menu",
  "/admin/categories",
  "/admin/addons",
  "/admin/promotions",
  "/admin/advertisements",
  "/admin/brand",
  "/admin/themes",
  "/admin/store",
  "/admin/payments",
  "/admin/users",
  "/admin/logs",
  "/admin/maintenance",
] as const;

/**
 * Check if a given pathname is a staff route.
 */
export function isStaffRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

/**
 * Check if a given pathname is a customer route.
 */
export function isCustomerRoute(pathname: string): boolean {
  return !isStaffRoute(pathname);
}

export function getStaffLoginUrl(): string {
  return getStaffAppUrl();
}

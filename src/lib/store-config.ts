/**
 * Store / business configuration.
 *
 * Only genuine brand identity lives here as a constant. Every operational
 * business detail (phone, WhatsApp, email, address, hours, delivery radius,
 * merchant wallet numbers, branches) is intentionally UNSET until the backend
 * `store_info` / `branches` tables exist and an admin publishes real values.
 * UI must treat `null` as "not configured yet" and never invent a value.
 */

export type StoreInfo = {
  brand: string;
  tagline: string;
  phone: string | null;
  /** International format without "+", e.g. 923001234567. */
  whatsapp: string | null;
  email: string | null;
  merchantEasypaisa: string | null;
  merchantJazzcash: string | null;
  hours: string | null;
  address: string | null;
  deliveryRadius: string | null;
};

export type StoreBranch = { id: string; name: string; address: string; hours: string };

export const storeInfo: StoreInfo = {
  brand: "PINDI CRUST",
  tagline: "Artisanal Crust, Pure Happiness",
  phone: null,
  whatsapp: null,
  email: null,
  merchantEasypaisa: null,
  merchantJazzcash: null,
  hours: null,
  address: null,
  deliveryRadius: null,
};

/** Branch list — empty until branches are loaded from the backend. */
export const stores: StoreBranch[] = [];

export const NOT_CONFIGURED = "Not configured yet";

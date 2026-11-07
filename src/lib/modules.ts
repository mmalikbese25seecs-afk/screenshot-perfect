/**
 * Centralized Module & Permission Registry
 *
 * Architecture:
 *   Role → Permissions → Modules → Routes → UI
 *
 * Access must be EXPLICITLY granted. Absence = denied.
 * This is a UI-layer concern only — the backend must enforce
 * the actual authorization boundary when integrated.
 */

export type StaffRole = "developer" | "admin" | "manager";

export type ModuleId =
  | "dashboard"
  | "orders"
  | "pos"
  | "kitchen"
  | "products"
  | "categories"
  | "inventory"
  | "customers"
  | "analytics"
  | "reports"
  | "coupons"
  | "staff"
  | "themes"
  | "settings"
  | "developer"
  | "reviews"
  | "addons"
  | "advertisements"
  | "brand"
  | "store"
  | "payments";

export interface ModuleDef {
  id: ModuleId;
  label: string;
  icon: string;
  group: string;
  route: string;
  description: string;
}

export const allModules: ModuleDef[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    group: "Overview",
    route: "/admin",
    description: "Overview metrics and quick actions",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "BarChart3",
    group: "Overview",
    route: "/admin/analytics",
    description: "Charts, KPIs and trends",
  },
  {
    id: "reports",
    label: "Reports",
    icon: "FileBarChart",
    group: "Overview",
    route: "/admin/reports",
    description: "Generated reports and exports",
  },
  {
    id: "orders",
    label: "Orders",
    icon: "ClipboardList",
    group: "Operations",
    route: "/admin/orders",
    description: "Manage online and POS orders",
  },
  {
    id: "pos",
    label: "POS",
    icon: "ShoppingCart",
    group: "Operations",
    route: "/admin/pos",
    description: "Point of sale terminal",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    icon: "UtensilsCrossed",
    group: "Operations",
    route: "/admin/kitchen",
    description: "Kitchen display system",
  },
  {
    id: "customers",
    label: "Customers",
    icon: "Users",
    group: "Operations",
    route: "/admin/customers",
    description: "Customer management",
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: "Star",
    group: "Operations",
    route: "/admin/reviews",
    description: "Review moderation",
  },
  {
    id: "products",
    label: "Menu Management",
    icon: "UtensilsCrossed",
    group: "Catalogue",
    route: "/admin/menu",
    description: "Manage menu items",
  },
  {
    id: "categories",
    label: "Categories",
    icon: "LayoutGrid",
    group: "Catalogue",
    route: "/admin/categories",
    description: "Category management",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "Package",
    group: "Catalogue",
    route: "/admin/inventory",
    description: "Stock and ingredient tracking",
  },
  {
    id: "addons",
    label: "Add-ons",
    icon: "PlusSquare",
    group: "Catalogue",
    route: "/admin/addons",
    description: "Add-on management",
  },
  {
    id: "coupons",
    label: "Promotions",
    icon: "BadgePercent",
    group: "Growth",
    route: "/admin/promotions",
    description: "Coupons and promotions",
  },
  {
    id: "advertisements",
    label: "Advertisements",
    icon: "Megaphone",
    group: "Growth",
    route: "/admin/advertisements",
    description: "Ad management",
  },
  {
    id: "brand",
    label: "Brand Management",
    icon: "Brush",
    group: "Brand & Setup",
    route: "/admin/brand",
    description: "Brand identity, logo, CMS",
  },
  {
    id: "themes",
    label: "Theme Management",
    icon: "Palette",
    group: "Brand & Setup",
    route: "/admin/themes",
    description: "Colors, seasonal themes",
  },
  {
    id: "store",
    label: "Store Settings",
    icon: "Store",
    group: "Brand & Setup",
    route: "/admin/store",
    description: "Store info, hours, delivery",
  },
  {
    id: "payments",
    label: "Payment Settings",
    icon: "CreditCard",
    group: "Brand & Setup",
    route: "/admin/payments",
    description: "Payment gateway config",
  },
  {
    id: "staff",
    label: "Staff Management",
    icon: "UserCog",
    group: "Governance",
    route: "/admin/users",
    description: "Staff accounts and roles",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "Settings",
    group: "Governance",
    route: "/admin/settings",
    description: "Application settings",
  },
  {
    id: "developer",
    label: "Developer Tools",
    icon: "Code",
    group: "Developer",
    route: "/admin/developer",
    description: "System config, module management",
  },
];

/*
 * Default module permissions per role.
 * Developer tools are ONLY accessible to developer role.
 * Admin has broader access than manager.
 * These defaults can be overridden via the module toggles in Developer Tools.
 */
export const defaultRoleModules: Record<StaffRole, ModuleId[]> = {
  developer: [
    "dashboard",
    "analytics",
    "reports",
    "orders",
    "pos",
    "kitchen",
    "customers",
    "reviews",
    "products",
    "categories",
    "inventory",
    "addons",
    "coupons",
    "advertisements",
    "brand",
    "themes",
    "store",
    "payments",
    "staff",
    "settings",
    "developer",
  ],
  admin: [
    "dashboard",
    "analytics",
    "reports",
    "orders",
    "pos",
    "kitchen",
    "customers",
    "reviews",
    "products",
    "categories",
    "inventory",
    "addons",
    "coupons",
    "advertisements",
    "brand",
    "themes",
    "store",
    "payments",
    "settings",
  ],
  manager: [
    "dashboard",
    "orders",
    "pos",
    "kitchen",
    "customers",
    "reviews",
    "products",
    "categories",
  ],
};

/**
 * Check if a role has access to a specific module.
 */
export function hasModuleAccess(
  role: StaffRole,
  moduleId: ModuleId,
  customPermissions?: Record<StaffRole, ModuleId[]>,
): boolean {
  const perms = customPermissions ?? defaultRoleModules;
  return perms[role]?.includes(moduleId) ?? false;
}

/**
 * Get all modules accessible to a role.
 */
export function getAccessibleModules(
  role: StaffRole,
  customPermissions?: Record<StaffRole, ModuleId[]>,
): ModuleDef[] {
  const perms = customPermissions ?? defaultRoleModules;
  const allowed = new Set(perms[role] ?? []);
  return allModules.filter((m) => allowed.has(m.id));
}

/**
 * Get modules grouped for navigation display.
 */
export function getModuleGroups(
  role: StaffRole,
  customPermissions?: Record<StaffRole, ModuleId[]>,
): { group: string; modules: ModuleDef[] }[] {
  const accessible = getAccessibleModules(role, customPermissions);
  const groups = new Map<string, ModuleDef[]>();
  for (const mod of accessible) {
    const list = groups.get(mod.group) ?? [];
    list.push(mod);
    groups.set(mod.group, list);
  }
  return Array.from(groups.entries()).map(([group, modules]) => ({ group, modules }));
}

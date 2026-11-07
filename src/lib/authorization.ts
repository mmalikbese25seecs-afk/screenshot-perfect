/**
 * Centralized Authorization Utilities
 *
 * IMPORTANT: These are UI-only controls. They control visibility and
 * navigation but do NOT constitute actual security. The backend
 * must enforce authorization when integrated.
 *
 * Architecture:
 *   Authentication → Identity → Role → Permission → Module → Route → Page → API
 */

import type { StaffRole, ModuleId } from "./modules";
import {
  hasModuleAccess,
  getAccessibleModules,
  getModuleGroups,
  allModules,
  defaultRoleModules,
} from "./modules";
import type { ModuleDef } from "./modules";

export type { StaffRole, ModuleId, ModuleDef };
export { hasModuleAccess, getAccessibleModules, getModuleGroups, allModules, defaultRoleModules };

/**
 * Result of an authorization check.
 */
export type AuthResult =
  { allowed: true } | { allowed: false; reason: "unauthenticated" | "unauthorized" | "forbidden" };

/**
 * Check if a user is authenticated (not a guest).
 * UI-side only — backend must verify session/token.
 */
export function isAuthenticated(role: string): boolean {
  return role !== "guest";
}

/**
 * Check if user has a specific staff role.
 */
export function hasRole(userRole: string, requiredRole: StaffRole): boolean {
  return userRole === requiredRole;
}

/**
 * Check if user is any staff role (admin, manager, or developer).
 */
export function isStaffRole(role: string): role is StaffRole {
  return role === "admin" || role === "manager" || role === "developer";
}

/**
 * Check if a staff member can access a specific module.
 */
export function canAccessModule(role: StaffRole, moduleId: ModuleId): boolean {
  return hasModuleAccess(role, moduleId);
}

/**
 * Perform a full authorization check for a route/module.
 * Returns structured result instead of boolean for proper UI handling.
 */
export function authorize(
  userRole: string,
  options: {
    requireAuth?: boolean;
    requireStaff?: boolean;
    requireRole?: StaffRole;
    requireModule?: ModuleId;
  },
): AuthResult {
  const { requireAuth = true, requireStaff = false, requireRole, requireModule } = options;

  if (requireAuth && !isAuthenticated(userRole)) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (requireStaff && !isStaffRole(userRole)) {
    return { allowed: false, reason: "unauthorized" };
  }

  if (requireRole && userRole !== requireRole) {
    return { allowed: false, reason: "unauthorized" };
  }

  if (requireModule && isStaffRole(userRole)) {
    if (!canAccessModule(userRole, requireModule)) {
      return { allowed: false, reason: "forbidden" };
    }
  }

  return { allowed: true };
}

/* ------------------------------------------------------------------ */
/*  Convenience wrappers for direct use in components                  */
/* ------------------------------------------------------------------ */

/**
 * requireAuth() — returns the auth result for a route that needs any authenticated user.
 * Usage: const result = requireAuth(role);
 */
export function requireAuth(userRole: string): AuthResult {
  return authorize(userRole, { requireAuth: true });
}

/**
 * requireRole() — returns the auth result for a route that needs a specific staff role.
 * Usage: const result = requireRole(role, "admin");
 */
export function requireRole(userRole: string, requiredRole: StaffRole): AuthResult {
  return authorize(userRole, { requireAuth: true, requireStaff: true, requireRole: requiredRole });
}

/**
 * requirePermission() — alias for requireRole (semantic clarity).
 * Usage: const result = requirePermission(role, "developer");
 */
export const requirePermission = requireRole;

/**
 * requireModule() — returns the auth result for a route protected by module access.
 * Usage: const result = requireModule(role, "analytics");
 */
export function requireModule(userRole: string, moduleId: ModuleId): AuthResult {
  return authorize(userRole, { requireAuth: true, requireStaff: true, requireModule: moduleId });
}

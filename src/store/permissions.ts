import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StaffRole, ModuleId } from "@/lib/modules";
import { defaultRoleModules } from "@/lib/modules";

// Role assignment used to live here as a client-only mock. That's now
// real — see profiles.role in Supabase, managed via admin.developer.tsx /
// admin.users.tsx (lib/auth-api.ts). This store is left with just module
// visibility: which admin-sidebar modules each role can see. That's a
// UI-only preference (not a security boundary), so it's fine to keep
// local to this admin's browser.

type PermissionsState = {
  modulePermissions: Record<StaffRole, ModuleId[]>;
  toggleModule: (role: StaffRole, moduleId: ModuleId) => void;
};

export const usePermissions = create<PermissionsState>()(
  persist(
    (set) => ({
      modulePermissions: defaultRoleModules,
      toggleModule: (role, moduleId) =>
        set((s) => {
          const current = s.modulePermissions[role] ?? [];
          const has = current.includes(moduleId);
          return {
            modulePermissions: {
              ...s.modulePermissions,
              [role]: has ? current.filter((m) => m !== moduleId) : [...current, moduleId],
            },
          };
        }),
    }),
    { name: "pindi-permissions" },
  ),
);

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wrench } from "lucide-react";
import { SiteHeader } from "@/components/customer/SiteHeader";
import { SiteFooter } from "@/components/customer/SiteFooter";
import { WhatsAppFab } from "@/components/customer/WhatsAppFab";
import { InstallPrompt } from "@/components/customer/InstallPrompt";
import { MobileTabBar } from "@/components/customer/MobileTabBar";
import { BackendPreviewBanner } from "@/components/shared/BackendNotice";
import { fetchMaintenanceSettings } from "@/lib/api";
import { isStaff, useAuth } from "@/store/auth";

export const Route = createFileRoute("/_shop")({
  component: ShopLayout,
});

function ShopLayout() {
  // Published maintenance setting (null when no backend / not set). Staff still see the store.
  const { data: maintenance } = useQuery({
    queryKey: ["maintenance-settings"],
    queryFn: fetchMaintenanceSettings,
    staleTime: 60_000,
  });
  const role = useAuth((s) => s.role);
  const paused = !!maintenance?.enabled && !isStaff(role);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BackendPreviewBanner />
      <SiteHeader />
      <main className="flex-1 pb-20 sm:pb-0">
        {paused ? (
          <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
            <span className="bg-primary-soft grid size-16 place-items-center rounded-2xl text-primary">
              <Wrench className="size-8" />
            </span>
            <h1 className="font-display mt-6 text-3xl font-bold">We'll be right back</h1>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">{maintenance?.message}</p>
            {maintenance?.eta && (
              <p className="mt-3 text-xs font-semibold text-primary">Back at {maintenance.eta}</p>
            )}
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <SiteFooter />
      <WhatsAppFab />
      <InstallPrompt />
      <MobileTabBar />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/store/permissions";
import { allModules, type ModuleId } from "@/lib/modules";
import {
  type Profile,
  type StaffRole,
  fetchStaffProfiles,
  findProfileByEmail,
  updateProfileRole,
} from "@/lib/auth-api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/developer")({
  head: () => ({
    meta: [
      { title: "Developer Tools — PINDI CRUST Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DeveloperPage,
});

const staffRoles: StaffRole[] = ["developer", "admin", "manager"];

function DeveloperPage() {
  const { modulePermissions, toggleModule } = usePermissions();
  const currentUserId = useAuth((s) => s.userId);

  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("manager");
  const [assigning, setAssigning] = useState(false);

  const loadStaff = () => {
    setLoading(true);
    fetchStaffProfiles()
      .then(setStaff)
      .catch(() => toast.error("Couldn't load staff accounts"))
      .finally(() => setLoading(false));
  };

  useEffect(loadStaff, []);

  const handleAssign = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setAssigning(true);
    try {
      const profile = await findProfileByEmail(trimmed);
      if (!profile) {
        toast.error("No account with that email yet — they need to sign up at /register first");
        return;
      }
      await updateProfileRole(profile.id, role);
      toast.success(`${trimmed} set to ${role}`);
      setEmail("");
      loadStaff();
    } catch {
      toast.error("Couldn't update that account's role");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (p: Profile) => {
    try {
      await updateProfileRole(p.id, "customer");
      toast.success(`${p.email} is no longer staff`);
      setStaff((prev) => prev.filter((s) => s.id !== p.id));
    } catch {
      toast.error("Couldn't remove that account's staff access");
    }
  };

  return (
    <AdminPage
      title="Developer Tools"
      subtitle="Assign staff roles by email and control which modules each role can see."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role assignment */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <h2 className="font-display text-lg font-bold">Role assignments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email of someone who already has an account — they'll get staff access on
            their next sign-in.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              aria-label="Email to assign a role"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
              <SelectTrigger className="w-32" aria-label="Role to assign">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {staffRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9 shrink-0" onClick={handleAssign} disabled={assigning}>
              <UserPlus className="mr-1 size-4" />
              Assign
            </Button>
          </div>

          <ul className="mt-4 divide-y divide-border">
            {loading && <li className="py-3 text-sm text-muted-foreground">Loading…</li>}
            {!loading && staff.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">No staff accounts yet.</li>
            )}
            {staff.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.email}</p>
                  <Badge variant="outline" className="mt-0.5 capitalize">
                    {p.role}
                  </Badge>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8 shrink-0 text-destructive"
                  aria-label={`Remove ${p.email}`}
                  disabled={p.id === currentUserId}
                  title={p.id === currentUserId ? "You can't remove your own access" : undefined}
                  onClick={() => handleRemove(p)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </section>

        {/* Module permissions */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <h2 className="font-display text-lg font-bold">Module visibility</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose which modules each role can see in the admin sidebar.
          </p>

          <div className="mt-4 space-y-5">
            {staffRoles.map((r) => (
              <div key={r}>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {r}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {allModules.map((mod) => {
                    const enabled = modulePermissions[r]?.includes(mod.id as ModuleId);
                    const locked = r !== "developer" && mod.id === "developer";
                    return (
                      <button
                        key={mod.id}
                        disabled={locked}
                        onClick={() => toggleModule(r, mod.id as ModuleId)}
                        className={cn(
                          "truncate rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition-colors",
                          enabled
                            ? "border-transparent bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:text-foreground",
                          locked && "cursor-not-allowed opacity-50",
                        )}
                        title={locked ? "Developer Tools is always developer-only" : mod.label}
                      >
                        {mod.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminPage>
  );
}

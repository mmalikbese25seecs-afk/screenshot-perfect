import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { KeyRound, Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Profile,
  type StaffRole,
  fetchStaffProfiles,
  findProfileByEmail,
  updateProfileRole,
} from "@/lib/auth-api";
import { errorMessage, requestPasswordReset } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Manage staff accounts, roles and permissions for the PINDI CRUST console.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "User Management — PINDI CRUST Admin" },
      { property: "og:description", content: "Staff accounts, roles and access control." },
    ],
  }),
  component: UsersPage,
});

const roleTone: Record<StaffRole, string> = {
  admin: "bg-primary-soft text-primary",
  developer: "bg-primary-soft text-primary",
  manager: "bg-warning/15 text-warning",
};

const staffRoles: StaffRole[] = ["manager", "admin", "developer"];

const permissions = [
  { label: "View dashboard & analytics", admin: true, manager: true },
  { label: "Manage orders & POS", admin: true, manager: true },
  { label: "Edit menu, categories & add-ons", admin: true, manager: true },
  { label: "Delete protected resources", admin: true, manager: false },
  { label: "Manage admin accounts", admin: true, manager: false },
  { label: "Change passkeys & payment credentials", admin: true, manager: false },
  { label: "Modify protected store settings", admin: true, manager: false },
];

function UsersPage() {
  const { role, userId: currentUserId } = useAuth();
  const canManage = role === "admin" || role === "developer";
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ email: "", role: "manager" as StaffRole });
  const [saving, setSaving] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    fetchStaffProfiles()
      .then(setUsers)
      .catch(() => toast.error("Couldn't load staff accounts"))
      .finally(() => setLoading(false));
  };

  useEffect(loadUsers, []);

  const promote = async () => {
    if (!draft.email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    try {
      const profile = await findProfileByEmail(draft.email.trim());
      if (!profile) {
        toast.error("No account with that email yet — they need to sign up at /register first");
        return;
      }
      await updateProfileRole(profile.id, draft.role);
      setDraft({ email: "", role: "manager" });
      setOpen(false);
      toast.success(`${profile.email} is now ${draft.role}`);
      loadUsers();
    } catch {
      toast.error("Couldn't update that account's role");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u: Profile) => {
    try {
      await updateProfileRole(u.id, "customer");
      setUsers((p) => p.filter((x) => x.id !== u.id));
      toast.success("Staff access removed");
    } catch {
      toast.error("Couldn't remove that account's staff access");
    }
  };

  return (
    <AdminPage
      title="User Management"
      subtitle="Staff accounts and what each role is allowed to do."
      action={
        <Button
          variant="hero"
          className="gap-1.5"
          disabled={!canManage}
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" /> Promote to staff
        </Button>
      }
    >
      {!canManage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <Lock className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="text-xs font-semibold">
            Manager access — you can view staff but cannot promote, remove or modify staff accounts.
          </p>
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : users.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No staff accounts yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => (
            <article
              key={u.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <span className="bg-primary-soft grid size-11 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-primary">
                  {(u.name || u.email).slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{u.name || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold capitalize",
                    roleTone[u.role as StaffRole],
                  )}
                >
                  {u.role}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  disabled={!canManage}
                  onClick={async () => {
                    try {
                      await requestPasswordReset(u.email, `${window.location.origin}/login`);
                      toast.success(`Reset link sent to ${u.email}`);
                    } catch (err) {
                      toast.error(errorMessage(err));
                    }
                  }}
                >
                  <KeyRound className="size-3.5" /> Reset passkey
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${u.email}`}
                  disabled={!canManage || u.role === "admin" || u.id === currentUserId}
                  title={u.id === currentUserId ? "You can't remove your own access" : undefined}
                  onClick={() => remove(u)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center gap-2.5 border-b border-border p-5">
          <span className="bg-primary-soft grid size-9 place-items-center rounded-xl text-primary">
            <ShieldCheck className="size-4.5" />
          </span>
          <h2 className="font-display text-base font-bold">Role permissions</h2>
        </div>
        <ul className="divide-y divide-border">
          {permissions.map((p) => (
            <li
              key={p.label}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-5 py-3 text-sm"
            >
              <span className="min-w-0 text-pretty">{p.label}</span>
              <PermPill ok={p.admin} label="Admin" />
              <PermPill ok={p.manager} label="Manager" />
            </li>
          ))}
        </ul>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote to staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              They need an existing account first — ask them to sign up at /register, then enter the
              email they used below.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">Email</Label>
              <Input
                id="u-email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={draft.role}
                onValueChange={(v) => setDraft({ ...draft, role: v as StaffRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staffRoles.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={promote} disabled={saving}>
              Set role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function PermPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
        ok ? "bg-success/15 text-success" : "bg-muted text-muted-foreground line-through",
      )}
    >
      {label}
    </span>
  );
}

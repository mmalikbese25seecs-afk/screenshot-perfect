import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Banknote, CreditCard, QrCode, Save, Smartphone } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage, savePaymentSettings } from "@/lib/api";
import { DraftNotice } from "@/components/shared/BackendNotice";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payment Settings — PINDI CRUST Admin" },
      {
        name: "description",
        content:
          "Configure Cash on Delivery, EasyPaisa and JazzCash merchant numbers and QR codes.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Payment Settings — PINDI CRUST Admin" },
      {
        property: "og:description",
        content: "Manage accepted payment methods and merchant details.",
      },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const isManager = useAuth((s) => s.role) === "manager";
  const [cod, setCod] = useState(true);
  const [easypaisa, setEasypaisa] = useState(true);
  const [jazzcash, setJazzcash] = useState(true);
  const [epNumber, setEpNumber] = useState("");
  const [jcNumber, setJcNumber] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [saving, setSaving] = useState(false);

  const WALLET_RE = /^03\d{2}-?\d{7}$/;
  const save = async () => {
    if (easypaisa && !WALLET_RE.test(epNumber.trim())) {
      toast.error("Enter a valid EasyPaisa number, e.g. 03XX-XXXXXXX");
      return;
    }
    if (jazzcash && !WALLET_RE.test(jcNumber.trim())) {
      toast.error("Enter a valid JazzCash number, e.g. 03XX-XXXXXXX");
      return;
    }
    if (minOrder && (Number.isNaN(Number(minOrder)) || Number(minOrder) < 0)) {
      toast.error("Minimum order must be 0 or more");
      return;
    }
    setSaving(true);
    try {
      await savePaymentSettings({
        codEnabled: cod,
        easypaisaEnabled: easypaisa,
        easypaisaNumber: epNumber.trim(),
        jazzcashEnabled: jazzcash,
        jazzcashNumber: jcNumber.trim(),
        cardEnabled: false,
      });
      toast.success("Payment settings saved");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  const [instructions, setInstructions] = useState(
    "Send the exact total to the merchant number, then paste the Transaction ID before placing your order.",
  );

  return (
    <AdminPage
      title="Payment Settings"
      subtitle="Control which payment methods customers see at checkout."
      action={
        <Button variant="hero" className="gap-1.5" disabled={saving} onClick={save}>
          <Save className="size-4" /> Save changes
        </Button>
      }
    >
      <DraftNotice />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <span className="bg-primary-soft grid size-10 shrink-0 place-items-center rounded-xl text-primary">
              <Banknote className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display truncate text-base font-bold">Cash on Delivery</h2>
              <p className="text-xs text-muted-foreground">No transaction ID required.</p>
            </div>
            <Switch checked={cod} onCheckedChange={setCod} aria-label="Toggle cash on delivery" />
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="min-order">Minimum order value (Rs)</Label>
            <Input
              id="min-order"
              type="number"
              min={0}
              placeholder="Not set"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
            />
          </div>
        </section>

        {[
          ["EasyPaisa", easypaisa, setEasypaisa, epNumber, setEpNumber] as const,
          ["JazzCash", jazzcash, setJazzcash, jcNumber, setJcNumber] as const,
        ].map(([name, enabled, setEnabled, number, setNumber]) => (
          <section key={name} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <span className="bg-primary-soft grid size-10 shrink-0 place-items-center rounded-xl text-primary">
                <Smartphone className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display truncate text-base font-bold">{name}</h2>
                <p className="text-xs text-muted-foreground">Transaction ID is mandatory.</p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                aria-label={`Toggle ${name}`}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-1.5">
                <Label htmlFor={`${name}-number`}>Merchant number</Label>
                <Input
                  id={`${name}-number`}
                  placeholder="03XX-XXXXXXX"
                  inputMode="tel"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Shown to customers at checkout.</p>
              </div>
              <div className="grid size-24 place-items-center rounded-xl border border-dashed border-border bg-surface text-muted-foreground">
                <QrCode className="size-8" />
              </div>
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary-soft grid size-9 place-items-center rounded-xl text-primary">
              <CreditCard className="size-4.5" />
            </span>
            <h2 className="font-display text-base font-bold">Checkout instructions</h2>
          </div>
          <Textarea
            className="mt-4"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            aria-label="Checkout payment instructions"
          />
          {isManager && (
            <p className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
              Manager access — merchant credentials and passkeys are locked to administrators.
            </p>
          )}
        </section>
      </div>
    </AdminPage>
  );
}

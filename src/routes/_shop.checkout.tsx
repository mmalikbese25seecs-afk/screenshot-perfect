import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Banknote, MapPin, QrCode, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cartSubtotal, useCart } from "@/store/cart";
import { formatPKR } from "@/lib/format";
import { DELIVERY_FEE, computeTotals, taxLabel } from "@/lib/pricing";
import { storeInfo } from "@/lib/store-config";
import { cartToOrderLines, errorMessage, fetchSavedAddresses, placeOrder } from "@/lib/api";
import { fetchMyProfile } from "@/lib/auth-api";
import { useAuth } from "@/store/auth";

const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80, "That name is too long"),
    phone: z
      .string()
      .trim()
      .min(9, "Enter a valid phone number")
      .max(20, "That phone number is too long")
      .regex(/^[0-9+\-\s()]+$/, "Use digits only, e.g. +92 300 1234567"),
    addressId: z.string().min(1, "Select or add an address"),
    newAddress: z.string().max(300, "Address is too long").optional(),
    notes: z.string().max(300, "Notes are too long").optional(),
    payment: z.enum(["cod", "easypaisa", "jazzcash"]),
    transactionId: z.string().max(40, "Transaction ID is too long").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.addressId === "new" && !data.newAddress?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["newAddress"],
        message: "Enter your delivery address",
      });
    }
    if (data.payment !== "cod" && !data.transactionId?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["transactionId"],
        message: "Transaction ID is required",
      });
    }
  });

type CheckoutForm = z.infer<typeof checkoutSchema>;

export const Route = createFileRoute("/_shop/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — PINDI CRUST" },
      {
        name: "description",
        content: "Confirm delivery details and payment method to complete your PINDI CRUST order.",
      },
      { property: "og:title", content: "Checkout — PINDI CRUST" },
      { property: "og:description", content: "Fast, secure checkout for hearth-baked favourites." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const lines = useCart((s) => s.lines);
  const promo = useCart((s) => s.promo);
  const clear = useCart((s) => s.clear);
  const navigate = Route.useNavigate();
  const userId = useAuth((s) => s.userId);
  const accountName = useAuth((s) => s.name);

  // Saved addresses and the phone number belong to a signed-in account. Guests just type them in.
  const { data: addresses = [] } = useQuery({
    queryKey: ["saved-addresses", userId],
    queryFn: fetchSavedAddresses,
    enabled: !!userId,
  });
  const { data: profile } = useQuery({
    queryKey: ["me", userId],
    queryFn: fetchMyProfile,
    enabled: !!userId,
  });

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      phone: "",
      addressId: "new",
      newAddress: "",
      notes: "",
      payment: "cod",
      transactionId: "",
    },
  });

  // Fill in what we already know, without overwriting anything the customer has typed.
  useEffect(() => {
    if (!userId) return;
    if (!form.getValues("name") && accountName && accountName !== "Guest")
      form.setValue("name", accountName);
    if (!form.getValues("phone") && profile?.phone) form.setValue("phone", profile.phone);
  }, [userId, accountName, profile, form]);

  useEffect(() => {
    const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (
      preferred &&
      form.getValues("addressId") === "new" &&
      !form.formState.dirtyFields.addressId
    ) {
      form.setValue("addressId", preferred.id);
    }
  }, [addresses, form]);

  const payment = form.watch("payment");
  const addressId = form.watch("addressId");

  // Preview only. The database recalculates everything when the order is placed.
  const { subtotal, discount, tax, deliveryFee, total } = computeTotals(cartSubtotal(lines), promo);

  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: CheckoutForm) {
    const address =
      values.addressId === "new"
        ? (values.newAddress ?? "")
        : (addresses.find((a) => a.id === values.addressId)?.line ?? "");

    setSubmitting(true);
    try {
      const placed = await placeOrder({
        customerName: values.name,
        phone: values.phone,
        address,
        payment: values.payment,
        source: "online",
        notes: values.notes,
        transactionId: values.payment === "cod" ? undefined : values.transactionId,
        promoCode: promo?.code ?? null,
        lines: cartToOrderLines(lines),
      });
      clear();
      toast.success("Order placed successfully!");
      navigate({ to: "/order-success", search: { orderId: placed.orderNumber } });
    } catch (err) {
      console.error(err);
      toast.error(errorMessage(err, "Couldn't place your order. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add something delicious before checking out.
        </p>
        <Button asChild variant="hero" className="mt-5">
          <Link to="/menu" search={{ category: undefined, sort: "popularity" as const }}>
            Browse Menu
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-2xl leading-tight font-bold sm:text-4xl">Checkout</h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
        >
          <div className="space-y-6">
            {/* Delivery details */}
            <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-bold">
                <MapPin className="size-4 text-primary" /> Delivery Details
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Ayesha Khan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+92 300 1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="addressId"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Delivery Address</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="gap-2"
                      >
                        {addresses.map((a) => (
                          <Label
                            key={a.id}
                            htmlFor={a.id}
                            className="flex min-w-0 items-start gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5 has-[[data-state=checked]]:border-primary"
                          >
                            <RadioGroupItem value={a.id} id={a.id} className="mt-0.5" />
                            <span className="min-w-0">
                              <span className="block text-sm font-bold">{a.label}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {a.line}
                              </span>
                            </span>
                          </Label>
                        ))}
                        <Label
                          htmlFor="new"
                          className="flex min-w-0 items-start gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5 has-[[data-state=checked]]:border-primary"
                        >
                          <RadioGroupItem value="new" id="new" className="mt-0.5" />
                          <span className="text-sm font-bold">Add a new address</span>
                        </Label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AnimatePresence>
                {addressId === "new" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <FormField
                      control={form.control}
                      name="newAddress"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>New Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="House, street, area, city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Order Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ring the bell, less spicy, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Payment */}
            <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
              <h2 className="text-sm font-bold">Payment Method</h2>
              <FormField
                control={form.control}
                name="payment"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="gap-2"
                      >
                        {[
                          { id: "cod", label: "Cash on Delivery", icon: Banknote },
                          { id: "easypaisa", label: "EasyPaisa", icon: Smartphone },
                          { id: "jazzcash", label: "JazzCash", icon: Smartphone },
                        ].map((m) => (
                          <Label
                            key={m.id}
                            htmlFor={m.id}
                            className="flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5 has-[[data-state=checked]]:border-primary"
                          >
                            <RadioGroupItem value={m.id} id={m.id} />
                            <m.icon className="size-4 shrink-0 text-primary" />
                            <span className="text-sm font-semibold">{m.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <AnimatePresence>
                {payment !== "cod" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 rounded-2xl bg-primary-soft p-4">
                      <p className="text-sm font-bold text-primary">
                        Send payment to {payment === "easypaisa" ? "EasyPaisa" : "JazzCash"}
                      </p>
                      <p className="mt-1 font-display text-lg font-bold">
                        {(payment === "easypaisa"
                          ? storeInfo.merchantEasypaisa
                          : storeInfo.merchantJazzcash) ?? "Merchant number not configured"}
                      </p>
                      <div className="mt-3 grid size-28 place-items-center rounded-xl border border-dashed border-primary/40 bg-card">
                        <QrCode className="size-14 text-primary/60" />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Scan the QR or send manually, then enter your transaction ID below.
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="transactionId"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Transaction ID</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. TXN123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          {/* Order summary */}
          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
              <h2 className="text-sm font-bold">Order Summary</h2>
              <ul className="mt-3 space-y-2">
                {lines.map((l) => (
                  <li
                    key={l.key}
                    className="flex min-w-0 items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate text-muted-foreground">
                      {l.qty} × {l.name}
                    </span>
                    <span className="shrink-0 font-semibold">{formatPKR(l.unitPrice * l.qty)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-semibold">{formatPKR(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Discount</dt>
                    <dd className="font-semibold text-primary">-{formatPKR(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery Fee</dt>
                  <dd className="font-semibold">
                    {DELIVERY_FEE === null ? "Not configured" : formatPKR(deliveryFee)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{taxLabel()}</dt>
                  <dd className="font-semibold">{formatPKR(tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-bold">
                  <dt>Total</dt>
                  <dd className="font-display text-lg text-primary">{formatPKR(total)}</dd>
                </div>
              </dl>
            </div>
            <Button
              type="submit"
              size="lg"
              variant="hero"
              className="w-full min-h-12"
              disabled={submitting}
            >
              {submitting ? "Placing Order…" : "Place Order"}
            </Button>
          </aside>
        </form>
      </Form>
    </div>
  );
}

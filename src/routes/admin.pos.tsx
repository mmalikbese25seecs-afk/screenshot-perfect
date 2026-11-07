import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/shared/BackendNotice";
import {
  Banknote,
  Lock,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
} from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { errorMessage, fetchCategories, fetchProducts, placeOrder } from "@/lib/api";
import { formatPKR } from "@/lib/format";
import { storeInfo } from "@/lib/store-config";
import type { Product } from "@/lib/types";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/admin/pos")({
  head: () => ({
    meta: [
      { title: "POS — PINDI CRUST Admin" },
      {
        name: "description",
        content: "Fast cashier point-of-sale for walk-in and dine-in orders at PINDI CRUST.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "POS — PINDI CRUST Admin" },
      { property: "og:description", content: "PINDI CRUST cashier terminal for in-store sales." },
    ],
  }),
  component: PosPage,
});

type CartLine = { product: Product; qty: number };
type PosPayment = "cash" | "easypaisa" | "jazzcash";

/** The POS says "cash"; the database's payment enum calls it "cod". */
const paymentToDb = { cash: "cod", easypaisa: "easypaisa", jazzcash: "jazzcash" } as const;

/** Fixed manual discount available to admins. The database enforces who may use it. */
const MANUAL_DISCOUNT_PERCENT = 10;

type Sale = {
  orderNumber: string;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  payment: PosPayment;
  at: Date;
};

function PosPage() {
  const role = useAuth((s) => s.role);
  const canDiscount = role === "admin" || role === "developer";
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading: productsLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountOn, setDiscountOn] = useState(false);
  const [payment, setPayment] = useState<PosPayment>("cash");
  const [charging, setCharging] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = category === "all" || p.category === category;
      const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [products, category, query]);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === p.id);
      if (existing) {
        return prev.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product: p, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const removeLine = (id: string) => setCart((prev) => prev.filter((l) => l.product.id !== id));

  // Preview only: the database recalculates from live prices when the sale is charged.
  const subtotal = cart.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const discount = discountOn ? Math.round((subtotal * MANUAL_DISCOUNT_PERCENT) / 100) : 0;
  const total = Math.max(subtotal - discount, 0);

  const toggleDiscount = () => {
    if (!canDiscount) return;
    setDiscountOn((v) => !v);
  };

  const charge = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (charging) return;
    setCharging(true);
    try {
      const placed = await placeOrder({
        customerName: "Walk-in",
        phone: "",
        address: "",
        payment: paymentToDb[payment],
        source: "pos",
        manualDiscountPercent: discountOn ? MANUAL_DISCOUNT_PERCENT : 0,
        lines: cart.map((l) => ({ productId: l.product.id, qty: l.qty, addOnIds: [] })),
      });
      setSale({
        orderNumber: placed.orderNumber,
        lines: cart,
        subtotal: placed.subtotal,
        discount: placed.discount,
        total: placed.total,
        payment,
        at: new Date(),
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Order ${placed.orderNumber} charged via ${payment}`);
    } catch (err) {
      console.error(err);
      toast.error(errorMessage(err, "Couldn't complete the sale. Nothing was charged."));
    } finally {
      setCharging(false);
    }
  };

  const resetSale = () => {
    setCart([]);
    setDiscountOn(false);
    setSale(null);
  };

  return (
    <AdminPage title="Point of Sale" subtitle="Ring up walk-in and dine-in orders instantly.">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setCategory("all")}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                category === "all"
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.slug)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  category === c.slug
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          {isError && <QueryErrorState className="mt-4" error={error} label="the menu" />}
          {productsLoading && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-2.5 text-center shadow-soft transition-shadow hover:shadow-lift"
              >
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                ) : (
                  <span className="aspect-square w-full rounded-xl bg-muted" />
                )}
                <p className="w-full truncate text-xs font-bold">{p.name}</p>
                <p className="text-[11px] font-semibold text-primary">{formatPKR(p.price)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-lift">
            <div className="flex items-center justify-between">
              <h2 className="font-display flex items-center gap-2 text-lg font-bold">
                <ShoppingCart className="size-5" /> Cart
              </h2>
              <Badge variant="secondary">{cart.length} items</Badge>
            </div>

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto no-scrollbar">
              {cart.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Tap a product to add it
                </p>
              )}
              {cart.map((l) => (
                <div
                  key={l.product.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{l.product.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatPKR(l.product.price)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      aria-label={`Decrease ${l.product.name}`}
                      onClick={() => updateQty(l.product.id, -1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-5 text-center text-xs font-bold">{l.qty}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      aria-label={`Increase ${l.product.name}`}
                      onClick={() => updateQty(l.product.id, 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive"
                      aria-label={`Remove ${l.product.name}`}
                      onClick={() => removeLine(l.product.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant={discountOn ? "secondary" : "outline"}
              className="mt-3 w-full gap-2"
              disabled={!canDiscount || cart.length === 0}
              onClick={toggleDiscount}
              title={canDiscount ? undefined : "Only an admin can apply a discount"}
            >
              <Lock className="size-3.5" />
              {discountOn
                ? `Remove ${MANUAL_DISCOUNT_PERCENT}% discount`
                : `Apply ${MANUAL_DISCOUNT_PERCENT}% discount`}
              {!canDiscount && (
                <Badge variant="outline" className="ml-1 text-[10px]">
                  Admin only
                </Badge>
              )}
            </Button>

            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPKR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-{formatPKR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatPKR(total)}</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: "cash", label: "Cash", icon: Banknote },
                  { id: "easypaisa", label: "EasyPaisa", icon: Smartphone },
                  { id: "jazzcash", label: "JazzCash", icon: Smartphone },
                ] as { id: PosPayment; label: string; icon: typeof Banknote }[]
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPayment(m.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-semibold transition-colors",
                    payment === m.id
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  <m.icon className="size-4" />
                  {m.label}
                </button>
              ))}
            </div>

            <Button variant="hero" className="mt-3 w-full" onClick={charge} disabled={charging}>
              {charging ? "Charging…" : `Charge ${formatPKR(total)}`}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={!!sale}
        onOpenChange={(v) => {
          if (!v) resetSale();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-4" /> Receipt
            </DialogTitle>
          </DialogHeader>
          {sale && (
            <div className="rounded-xl border border-dashed border-border bg-surface p-4 font-mono text-xs leading-relaxed">
              <p className="text-center font-display text-sm font-bold">{storeInfo.brand}</p>
              <p className="text-center text-muted-foreground">{storeInfo.tagline}</p>
              {storeInfo.address && (
                <p className="text-center text-muted-foreground">{storeInfo.address}</p>
              )}
              <div className="my-2 border-t border-dashed border-border" />
              <p>Order: {sale.orderNumber}</p>
              <p>Date: {sale.at.toLocaleString()}</p>
              <p>Payment: {sale.payment}</p>
              <div className="my-2 border-t border-dashed border-border" />
              {sale.lines.map((l) => (
                <div key={l.product.id} className="flex justify-between">
                  <span>
                    {l.qty}× {l.product.name}
                  </span>
                  <span>{formatPKR(l.product.price * l.qty)}</span>
                </div>
              ))}
              <div className="my-2 border-t border-dashed border-border" />
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPKR(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{formatPKR(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPKR(sale.total)}</span>
              </div>
              <p className="mt-3 text-center">Thank you for choosing {storeInfo.brand}!</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={resetSale} className="w-full">
              New sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

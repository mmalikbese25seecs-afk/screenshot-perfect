import { useEffect, useRef, useState } from "react";
import {
  Banknote,
  Check,
  ChevronDown,
  Clock,
  MessageCircle,
  Phone,
  Printer,
  Smartphone,
  Trash2,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

export interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
  onPrint?: (orderId: string) => void;
  onDelete?: (orderId: string) => void;
  onWhatsApp?: (orderId: string) => void;
  isManager?: boolean;
}

const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  baking: "Baking",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusBadge: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  preparing: "bg-chart-2/15 text-chart-2",
  baking: "bg-accent/15 text-accent-foreground",
  out_for_delivery: "bg-chart-4/15 text-chart-4",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

const allStatuses: OrderStatus[] = [
  "pending",
  "preparing",
  "baking",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const paymentIcon: Record<string, typeof Banknote> = {
  cod: Banknote,
  easypaisa: Smartphone,
  jazzcash: Smartphone,
};

const paymentLabel: Record<string, string> = {
  cod: "Cash on Delivery",
  easypaisa: "EasyPaisa",
  jazzcash: "JazzCash",
};

export function OrderCard({
  order,
  onStatusChange,
  onPrint,
  onDelete,
  onWhatsApp,
  isManager = false,
}: OrderCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [dropdownOpen]);

  const PaymentIcon = paymentIcon[order.payment] ?? Banknote;
  const isDelivery =
    order.address &&
    !order.address.toLowerCase().startsWith("takeaway") &&
    !order.address.toLowerCase().startsWith("dine-in");

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight text-foreground">{order.id}</h3>
          <p className="mt-0.5 text-base font-bold text-foreground">
            <span className="text-muted-foreground">Rs.</span>{" "}
            {order.total.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200",
              statusBadge[order.status],
              "hover:shadow-soft active:scale-95",
            )}
          >
            {statusLabel[order.status]}
            <ChevronDown
              className={cn(
                "size-3.5 opacity-60 transition-transform duration-200",
                dropdownOpen && "rotate-180",
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lift">
              <ul role="listbox" aria-label="Change order status">
                {allStatuses.map((s) => {
                  const isSelected = s === order.status;
                  return (
                    <li key={s}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onStatusChange?.(order.id, s);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition-all duration-150",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted active:scale-[0.98]",
                        )}
                      >
                        {statusLabel[s]}
                        {isSelected && <Check className="size-3.5" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <PaymentIcon className="size-3.5 shrink-0" />
          {paymentLabel[order.payment] ?? order.payment}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Truck className="size-3.5 shrink-0" />
          {isDelivery ? "DELIVERY" : "PICKUP"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          {order.placedAt}
        </span>
        {order.phone && order.phone !== "-" && (
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-3.5 shrink-0" />
            {order.phone}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Items ({order.items.reduce((sum, i) => sum + i.qty, 0)})
        </p>
        <div className="space-y-0 rounded-xl bg-surface-container px-3 py-2.5">
          {order.items.map((item) => (
            <div
              key={item.name}
              className="flex items-baseline justify-between gap-3 text-sm leading-relaxed"
            >
              <span className="min-w-0 truncate text-foreground">
                <span className="font-semibold">{item.qty}x</span> {item.name}
              </span>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {formatPKR(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onWhatsApp?.(order.id)}
          className="inline-flex items-center gap-1.5 rounded-full bg-success px-3.5 py-1.5 text-xs font-semibold text-success-foreground transition-all duration-200 hover:brightness-110 hover:shadow-soft active:scale-95"
          aria-label="Contact via WhatsApp"
        >
          <MessageCircle className="size-3.5" />
          WhatsApp
        </button>

        <button
          type="button"
          onClick={() => onPrint?.(order.id)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 hover:shadow-soft active:scale-95"
          aria-label="Print bill"
        >
          <Printer className="size-3.5" />
          Print Bill
        </button>

        {isManager === false && (
          <button
            type="button"
            onClick={() => onDelete?.(order.id)}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/10 px-3.5 py-1.5 text-xs font-semibold text-destructive transition-all duration-200 hover:bg-destructive/15 hover:shadow-soft active:scale-95"
            aria-label="Delete order"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default OrderCard;

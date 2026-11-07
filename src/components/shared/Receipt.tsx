import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { storeInfo } from "@/lib/store-config";
import { ArrowLeft, Printer, Scissors } from "lucide-react";

export interface ReceiptProps {
  order: {
    id: string;
    customer: string;
    phone: string;
    items: { name: string; qty: number; price: number }[];
    total: number;
    payment: string;
    placedAt: string;
    address: string;
    type?: "pickup" | "delivery" | undefined;
    /** Optional breakdown. When missing, only Subtotal and Total are shown. */
    subtotal?: number | undefined;
    discount?: number | undefined;
    deliveryFee?: number | undefined;
    tax?: number | undefined;
  };
  className?: string;
}

const Divider = () => <hr className="border-t border-dashed border-black/80 my-2" />;

export function Receipt({ order, className }: ReceiptProps) {
  const subtotal =
    order.subtotal ?? order.items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const paymentLabel =
    order.payment === "cod"
      ? "Cash on Delivery"
      : order.payment === "easypaisa"
        ? "EasyPaisa"
        : order.payment === "jazzcash"
          ? "JazzCash"
          : order.payment;

  const orderType = order.type === "pickup" ? "Pickup" : "Delivery";

  return (
    <div
      className={cn(
        "min-h-screen bg-surface-container flex flex-col items-center py-6 px-4",
        className,
      )}
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between w-full max-w-xs mb-4 print:hidden">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-soft border border-border hover:bg-muted transition-all duration-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-soft border border-border hover:bg-muted transition-all duration-200 active:scale-95"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>
      </div>

      {/* ── Receipt paper ── */}
      <div
        id="receipt-content"
        className="bg-white w-full max-w-xs rounded-sm shadow-[0_1px_6px_rgba(0,0,0,0.12)] font-['Courier_New',_monospace] text-[11px] leading-relaxed text-black px-4 py-5 print:max-w-none print:shadow-none print:rounded-none print:px-0 print:py-0"
      >
        {/* Brand header */}
        <div className="text-center mb-1">
          <div className="text-lg font-bold tracking-widest uppercase">PINDICRUST</div>
          <div className="text-[10px] tracking-[0.3em] uppercase mt-0.5">Fresh</div>
        </div>

        <div className="text-center text-[10px] text-black/70 leading-snug">
          {storeInfo.address && <div>{storeInfo.address}</div>}
          {storeInfo.phone && <div>{storeInfo.phone}</div>}
        </div>

        <Divider />

        {/* Order info */}
        <div className="flex justify-between text-[10px]">
          <span>ORDER #</span>
          <span className="font-bold">{order.id}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>DATE</span>
          <span>{order.placedAt}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>TYPE</span>
          <span className="uppercase">{orderType}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>PAYMENT</span>
          <span>{paymentLabel}</span>
        </div>

        <Divider />

        {/* Customer */}
        <div className="text-[10px]">
          <div>
            <span className="text-black/50">NAME </span>
            {order.customer}
          </div>
          <div>
            <span className="text-black/50">PHONE </span>
            {order.phone}
          </div>
          {order.type === "delivery" && (
            <div>
              <span className="text-black/50">ADDR </span>
              {order.address}
            </div>
          )}
        </div>

        <Divider />

        {/* Items table */}
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-black/50 mb-1">
          <span>Item</span>
          <span className="w-8 text-center">Qty</span>
          <span className="text-right">Amt</span>
        </div>

        {order.items.map((item, i) => {
          const lineTotal = item.qty * item.price;
          return (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between">
                <span className="flex-1 pr-2 break-words leading-snug">{item.name}</span>
                <span className="w-8 text-center shrink-0">{item.qty}</span>
                <span className="text-right w-16 shrink-0">{formatPKR(lineTotal)}</span>
              </div>
              <div className="text-[9px] text-black/40 text-right w-full -mt-0.5">
                {item.qty} × {formatPKR(item.price)}
              </div>
            </div>
          );
        })}

        <Divider />

        {/* Totals */}
        <div className="flex justify-between text-[10px]">
          <span>Subtotal</span>
          <span>{formatPKR(subtotal)}</span>
        </div>
        {!!order.discount && order.discount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>Discount</span>
            <span>-{formatPKR(order.discount)}</span>
          </div>
        )}
        {!!order.deliveryFee && order.deliveryFee > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>Delivery</span>
            <span>{formatPKR(order.deliveryFee)}</span>
          </div>
        )}
        {!!order.tax && order.tax > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>Tax</span>
            <span>{formatPKR(order.tax)}</span>
          </div>
        )}

        <div className="border-t-2 border-black my-2" />

        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatPKR(order.total)}</span>
        </div>

        <Divider />

        {/* Footer */}
        <div className="text-center text-[10px] leading-snug mt-1">
          <div className="font-semibold">Thank you for your order!</div>
          {storeInfo.whatsapp && (
            <>
              <div className="text-black/50 mt-1">Questions? WhatsApp us</div>
              <div className="text-black/50">+{storeInfo.whatsapp}</div>
            </>
          )}
        </div>

        {/* Cut line */}
        <div className="flex items-center gap-2 mt-4 text-black/30 print:mt-2">
          <Scissors className="h-3.5 w-3.5 shrink-0 rotate-90" />
          <div className="border-t border-dashed border-black/30 flex-1" />
          <span className="text-[8px] uppercase tracking-widest font-bold">Cut Here</span>
          <div className="border-t border-dashed border-black/30 flex-1" />
          <Scissors className="h-3.5 w-3.5 shrink-0 -rotate-90" />
        </div>
      </div>

      {/* Print-only stylesheet injected inline */}
      <style>{`
        @media print {
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}

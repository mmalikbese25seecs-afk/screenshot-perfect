import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/Primitives";
import { Receipt } from "@/components/shared/Receipt";
import { trackOrder } from "@/lib/api";

type ReceiptSearch = { orderId?: string | undefined };

export const Route = createFileRoute("/_shop/receipt")({
  validateSearch: (search: Record<string, unknown>): ReceiptSearch => ({
    orderId: typeof search["orderId"] === "string" ? search["orderId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Receipt — PINDI CRUST" },
      { name: "description", content: "Your order receipt from PINDI CRUST." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { orderId } = Route.useSearch();

  // Only the order's owner (or staff) gets a result: see track_order in the database.
  const { data: order, isLoading } = useQuery({
    queryKey: ["track", orderId, undefined],
    queryFn: () => trackOrder(orderId!),
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xs px-4 py-10">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={<ReceiptText className="size-7" />}
          title="Receipt not available"
          description="Sign in to the account you ordered with to view this receipt."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="hero">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/orders">My orders</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <Receipt
      order={{
        id: order.id,
        customer: order.customer,
        phone: order.phone,
        items: order.items,
        total: order.total,
        payment: order.payment,
        placedAt: new Date(order.placedAtIso).toLocaleString("en-PK", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        address: order.address,
        type: order.source === "pos" ? "pickup" : "delivery",
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryFee: order.deliveryFee,
        tax: order.tax,
      }}
    />
  );
}

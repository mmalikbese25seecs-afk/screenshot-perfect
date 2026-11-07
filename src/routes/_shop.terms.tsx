import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/shared/LegalPage";

export const Route = createFileRoute("/_shop/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — PINDI CRUST" },
      {
        name: "description",
        content: "The terms that apply when you order, pay for and receive food from PINDI CRUST.",
      },
      { property: "og:title", content: "Terms & Conditions — PINDI CRUST" },
      {
        property: "og:description",
        content: "Ordering, pricing, delivery, payment, refunds and acceptable use.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <LegalPage
      title="Terms & Conditions"
      subtitle="The agreement between you and PINDI CRUST whenever you place an order."
      updated="12 March 2026"
      sections={sections}
    />
  ),
});

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    body: [
      "By browsing this site, creating an account or placing an order you agree to these terms. If you do not agree, please do not use the service.",
    ],
  },
  {
    id: "orders",
    title: "Orders and availability",
    body: [
      "All orders are subject to kitchen capacity and ingredient availability. We may cancel and fully refund an order if an item becomes unavailable.",
      "An order is confirmed only once it appears in your Order History with a PC- reference number.",
    ],
  },
  {
    id: "pricing",
    title: "Pricing and promotions",
    body: [
      "Prices are shown in Pakistani Rupees and include applicable taxes unless stated otherwise. Menu prices may change without notice.",
      "Promo codes are single-use per customer unless stated, cannot be combined, and may be withdrawn at any time.",
    ],
  },
  {
    id: "payment",
    title: "Payment",
    body: [
      "We accept Cash on Delivery, EasyPaisa and JazzCash. For wallet payments a valid Transaction ID is mandatory before an order can be placed.",
      "Orders with an invalid or unverifiable Transaction ID will be cancelled and any funds returned to the sending wallet.",
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    body: [
      "We deliver within a 12 km radius of our branches. Estimated delivery times are indicative and may extend during peak hours or bad weather.",
      "Please ensure someone is available at the delivery address. Riders wait a maximum of 10 minutes.",
    ],
  },
  {
    id: "refunds",
    title: "Cancellations and refunds",
    body: [
      "Orders can be cancelled free of charge before the kitchen starts preparation. Once baking begins the order is non-refundable.",
      "If food arrives damaged, incorrect or cold, contact us within 60 minutes and we will replace it or issue a full refund.",
    ],
  },
  {
    id: "conduct",
    title: "Acceptable use",
    body: [
      "Reviews must be genuine and free of abusive language. We reserve the right to hide or remove content and suspend accounts that abuse the service, staff or riders.",
    ],
  },
  {
    id: "liability",
    title: "Liability",
    body: [
      "Our liability for any order is limited to the amount paid for that order. Please inform us of allergies before ordering — our kitchen handles gluten, dairy and nuts.",
    ],
  },
];

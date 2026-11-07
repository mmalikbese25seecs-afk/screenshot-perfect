import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/shared/LegalPage";

export const Route = createFileRoute("/_shop/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — PINDI CRUST" },
      {
        name: "description",
        content:
          "How PINDI CRUST collects, uses and protects your personal data when you order pizza online.",
      },
      { property: "og:title", content: "Privacy Policy — PINDI CRUST" },
      {
        property: "og:description",
        content: "Our commitments on data collection, storage, sharing and your privacy rights.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <LegalPage
      title="Privacy Policy"
      subtitle="What we collect, why we collect it, and the control you keep over it."
      updated="12 March 2026"
      sections={sections}
    />
  ),
});

const sections: LegalSection[] = [
  {
    id: "collect",
    title: "Information we collect",
    body: [
      "When you place an order we collect your name, phone number, delivery address and order contents. If you create an account we also store your email address and saved addresses.",
      "For digital wallet payments (EasyPaisa, JazzCash) we store only the transaction ID you provide. We never see or store your wallet PIN, card numbers or banking credentials.",
    ],
  },
  {
    id: "use",
    title: "How we use your information",
    body: [
      "Your data is used to prepare and deliver your order, provide live order tracking, handle refunds, and offer customer support.",
      "With your consent we may send promotional messages about new menu items and offers. You can opt out at any time from Profile → Notifications.",
    ],
  },
  {
    id: "sharing",
    title: "Sharing and disclosure",
    body: [
      "We share the minimum required data with delivery riders (name, address, phone) and payment processors (transaction reference only).",
      "We never sell your personal data to third parties or advertising networks.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: [
      "We use local storage to remember your cart, theme preference and sign-in session. These are essential for the site to work.",
      "Analytics cookies help us understand which menu items and pages are popular so we can improve the ordering experience.",
    ],
  },
  {
    id: "retention",
    title: "Data retention",
    body: [
      "Order records are retained for 24 months for accounting and dispute resolution. Account data is kept until you request deletion.",
    ],
  },
  {
    id: "rights",
    title: "Your rights",
    body: [
      "You can request a copy of your data, correct inaccurate details, or ask us to delete your account by contacting us through the Contact page.",
      "We respond to all verified privacy requests within 30 days.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    body: ["Questions about this policy? Reach us through the Contact page."],
  },
];

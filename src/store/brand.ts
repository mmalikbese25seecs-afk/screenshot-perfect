import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HomeSection = { id: string; label: string; enabled: boolean };

export type BrandState = {
  brandName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  heroImage: string;
  heroHeading: string;
  heroSubheading: string;
  heroCta: string;
  announcement: string;
  announcementEnabled: boolean;
  homeSections: HomeSection[];
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  font: string;
  buttonStyle: "rounded" | "pill" | "square";
  radius: string;
  footerText: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  social: { instagram: string; facebook: string; tiktok: string };
  hours: string;
  mapsUrl: string;
  deliveryRadiusKm: number;
  seoTitle: string;
  seoDescription: string;
  copyright: string;
  setField: <K extends keyof BrandState>(key: K, value: BrandState[K]) => void;
  reorderSection: (id: string, dir: "up" | "down") => void;
  reset: () => void;
};

const defaults: Omit<BrandState, "setField" | "reorderSection" | "reset"> = {
  brandName: "PINDI CRUST",
  tagline: "Artisanal Crust, Pure Happiness",
  logoUrl: "",
  faviconUrl: "",
  heroImage: "",
  heroHeading: "Wood-Fired. Hand-Stretched. Delivered Hot.",
  heroSubheading: "Artisanal wood-fired pizza, hand-stretched and baked to order.",
  heroCta: "Order Now",
  announcement: "",
  announcementEnabled: false,
  homeSections: [
    { id: "hero", label: "Hero Banner", enabled: true },
    { id: "categories", label: "Categories", enabled: true },
    { id: "bestsellers", label: "Bestsellers", enabled: true },
    { id: "promo", label: "Promotional Banner", enabled: true },
    { id: "reviews", label: "Customer Reviews", enabled: true },
    { id: "app", label: "App Download CTA", enabled: false },
  ],
  primaryColor: "#840912",
  accentColor: "#fdba53",
  surfaceColor: "#fbf9f4",
  font: "Poppins",
  buttonStyle: "rounded",
  radius: "1rem",
  footerText: "Artisanal wood-fired pizza.",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  social: { instagram: "", facebook: "", tiktok: "" },
  hours: "",
  mapsUrl: "",
  deliveryRadiusKm: 0,
  seoTitle: "PINDI CRUST — Artisanal Wood-Fired Pizza in Rawalpindi",
  seoDescription:
    "Order hand-stretched, wood-fired pizza delivered hot across Rawalpindi & Islamabad.",
  copyright: "© 2026 PINDI CRUST. All rights reserved.",
};

export const useBrandStore = create<BrandState>()(
  persist(
    (set, get) => ({
      ...defaults,
      setField: (key, value) => set({ [key]: value } as Partial<BrandState>),
      reorderSection: (id, dir) => {
        const sections = [...get().homeSections];
        const idx = sections.findIndex((s) => s.id === id);
        const swap = dir === "up" ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= sections.length) return;
        const a = sections[idx];
        const b = sections[swap];
        if (!a || !b) return;
        sections[idx] = b;
        sections[swap] = a;
        set({ homeSections: sections });
      },
      reset: () => set({ ...defaults }),
    }),
    { name: "pindi-brand-draft", version: 2 },
  ),
);

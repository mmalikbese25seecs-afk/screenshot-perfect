import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SeasonalTheme =
  | "default"
  | "independence"
  | "ramadan"
  | "eid"
  | "newyear"
  | "winter"
  | "summer"
  | "festival"
  | "blackfriday";

export const seasonalThemes: {
  id: SeasonalTheme;
  name: string;
  emoji: string;
  description: string;
  swatches: string[];
}[] = [
  {
    id: "default",
    name: "Artisanal Hearth",
    emoji: "🔥",
    description: "The signature red & golden crust identity.",
    swatches: ["#840912", "#fdba53", "#fbf9f4"],
  },
  {
    id: "independence",
    name: "Independence Day",
    emoji: "🇵🇰",
    description: "White & green with patriotic banners.",
    swatches: ["#0f7a4a", "#eaf6ef", "#ffffff"],
  },
  {
    id: "ramadan",
    name: "Ramadan",
    emoji: "🌙",
    description: "Deep teal nights with lantern gold.",
    swatches: ["#0b5566", "#e3b23c", "#f3f5fa"],
  },
  {
    id: "eid",
    name: "Eid",
    emoji: "🎊",
    description: "Festive violet with gilded accents.",
    swatches: ["#5b2a86", "#e6c15c", "#faf3fb"],
  },
  {
    id: "newyear",
    name: "New Year",
    emoji: "🥂",
    description: "Midnight ink with champagne gold.",
    swatches: ["#1e1b2e", "#dfc06a", "#f6f5f9"],
  },
  {
    id: "winter",
    name: "Winter",
    emoji: "❄️",
    description: "Frosted blues and soft snowfall.",
    swatches: ["#2f5c9e", "#cfe0f5", "#f7fafd"],
  },
  {
    id: "summer",
    name: "Summer",
    emoji: "☀️",
    description: "Sun-drenched citrus and terracotta.",
    swatches: ["#d9541f", "#f7c744", "#fffaf0"],
  },
  {
    id: "festival",
    name: "Pizza Festival",
    emoji: "🍕",
    description: "Tomato red carnival with mozzarella cream.",
    swatches: ["#c1272d", "#f2b134", "#fdf6ee"],
  },
  {
    id: "blackfriday",
    name: "Black Friday",
    emoji: "🖤",
    description: "Monochrome with electric gold deals.",
    swatches: ["#111111", "#f5c518", "#f7f7f7"],
  },
];

type ThemeState = {
  theme: SeasonalTheme;
  mode: "light" | "dark";
  promotionsEnabled: boolean;
  maintenanceMode: boolean;
  setTheme: (t: SeasonalTheme) => void;
  toggleMode: () => void;
  setPromotionsEnabled: (v: boolean) => void;
  setMaintenanceMode: (v: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "default",
      mode: "light",
      promotionsEnabled: true,
      maintenanceMode: false,
      setTheme: (theme) => set({ theme }),
      toggleMode: () => set({ mode: get().mode === "light" ? "dark" : "light" }),
      setPromotionsEnabled: (promotionsEnabled) => set({ promotionsEnabled }),
      setMaintenanceMode: (maintenanceMode) => set({ maintenanceMode }),
    }),
    { name: "pindi-theme" },
  ),
);

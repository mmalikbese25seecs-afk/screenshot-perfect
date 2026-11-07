import { create } from "zustand";
import { persist } from "zustand/middleware";

type PrefState = {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
};

export const usePrefs = create<PrefState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (id) =>
        set({
          favorites: get().favorites.includes(id)
            ? get().favorites.filter((f) => f !== id)
            : [...get().favorites, id],
        }),
      isFavorite: (id) => get().favorites.includes(id),
    }),
    {
      name: "pindi-prefs",
      version: 2,
      // v1 shipped seeded demo IDs ("p1", "p6"); drop anything that isn't a real product id.
      migrate: (persisted) => {
        const favs = (persisted as { favorites?: unknown })?.favorites;
        return {
          favorites: Array.isArray(favs)
            ? favs.filter((f) => typeof f === "string" && !/^p\d+$/.test(f))
            : [],
        } as PrefState;
      },
    },
  ),
);

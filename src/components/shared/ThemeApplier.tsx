import { useEffect, useRef } from "react";
import { useThemeStore } from "@/store/theme";
import { useBrandStore } from "@/store/brand";

/**
 * Applies theme to <html>.
 *
 * Two layers:
 * 1. Seasonal theme → data-theme attribute → CSS variable overrides in styles.css
 * 2. Brand 3-color customization → CSS variables on :root
 *
 * The brand colors are converted from hex to oklch and applied as CSS
 * variables, which all components consume via Tailwind utilities.
 *
 * In dark mode, brand colors are lightened to maintain readability.
 */
export function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme);
  const mode = useThemeStore((s) => s.mode);
  const primaryColor = useBrandStore((s) => s.primaryColor);
  const accentColor = useBrandStore((s) => s.accentColor);
  const surfaceColor = useBrandStore((s) => s.surfaceColor);

  /* Track which custom properties we set so we can clean them up properly */
  const appliedProps = useRef<string[]>([]);

  /* Seasonal theme + dark mode */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "default") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", mode === "dark");
  }, [theme, mode]);

  /* Brand 3-color system */
  useEffect(() => {
    const root = document.documentElement;
    const isDark = mode === "dark";

    // Clean up previous custom properties
    for (const prop of appliedProps.current) {
      root.style.removeProperty(prop);
    }
    appliedProps.current = [];

    const set = (prop: string, value: string) => {
      root.style.setProperty(prop, value);
      appliedProps.current.push(prop);
    };

    const primary = hexToOklch(primaryColor);
    const accent = hexToOklch(accentColor);
    const surface = hexToOklch(surfaceColor);

    if (primary) {
      set("--brand-primary", primary);

      if (theme === "default") {
        // In dark mode, lighten the primary for better visibility
        const activePrimary = isDark ? lightenOklch(primary, 0.5) : primary;
        set("--primary", activePrimary);
        set("--primary-soft", isDark ? lightenOklch(primary, 0.72) : lightenOklch(primary, 0.92));
        set(
          "--primary-foreground",
          getContrastForeground(isDark ? lightenOklch(primary, 0.5) : primary),
        );
        set("--ring", activePrimary);
        set("--sidebar-primary", activePrimary);
        set("--sidebar-primary-foreground", getContrastForeground(activePrimary));
      }
    }

    if (accent) {
      set("--brand-accent", accent);
      if (theme === "default") {
        const activeAccent = isDark ? lightenOklch(accent, 0.3) : accent;
        set("--secondary", activeAccent);
      }
    }

    if (surface) {
      set("--brand-surface", surface);
      if (theme === "default") {
        if (isDark) {
          // In dark mode, use a darkened version of the surface color
          const darkSurface = darkenOklch(surface, 0.18);
          set("--background", darkSurface);
          set("--surface", darkSurface);
          set("--cream", darkenOklch(surface, 0.22));
        } else {
          set("--background", surface);
          set("--surface", surface);
          set("--cream", surface);
        }
      }
    }

    // Cleanup on unmount
    return () => {
      for (const prop of appliedProps.current) {
        root.style.removeProperty(prop);
      }
      appliedProps.current = [];
    };
  }, [primaryColor, accentColor, surfaceColor, theme, mode]);

  return null;
}

/**
 * Convert a hex color string to oklch() CSS function.
 * Falls back to null if conversion fails.
 */
function hexToOklch(hex: string): string | null {
  if (!hex || !hex.startsWith("#")) return null;
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    // sRGB to linear
    const lr = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const lg = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const lb = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    // Linear to XYZ (D65)
    const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
    const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
    const z = 0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb;
    // XYZ to LMS (D65)
    const l_ = 0.2104542553 * x + 0.793617785 * y - 0.0040720468 * z;
    const m_ = 1.9779984951 * x - 2.428592205 * y + 0.4505937099 * z;
    const s_ = 0.0259040371 * x + 0.7827717662 * y - 0.808675766 * z;
    // Cube root
    const lc = Math.cbrt(l_);
    const mc = Math.cbrt(m_);
    const sc = Math.cbrt(s_);
    // LMS to OKLab
    const L = 0.8459767495 * lc - 0.1540232505 * mc - 0.170947845 * sc;
    const a = 0.49040965 * lc + 0.80869509 * mc - 0.29910474 * sc;
    const b2 = -0.025799146 * lc + 0.44292247 * mc - 0.41712332 * sc;
    // OKLab to OKLCh
    const C = Math.sqrt(a * a + b2 * b2);
    let H = Math.atan2(b2, a) * (180 / Math.PI);
    if (H < 0) H += 360;
    return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(2)})`;
  } catch {
    return null;
  }
}

/** Lighten an oklch color by blending towards white. */
function lightenOklch(oklchStr: string, targetL: number): string {
  const match = oklchStr.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match || !match[1] || !match[2] || !match[3]) return oklchStr;
  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);
  // Desaturate slightly when lightening for a more natural look
  const newL = Math.min(1, L + (targetL - L) * 0.85);
  const newC = C * (1 - (targetL - L) * 0.3);
  return `oklch(${newL.toFixed(4)} ${Math.max(0, newC).toFixed(4)} ${H.toFixed(2)})`;
}

/** Darken an oklch color by reducing lightness. */
function darkenOklch(oklchStr: string, amount: number): string {
  const match = oklchStr.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match || !match[1] || !match[2] || !match[3]) return oklchStr;
  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);
  const newL = Math.max(0, L - amount);
  return `oklch(${newL.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(2)})`;
}

/** Determine if foreground should be white or dark based on luminance. */
function getContrastForeground(oklchStr: string): string {
  const match = oklchStr.match(/oklch\(([\d.]+)/);
  if (!match || !match[1]) return "oklch(0.99 0 0)";
  const L = parseFloat(match[1]);
  return L > 0.55 ? "oklch(0.15 0.02 100)" : "oklch(0.99 0 0)";
}

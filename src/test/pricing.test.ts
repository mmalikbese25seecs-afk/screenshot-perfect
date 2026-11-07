import { describe, expect, it } from "vitest";
import { computeTotals, taxLabel } from "@/lib/pricing";
import { mergeGallery } from "@/lib/api";

describe("pricing", () => {
  it("does not invent a delivery fee or tax while they are unset", () => {
    expect(computeTotals(1000, null)).toEqual({
      subtotal: 1000,
      discount: 0,
      tax: 0,
      deliveryFee: 0,
      total: 1000,
    });
    expect(taxLabel(null)).toBe("Tax (not configured)");
  });
  it("applies configured fee and tax to online orders only", () => {
    const cfg = { deliveryFee: 150, taxRate: 0.1 };
    expect(computeTotals(1000, null, "online", cfg).total).toBe(1250);
    expect(computeTotals(1000, null, "pos", cfg).total).toBe(1000);
  });
});

describe("product gallery", () => {
  it("keeps existing gallery images when the main image changes", () => {
    expect(mergeGallery("b.jpg", ["a.jpg", "b.jpg", "c.jpg"])).toEqual(["b.jpg", "a.jpg", "c.jpg"]);
  });
});

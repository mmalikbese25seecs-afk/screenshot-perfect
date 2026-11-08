import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Advertisement } from "@/components/customer/HomeAdvertisement";
import { validAdDestination } from "@/lib/advertisements";
import type { Offer } from "@/lib/api";

const ad: Offer = { id: "test", title: "User-authored test draft", subtitle: "", tag: "", cta: "Visit website", image: "", active: true, linkType: "external", linkTarget: "https://example.com/deal" };

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("homepage advertisements", () => {
  it("remains visible before 10 seconds and closes at exactly 10 seconds", () => {
    vi.useFakeTimers();
    render(<Advertisement ad={ad} />);
    act(() => { vi.advanceTimersByTime(9999); });
    expect(screen.queryByLabelText("Homepage advertisement")).not.toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.queryByLabelText("Homepage advertisement")).toBeNull();
  });
  it("closes immediately when its close control is used", () => {
    render(<Advertisement ad={ad} />);
    fireEvent.click(screen.getByRole("button", { name: "Close advertisement" }));
    expect(screen.queryByLabelText("Homepage advertisement")).toBeNull();
  });
  it("links third-party ads to the configured website in a separate tab", () => {
    render(<Advertisement ad={ad} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("https://example.com/deal");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
  it("accepts item destinations and rejects unsafe external links", () => {
    expect(validAdDestination({ linkType: "product", linkTarget: "new-deal" })).toBe(true);
    expect(validAdDestination({ linkType: "product", linkTarget: "" })).toBe(false);
    expect(validAdDestination({ linkType: "external", linkTarget: "javascript:alert(1)" })).toBe(false);
    expect(validAdDestination({ linkType: "external", linkTarget: "https://example.com" })).toBe(true);
  });
});
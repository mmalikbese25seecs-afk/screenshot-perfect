export const AD_DURATION_MS = 10_000;

export type AdDestination = { linkType: "product" | "external"; linkTarget: string };

export function validAdDestination(ad: AdDestination): boolean {
  if (ad.linkType === "product") return /^[a-zA-Z0-9]+(?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(ad.linkTarget);
  try {
    const url = new URL(ad.linkTarget);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
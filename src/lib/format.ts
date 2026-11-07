export const formatPKR = (n: number) =>
  `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

/** "Truffle Forest!" -> "truffle-forest" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

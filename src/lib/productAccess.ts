export const BLOCKED_PRODUCT_NAMES = new Set(["Scoprio"]);

export function isProductOpenable(productName: string | null | undefined) {
  if (!productName) {
    return true;
  }

  return !BLOCKED_PRODUCT_NAMES.has(productName.trim());
}

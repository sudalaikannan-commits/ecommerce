// Money is stored as integer paise (or cents) in the database.
// This module converts between integer paise and the display currency.

export const CURRENCY = "₹";
export const CURRENCY_CODE = "INR";

/** Convert paise integer to a human readable price string, e.g. ₹1,299.00 */
export function formatPrice(paise: number | null | undefined): string {
  const value = Number(paise ?? 0);
  const rupees = value / 100;
  return `${CURRENCY}${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Compact price e.g. ₹1,299 */
export function formatPriceCompact(paise: number | null | undefined): string {
  const value = Number(paise ?? 0);
  const rupees = value / 100;
  return `${CURRENCY}${rupees.toLocaleString("en-IN", {
    maximumFractionDigits: value % 100 === 0 ? 0 : 2,
  })}`;
}

/** Convert rupees (string or number) to paise integer. e.g. "1299.50" -> 129950 */
export function rupeesToPaise(value: string | number): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

/** Convert paise integer to rupees as a float (for API/forms) */
export function paiseToRupees(paise: number | null | undefined): number {
  return (Number(paise ?? 0) || 0) / 100;
}

/**
 * Calculate the selling price of a product variant.
 * salePrice wins if present and lower than price.
 */
export function sellingPrice(price: number, salePrice: number | null | undefined): number {
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}

export function discountPercent(price: number, salePrice: number | null | undefined): number {
  const sale = sellingPrice(price, salePrice);
  if (sale >= price || price <= 0) return 0;
  return Math.round(((price - sale) / price) * 100);
}
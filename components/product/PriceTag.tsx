import { formatPrice } from "@/lib/money";

export function PriceTag({
  price,
  salePrice,
  size = "md",
  className,
}: {
  price: number;
  salePrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hasSale = salePrice != null && salePrice > 0 && salePrice < price;
  const priceClass =
    size === "lg"
      ? "text-2xl"
      : size === "sm"
        ? "text-sm"
        : "text-base";

  if (!hasSale) {
    return <span className={`font-bold text-gray-900 ${priceClass} ${className ?? ""}`}>{formatPrice(price)}</span>;
  }

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 ${className ?? ""}`}>
      <span className={`font-bold text-brand-600 ${priceClass}`}>{formatPrice(salePrice)}</span>
      <span className={`text-gray-400 line-through ${size === "sm" ? "text-xs" : "text-sm"}`}>
        {formatPrice(price)}
      </span>
    </div>
  );
}
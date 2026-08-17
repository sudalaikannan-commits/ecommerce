import { ProductCard, type ProductCardData } from "./ProductCard";

export function ProductGrid({
  products,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or search terms.",
}: {
  products: ProductCardData[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <p className="text-lg font-semibold text-gray-900">{emptyTitle}</p>
        <p className="mt-1 text-sm text-gray-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
import { NextRequest } from "next/server";
import { ok, fail, handleError, paginate } from "@/lib/api";
import { listProducts } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const minPrice = sp.get("min_price");
    const maxPrice = sp.get("max_price");
    const minRating = sp.get("min_rating");

    const result = await listProducts({
      search: sp.get("q") || undefined,
      categorySlug: sp.get("category") || undefined,
      brandSlug: sp.get("brand") || undefined,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      minRating: minRating ? parseInt(minRating, 10) : undefined,
      onSale: sp.get("on_sale") === "true",
      inStock: sp.get("in_stock") === "true",
      sort: sp.get("sort") || undefined,
      page: parseInt(sp.get("page") || "1", 10),
      perPage: parseInt(sp.get("per_page") || "12", 10),
    });

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
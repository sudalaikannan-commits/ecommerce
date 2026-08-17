"use client";

import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <PageTitle title="Add Product" subtitle="Create a new product. It will appear on the storefront immediately." />
      <ProductForm />
    </div>
  );
}
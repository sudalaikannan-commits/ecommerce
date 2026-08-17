"use client";

import { useParams } from "next/navigation";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageTitle title="Edit Product" subtitle="Update product details and manage inventory." />
      <ProductForm productId={id} />
    </div>
  );
}
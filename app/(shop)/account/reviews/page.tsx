"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { api } from "@/lib/client";
import { EmptyState, PageLoader } from "@/components/ui";
import { RatingStars } from "@/components/product/RatingStars";

interface MyReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  status: string;
  product: { id: string; name: string; slug: string };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ reviews: MyReview[] }>("/api/account/reviews");
        setReviews(res.reviews);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;

  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description="Review products you've purchased to help other shoppers."
        action={<Link href="/account/orders" className="btn-secondary">View Your Orders</Link>}
      />
    );
  }

  return (
    <div>
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900">
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> My Reviews ({reviews.length})
      </h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link href={`/product/${review.product.slug}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600">
                  {review.product.name}
                </Link>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${review.status === "APPROVED" ? "bg-green-100 text-green-700" : review.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                {review.status}
              </span>
            </div>
            <div className="mt-2">
              <RatingStars rating={review.rating} />
              <span className="ml-2 text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
            {review.title && <p className="mt-2 text-sm font-semibold text-gray-900">{review.title}</p>}
            {review.comment && <p className="mt-1 text-sm text-gray-600">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
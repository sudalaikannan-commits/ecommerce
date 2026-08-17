"use client";

import Image from "next/image";
import { ShieldCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useShop } from "../providers/ShopProvider";
import { RatingStars } from "./RatingStars";
import { Spinner, EmptyState } from "../ui";

interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

export function Reviews({
  productId,
  productName,
  averageRating,
}: {
  productId: string;
  productName: string;
  averageRating: number;
}) {
  const { user, showToast } = useShop();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api<{ reviews: ReviewItem[]; total: number }>(
        `/api/reviews?productId=${productId}&per_page=20`
      );
      setReviews(res.reviews);
      setTotal(res.total);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Please log in to write a review.", "info");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/reviews", {
        method: "POST",
        body: { productId, rating, title, comment },
      });
      showToast("Your review has been submitted and is pending approval.");
      setTitle("");
      setComment("");
      setRating(5);
    } catch (err: any) {
      showToast(err.message || "Could not submit review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
      {/* Summary */}
      <div className="rounded-xl bg-gray-50 p-5 text-center">
        <p className="text-5xl font-extrabold text-gray-900">{averageRating.toFixed(1)}</p>
        <div className="mt-2 flex justify-center">
          <RatingStars rating={averageRating} size="md" />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Based on {total} review{total === 1 ? "" : "s"}
        </p>
        <div className="mt-4 space-y-1.5 text-left">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="flex w-8 items-center gap-0.5">
                  {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        {/* Write review */}
        <form onSubmit={submit} className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-900">Write a Review</h3>
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-6 w-6 transition ${
                    star <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title (optional)"
            className="input mt-3"
            maxLength={200}
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="input mt-2 min-h-[100px] resize-y"
            maxLength={5000}
          />
          <button type="submit" disabled={submitting} className="btn-primary mt-3">
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>

        {/* Reviews list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Be the first to share your thoughts on this product."
          />
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.user.name}</p>
                      <div className="flex items-center gap-2">
                        <RatingStars rating={review.rating} />
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified Purchase
                    </span>
                  )}
                </div>
                {review.title && (
                  <p className="mt-3 font-semibold text-gray-900">{review.title}</p>
                )}
                {review.comment && <p className="mt-1 text-sm text-gray-600">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
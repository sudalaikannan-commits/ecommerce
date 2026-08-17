import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating = 0,
  count,
  size = "sm",
  className,
}: {
  rating?: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const full = Math.round(rating);
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              iconSize,
              i <= full ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
            )}
          />
        ))}
      </div>
      {rating > 0 && (
        <span className="text-xs font-medium text-gray-600">{rating.toFixed(1)}</span>
      )}
      {count !== undefined && count > 0 && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </div>
  );
}
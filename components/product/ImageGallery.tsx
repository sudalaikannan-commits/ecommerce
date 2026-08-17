"use client";

import Image from "next/image";
import { useState } from "react";

export function ImageGallery({ images, name }: { images: { id: string; url: string; alt?: string | null }[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const list = images.length ? images : [{ id: "none", url: "", alt: name }];
  const current = list[Math.min(active, list.length - 1)];

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoom || !current.url) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  };

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {/* Thumbnails */}
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
          {list.map((img, i) => (
            <button
              key={img.id + i}
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === active ? "border-brand-600" : "border-transparent hover:border-gray-300"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              {img.url && <Image src={img.url} alt={img.alt || `${name} ${i + 1}`} fill className="object-cover" sizes="80px" />}
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div
        className="relative aspect-square w-full flex-1 cursor-zoom-in overflow-hidden rounded-xl bg-gray-100"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={handleMove}
      >
        {current.url ? (
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform duration-200"
            style={{
              transform: zoom ? "scale(1.8)" : "scale(1)",
              transformOrigin: `${pos.x}% ${pos.y}%`,
            }}
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">🛍️</div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-7xl font-black text-red-200">Oops</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-gray-600">
        An unexpected error occurred while loading this page. Please try again.
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        Try Again
      </button>
    </div>
  );
}
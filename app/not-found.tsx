import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-7xl font-black text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 max-w-md text-gray-600">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or
        no longer exists.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primary">Back to Home</Link>
        <Link href="/shop" className="btn-secondary">Browse Shop</Link>
      </div>
    </div>
  );
}
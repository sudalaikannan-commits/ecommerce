export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-gray-100 bg-gradient-to-r from-brand-50 to-white">
      <div className="container-x py-10 text-center sm:py-14">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-3 max-w-xl text-gray-600">{subtitle}</p>}
      </div>
    </div>
  );
}
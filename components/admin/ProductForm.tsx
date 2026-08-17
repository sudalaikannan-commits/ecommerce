"use client";

import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api, uploadImage } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { Toggle } from "@/components/admin/ui";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
}
interface Brand {
  id: string;
  name: string;
  isActive: boolean;
}

interface VariantForm {
  id?: string;
  sku: string;
  size: string;
  color: string;
  price: string;
  salePrice: string;
  stock: string;
  isActive: boolean;
}

interface ImageForm {
  url: string;
  alt: string;
}

const emptyVariant = (): VariantForm => ({ sku: "", size: "", color: "", price: "", salePrice: "", stock: "0", isActive: true });

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const { showToast } = useShop();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(productId));
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    brandId: "",
    price: "",
    salePrice: "",
    stock: "0",
    shortDescription: "",
    description: "",
    weight: "",
    dimensions: "",
    videoUrl: "",
    isActive: true,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
  });
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<ImageForm[]>([]);
  const [variants, setVariants] = useState<VariantForm[]>([]);

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    (async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api<{ categories: Category[] }>("/api/admin/categories"),
          api<{ brands: Brand[] }>("/api/admin/brands"),
        ]);
        setCategories(catRes.categories.filter((c) => !c.parentId || true));
        setBrands(brandRes.brands);
        if (!productId) setForm((f) => ({ ...f, categoryId: catRes.categories[0]?.id || "", brandId: brandRes.brands[0]?.id || "" }));
      } catch {}
    })();
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const res = await api<{ product: any }>(`/api/admin/products/${productId}`);
        const p = res.product;
        setForm({
          name: p.name,
          sku: p.sku || "",
          categoryId: p.categoryId || "",
          brandId: p.brandId || "",
          price: String(p.price ?? ""),
          salePrice: p.salePrice != null ? String(p.salePrice) : "",
          stock: String(p.stock ?? 0),
          shortDescription: p.shortDescription || "",
          description: p.description || "",
          weight: p.weight != null ? String(p.weight) : "",
          dimensions: p.dimensions || "",
          videoUrl: p.videoUrl || "",
          isActive: p.isActive,
          isFeatured: p.isFeatured,
          isBestSeller: p.isBestSeller,
          isNewArrival: p.isNewArrival,
        });
        setSpecs((p.specifications?.length ? p.specifications : [{ key: "", value: "" }]));
        setTags(p.tags?.join(", ") || "");
        setImages(p.images?.map((img: any) => ({ url: img.url, alt: img.alt || "" })) || []);
        setVariants(p.variants?.map((v: any) => ({
          id: v.id,
          sku: v.sku || "",
          size: v.size || "",
          color: v.color || "",
          price: v.price != null ? String(v.price) : "",
          salePrice: v.salePrice != null ? String(v.salePrice) : "",
          stock: String(v.stock ?? 0),
          isActive: v.isActive,
        })) || []);
      } catch (err: any) {
        showToast(err.message || "Could not load product", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId, showToast]);

  const addImage = async (file: File) => {
    setUploadingImg(true);
    try {
      const url = await uploadImage(file);
      setImages((prev) => [...prev, { url, alt: "" }]);
    } catch (err: any) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploadingImg(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      showToast("Please select a category.", "error");
      return;
    }
    setBusy(true);
    const payload = {
      name: form.name,
      sku: form.sku,
      shortDescription: form.shortDescription || null,
      description: form.description || null,
      price: form.price ? Number(form.price) : 0,
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      categoryId: form.categoryId,
      brandId: form.brandId || null,
      weight: form.weight ? Number(form.weight) : null,
      dimensions: form.dimensions || null,
      specifications: specs.filter((s) => s.key.trim()),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      stock: Number(form.stock) || 0,
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      isNewArrival: form.isNewArrival,
      isActive: form.isActive,
      videoUrl: form.videoUrl || null,
      images: images.map((img) => ({ url: img.url, alt: img.alt })),
      variants: variants.filter((v) => v.size || v.color || v.sku).map((v) => ({
        sku: v.sku || null,
        size: v.size || null,
        color: v.color || null,
        price: v.price ? Number(v.price) : null,
        salePrice: v.salePrice ? Number(v.salePrice) : null,
        stock: Number(v.stock) || 0,
        isActive: v.isActive,
      })),
    };
    try {
      if (productId) {
        await api(`/api/admin/products/${productId}`, { method: "PATCH", body: payload });
        showToast("Product updated");
      } else {
        await api("/api/admin/products", { method: "POST", body: payload });
        showToast("Product created and now live in the store");
      }
      router.push("/admin/products");
    } catch (err: any) {
      showToast(err.message || "Could not save product", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-sm text-gray-400">Loading product...</div>;

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Basics */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Basic Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Product Name *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="e.g. Wireless Noise Cancelling Headphones" />
          </div>
          <div>
            <label className="label">SKU *</label>
            <input required value={form.sku} onChange={(e) => set("sku", e.target.value)} className="input" placeholder="NC-100-BLK" />
          </div>
          <div>
            <label className="label">Stock *</label>
            <input type="number" min={0} value={form.stock} onChange={(e) => set("stock", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Category *</label>
            <select required value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="input">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Brand</label>
            <select value={form.brandId} onChange={(e) => set("brandId", e.target.value)} className="input">
              <option value="">None</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Price (₹, paise) *</label>
            <input required type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} className="input" placeholder="299900" />
          </div>
          <div>
            <label className="label">Sale Price (₹, paise)</label>
            <input type="number" min={0} value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} className="input" placeholder="199900" />
          </div>
          <div>
            <label className="label">Weight (g)</label>
            <input type="number" min={0} value={form.weight} onChange={(e) => set("weight", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Dimensions</label>
            <input value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} className="input" placeholder="20 x 15 x 8 cm" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Video URL</label>
            <input value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} className="input" placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Short Description</label>
            <input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className="input" maxLength={500} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Full Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="input min-h-[140px] resize-y" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
            <span className="text-sm text-gray-700">Active</span>
            <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
            <span className="text-sm text-gray-700">Featured</span>
            <Toggle checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
            <span className="text-sm text-gray-700">Best Seller</span>
            <Toggle checked={form.isBestSeller} onChange={(v) => set("isBestSeller", v)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
            <span className="text-sm text-gray-700">New Arrival</span>
            <Toggle checked={form.isNewArrival} onChange={(v) => set("isNewArrival", v)} />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Images</h3>
          <label className="btn-secondary cursor-pointer">
            <Upload className="mr-1.5 inline h-4 w-4" />
            {uploadingImg ? "Uploading..." : "Upload Image"}
            <input type="file" accept="image/*" multiple onChange={(e) => Array.from(e.target.files || []).forEach(addImage)} className="hidden" />
          </label>
        </div>
        {images.length === 0 && <p className="py-4 text-sm text-gray-400">No images yet. Upload product photos.</p>}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt || "Product"} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <input
                value={img.alt}
                onChange={(e) => setImages((prev) => prev.map((im, idx) => (idx === i ? { ...im, alt: e.target.value } : im)))}
                placeholder="Alt text"
                className="absolute bottom-0 left-0 w-full bg-black/60 px-2 py-1 text-[10px] text-white placeholder-gray-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Specifications */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Specifications</h3>
          <button type="button" onClick={() => setSpecs((s) => [...s, { key: "", value: "" }])} className="btn-secondary">
            <Plus className="mr-1 inline h-4 w-4" /> Add Row
          </button>
        </div>
        <div className="space-y-2">
          {specs.map((spec, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={spec.key}
                onChange={(e) => setSpecs((s) => s.map((x, idx) => (idx === i ? { ...x, key: e.target.value } : x)))}
                placeholder="Label (e.g. Battery Life)"
                className="input flex-1"
              />
              <input
                value={spec.value}
                onChange={(e) => setSpecs((s) => s.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))}
                placeholder="Value (e.g. 30 hours)"
                className="input flex-1"
              />
              <button type="button" onClick={() => setSpecs((s) => s.filter((_, idx) => idx !== i))} className="rounded-lg border border-gray-200 px-3 text-gray-500 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">Tags</h3>
        <input value={tags} onChange={(e) => setTags(e.target.value)} className="input" placeholder="Comma separated: headphones, bluetooth, black" />
      </div>

      {/* Variants */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Variants (size / color)</h3>
          <button type="button" onClick={() => setVariants((v) => [...v, emptyVariant()])} className="btn-secondary">
            <Plus className="mr-1 inline h-4 w-4" /> Add Variant
          </button>
        </div>
        {variants.length === 0 && <p className="py-2 text-sm text-gray-400">No variants. This product will use its base stock.</p>}
        <div className="space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-6">
              <input value={v.size} onChange={(e) => setVariants((arr) => arr.map((x, idx) => (idx === i ? { ...x, size: e.target.value } : x)))} placeholder="Size" className="input" />
              <input value={v.color} onChange={(e) => setVariants((arr) => arr.map((x, idx) => (idx === i ? { ...x, color: e.target.value } : x)))} placeholder="Color" className="input" />
              <input value={v.price} onChange={(e) => setVariants((arr) => arr.map((x, idx) => (idx === i ? { ...x, price: e.target.value } : x)))} placeholder="Price" className="input" />
              <input value={v.salePrice} onChange={(e) => setVariants((arr) => arr.map((x, idx) => (idx === i ? { ...x, salePrice: e.target.value } : x)))} placeholder="Sale Price" className="input" />
              <input value={v.stock} type="number" onChange={(e) => setVariants((arr) => arr.map((x, idx) => (idx === i ? { ...x, stock: e.target.value } : x)))} placeholder="Stock" className="input" />
              <div className="flex items-center justify-between gap-2">
                <Toggle checked={v.isActive} onChange={(val) => setVariants((arr) => arr.map((x, idx) => (idx === i ? { ...x, isActive: val } : x)))} />
                <button type="button" onClick={() => setVariants((arr) => arr.filter((_, idx) => idx !== i))} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn-primary px-8">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : productId ? "Save Changes" : "Create Product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
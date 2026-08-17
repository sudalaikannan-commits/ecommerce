export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
    signal,
    cache: "no-store",
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data && data.error) || `Request failed (${res.status}). Please try again.`;
    throw new ApiError(message, res.status, data?.details);
  }

  return (data && data.data !== undefined ? data.data : data) as T;
}

/**
 * Resize/compress an image in the browser before uploading. This keeps uploads
 * well under Vercel's request body limit (~4.5MB) so large photos don't fail.
 * Animated GIFs and non-raster files are passed through untouched.
 */
async function compressImage(file: File, maxDim = 1200, quality = 0.8): Promise<File> {
  if (file.type === "image/gif" || !file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", await compressImage(file));
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      (data && data.error) || `Upload failed (${res.status}). Please try again.`;
    throw new ApiError(message, res.status);
  }
  return data.data.url as string;
}
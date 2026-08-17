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

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.error || "Upload failed", res.status);
  return data.data.url as string;
}
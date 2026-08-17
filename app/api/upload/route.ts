import { NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { ok, fail, handleError, assertTrustedOrigin } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return fail("No file uploaded.", 400);

    if (!ALLOWED.has(file.type)) {
      return fail("Only JPG, PNG, WebP and GIF images are allowed.", 400);
    }
    if (file.size > MAX_SIZE) {
      return fail("Image must be 5MB or smaller.", 400);
    }

    const ext = (() => {
      switch (file.type) {
        case "image/png":
          return "png";
        case "image/webp":
          return "webp";
        case "image/gif":
          return "gif";
        default:
          return "jpg";
      }
    })();

    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), bytes);

    const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/uploads/${filename}`;
    return ok({ url }, 201);
  } catch (error) {
    return handleError(error);
  }
}
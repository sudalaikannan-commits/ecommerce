import { NextRequest } from "next/server";
import { ok, fail, handleError, assertTrustedOrigin } from "@/lib/api";
import { requireUser } from "@/lib/auth";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    await requireUser();

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return fail("No file uploaded.", 400);

    if (!ALLOWED.has(file.type)) {
      return fail("Only JPG, PNG, WebP and GIF images are allowed.", 400);
    }
    if (file.size > MAX_SIZE) {
      return fail("Image must be 5MB or smaller.", 400);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const url = `data:${file.type};base64,${bytes.toString("base64")}`;
    return ok({ url }, 201);
  } catch (error) {
    return handleError(error);
  }
}
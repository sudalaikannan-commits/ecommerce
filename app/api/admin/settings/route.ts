import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { settingsSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { setSetting } from "@/lib/settings";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const rows = await prisma.setting.findMany();
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value ?? "";
    return ok({ settings });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const body = await parseBody(req, settingsSchema);

    const entries: [string, string][] = Object.entries(body).map(([key, value]) => [
      key,
      value == null ? "" : String(value),
    ]);

    for (const [key, value] of entries) {
      await setSetting(key, value);
    }

    const rows = await prisma.setting.findMany();
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value ?? "";
    return ok({ settings });
  } catch (error) {
    return handleError(error);
  }
}
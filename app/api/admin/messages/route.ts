import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, assertTrustedOrigin } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok({ messages });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) return fail("Missing id.", 400);

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
    return ok({ message });
  } catch (error: any) {
    if (error?.code === "P2025") return fail("Message not found.", 404);
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    await requireAdmin();
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) return fail("Missing id.", 400);
    await prisma.contactMessage.delete({ where: { id } });
    return ok({ message: "Message deleted." });
  } catch (error: any) {
    if (error?.code === "P2025") return fail("Message not found.", 404);
    return handleError(error);
  }
}
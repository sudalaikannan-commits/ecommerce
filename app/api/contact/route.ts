import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { contactSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const body = await parseBody(req, contactSchema);
    await prisma.contactMessage.create({ data: body });
    return ok({ message: "Thank you! Your message has been received. We'll get back to you soon." }, 201);
  } catch (error) {
    return handleError(error);
  }
}
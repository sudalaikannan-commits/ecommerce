import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { newsletterSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const body = await parseBody(req, newsletterSchema);
    try {
      await prisma.newsletterSubscriber.create({ data: { email: body.email.toLowerCase() } });
    } catch (error: any) {
      if (error?.code === "P2002") {
        return ok({ message: "You are already subscribed!" });
      }
      throw error;
    }
    return ok({ message: "Subscribed! Watch your inbox for exclusive offers." }, 201);
  } catch (error) {
    return handleError(error);
  }
}
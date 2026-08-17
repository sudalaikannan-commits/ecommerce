import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handleError, assertTrustedOrigin } from "@/lib/api";
import { addressSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";

type Ctx = { params: { id: string } };

async function getOwnedAddress(userId: string, id: string) {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) throw new Error("ADDRESS_NOT_FOUND");
  return address;
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const address = await getOwnedAddress(user.id, params.id);
    const body = await parseBody(req, addressSchema);

    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: address.id },
      data: {
        label: body.label,
        fullName: body.fullName,
        phone: body.phone,
        line1: body.line1,
        line2: body.line2 || null,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        isDefault: body.isDefault ?? address.isDefault,
      },
    });

    return ok({ address: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "ADDRESS_NOT_FOUND") {
      return fail("Address not found.", 404);
    }
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    assertTrustedOrigin(req);
    const user = await requireUser();
    const address = await getOwnedAddress(user.id, params.id);

    await prisma.address.delete({ where: { id: address.id } });

    const remaining = await prisma.address.count({ where: { userId: user.id } });
    if (remaining > 0 && address.isDefault) {
      const next = await prisma.address.findFirst({ where: { userId: user.id } });
      if (next) {
        await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }

    return ok({ message: "Address deleted." });
  } catch (error) {
    if (error instanceof Error && error.message === "ADDRESS_NOT_FOUND") {
      return fail("Address not found.", 404);
    }
    return handleError(error);
  }
}
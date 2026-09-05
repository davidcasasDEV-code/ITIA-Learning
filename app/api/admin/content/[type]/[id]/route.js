import { getContentTypeConfig } from "@/lib/admin-content";
import { getContext } from "@/lib/context";
import { jsonError, parseJson } from "@/lib/http";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function PATCH(req, { params }) {
  try {
    const ctx = await getContext(req);
    requireAdmin(ctx);
    const { type, id } = await params;
    const config = getContentTypeConfig(type);
    const body = await parseJson(req, config.createSchema.partial());

    const updated = await prisma[config.prismaModel].update({ where: { id }, data: body });

    return Response.json(updated);
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    const ctx = await getContext(req);
    requireAdmin(ctx);
    const { type, id } = await params;
    const config = getContentTypeConfig(type);

    await prisma[config.prismaModel].delete({ where: { id } });

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

import { z } from "zod";
import { audit } from "@/lib/audit";
import { getContext } from "@/lib/context";
import { jsonError, parseJson } from "@/lib/http";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  role: z.enum(["USER", "ADMIN", "TEACHER"]).optional(),
  commentsBlocked: z.boolean().optional(),
});

export async function PATCH(req, { params }) {
  try {
    const ctx = await getContext(req);
    requireAdmin(ctx);
    const { id } = await params;
    const body = await parseJson(req, updateSchema);

    const updated = await prisma.user.update({ where: { id }, data: body });

    await audit(req, ctx, {
      action: "admin.user_updated",
      entity: "user",
      entityId: id,
      metadata: body,
    });

    return Response.json(updated);
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

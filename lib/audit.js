import { getClientIp } from "./http.js";
import { prisma } from "./prisma.js";

export async function audit(req, ctx, { action, entity, entityId, metadata }) {
  return prisma.auditLog.create({
    data: {
      userId: ctx?.userId || null,
      action,
      entity,
      entityId,
      metadata,
      ipAddress: req ? getClientIp(req) : null,
      userAgent: req?.headers.get("user-agent") || null,
    },
  });
}

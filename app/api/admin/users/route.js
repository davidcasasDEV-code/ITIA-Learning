import { getContext } from "@/lib/context";
import { jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const ctx = await getContext(req);
    requireAdmin(ctx);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        publicHandle: true,
        displayName: true,
        email: true,
        role: true,
        commentsBlocked: true,
        createdAt: true,
        subscription: { select: { status: true, trialEndsAt: true, plan: { select: { slug: true, name: true } } } },
      },
    });

    return Response.json(users);
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

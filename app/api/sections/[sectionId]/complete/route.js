import { z } from "zod";
import { getContext } from "@/lib/context";
import { jsonError, parseJson } from "@/lib/http";
import { requireContentAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { recomputeUnitProgress } from "@/lib/progress";

const completeSchema = z.object({
  score: z.number().int().min(0).max(100).optional(),
});

export async function POST(req, { params }) {
  try {
    const ctx = await getContext(req);
    requireContentAccess(ctx);
    const { sectionId } = await params;
    const body = await parseJson(req, completeSchema);

    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) return jsonError("Sección no encontrada", 404);

    await prisma.userSectionProgress.upsert({
      where: { userId_sectionId: { userId: ctx.userId, sectionId } },
      update: { completedAt: new Date(), score: body.score ?? null },
      create: { userId: ctx.userId, sectionId, completedAt: new Date(), score: body.score ?? null },
    });

    const unitProgress = await recomputeUnitProgress(ctx.userId, section.unitId);

    return Response.json({ unitProgress });
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

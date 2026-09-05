import { z } from "zod";
import { getContext } from "@/lib/context";
import { jsonError, parseJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const finishSchema = z.object({
  score: z.number().int().min(0),
  won: z.boolean(),
});

export async function PATCH(req, { params }) {
  try {
    const ctx = await getContext(req);
    const { sessionId } = await params;
    const body = await parseJson(req, finishSchema);

    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== ctx.userId) return jsonError("Sesión de juego no encontrada", 404);

    const updated = await prisma.gameSession.update({
      where: { id: sessionId },
      data: { score: body.score, wonAt: body.won ? new Date() : null },
    });

    return Response.json(updated);
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

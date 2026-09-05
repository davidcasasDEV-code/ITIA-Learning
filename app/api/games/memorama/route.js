import { z } from "zod";
import { getContext } from "@/lib/context";
import { jsonError, parseJson } from "@/lib/http";
import { requireContentAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const startSchema = z.object({
  unitId: z.string().min(1),
});

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// El memorama usa el vocabulario de la unidad activa del usuario: cada
// tarjeta genera 2 fichas (término / definición) que hay que emparejar.
// Sirve de plantilla para los demás GameType del roadmap (sopa de letras,
// puzzle, adivina quién) — todos comparten GameSession con un `payload` Json.
export async function POST(req) {
  try {
    const ctx = await getContext(req);
    requireContentAccess(ctx);
    const body = await parseJson(req, startSchema);

    const unit = await prisma.unit.findUnique({
      where: { id: body.unitId },
      include: { level: true, sections: { where: { type: "VOCABULARY" }, include: { vocabularyCards: true } } },
    });

    if (!unit) return jsonError("Unidad no encontrada", 404);

    const cards = (unit.sections[0]?.vocabularyCards || []).filter((c) => c.status === "ACTIVE").slice(0, 8);

    if (cards.length < 2) {
      return jsonError("Esta unidad todavía no tiene suficiente vocabulario para el memorama.", 400);
    }

    const tiles = shuffle(
      cards.flatMap((card) => [
        { pairId: card.id, kind: "term", label: card.term },
        { pairId: card.id, kind: "definition", label: card.definition },
      ])
    ).map((tile, index) => ({ ...tile, tileId: `${index}-${tile.pairId}-${tile.kind}` }));

    const session = await prisma.gameSession.create({
      data: {
        userId: ctx.userId,
        gameType: "MEMORAMA",
        difficulty: unit.level.slug,
        opponentType: "BOT",
        payload: { unitId: unit.id, tiles },
      },
    });

    return Response.json({ sessionId: session.id, tiles });
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

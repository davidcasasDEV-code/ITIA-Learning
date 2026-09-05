import { getContext } from "@/lib/context";
import { jsonError } from "@/lib/http";
import { requireContentAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const ctx = await getContext(req);
    requireContentAccess(ctx);
    const { unitId } = await params;

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        level: true,
        sections: {
          orderBy: { type: "asc" },
          include: {
            vocabularyCards: { where: { status: "ACTIVE" }, orderBy: { order: "asc" } },
            exerciseItems: { where: { status: "ACTIVE" }, orderBy: { order: "asc" } },
            dialogItems: { orderBy: { order: "asc" } },
            intonationItems: { orderBy: { order: "asc" } },
            pronunciationItems: { orderBy: { order: "asc" } },
            comprehensionItems: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!unit) return jsonError("Unidad no encontrada", 404);

    const sectionProgress = await prisma.userSectionProgress.findMany({
      where: { userId: ctx.userId, section: { unitId } },
    });
    const progressBySection = Object.fromEntries(sectionProgress.map((p) => [p.sectionId, p]));

    return Response.json({
      id: unit.id,
      title: unit.title,
      order: unit.order,
      level: { slug: unit.level.slug, name: unit.level.name },
      sections: unit.sections.map((section) => ({
        id: section.id,
        type: section.type,
        completedAt: progressBySection[section.id]?.completedAt || null,
        vocabularyCards: section.vocabularyCards,
        exerciseItems: section.exerciseItems,
        dialogItems: section.dialogItems,
        intonationItems: section.intonationItems,
        pronunciationItems: section.pronunciationItems,
        comprehensionItems: section.comprehensionItems,
      })),
    });
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

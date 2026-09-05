import { getContext } from "@/lib/context";
import { jsonError } from "@/lib/http";
import { requireContentAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const ctx = await getContext(req);
    requireContentAccess(ctx);

    const [levels, unitProgress, levelBadges] = await Promise.all([
      prisma.level.findMany({
        orderBy: { order: "asc" },
        include: {
          units: {
            orderBy: { order: "asc" },
            where: { status: "ACTIVE" },
            include: { _count: { select: { sections: true } } },
          },
        },
      }),
      prisma.userUnitProgress.findMany({ where: { userId: ctx.userId } }),
      prisma.userLevelBadge.findMany({ where: { userId: ctx.userId } }),
    ]);

    const progressByUnit = Object.fromEntries(unitProgress.map((p) => [p.unitId, p]));
    const unlockedLevels = new Set(levelBadges.map((b) => b.level));

    const payload = levels.map((level) => ({
      id: level.id,
      slug: level.slug,
      name: level.name,
      order: level.order,
      unlocked: level.order === 0 || unlockedLevels.has(previousLevelSlug(levels, level)),
      units: level.units.map((unit) => ({
        id: unit.id,
        title: unit.title,
        order: unit.order,
        totalSections: unit._count.sections,
        stars: progressByUnit[unit.id]?.stars || 0,
        completed: Boolean(progressByUnit[unit.id]?.completedAt),
      })),
    }));

    return Response.json(payload);
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

function previousLevelSlug(levels, level) {
  const previous = levels.find((item) => item.order === level.order - 1);
  return previous?.slug;
}

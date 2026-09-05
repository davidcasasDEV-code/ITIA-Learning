import { prisma } from "./prisma.js";

// Una unidad tiene 6 secciones (Dialogs/Vocabulary/Exercises/Intonation/
// Pronunciation/Comprehension); las "estrellas" de la unidad son cuántas de
// esas 6 ya completó el usuario. Al llegar a 6/6 la unidad queda completa; si
// las 9 unidades de un nivel quedan completas, se desbloquea la medalla de
// ese nivel (y con ella el siguiente nivel).
export async function recomputeUnitProgress(userId, unitId) {
  const [totalSections, completedSections] = await Promise.all([
    prisma.section.count({ where: { unitId } }),
    prisma.userSectionProgress.count({
      where: { userId, section: { unitId }, completedAt: { not: null } },
    }),
  ]);

  const stars = completedSections;
  const completed = totalSections > 0 && completedSections >= totalSections;

  const unitProgress = await prisma.userUnitProgress.upsert({
    where: { userId_unitId: { userId, unitId } },
    update: { stars, completedAt: completed ? new Date() : null },
    create: { userId, unitId, stars, completedAt: completed ? new Date() : null },
  });

  if (completed) {
    await maybeUnlockLevelBadge(userId, unitId);
  }

  return unitProgress;
}

async function maybeUnlockLevelBadge(userId, unitId) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId }, include: { level: true } });
  if (!unit) return;

  const [totalUnits, completedUnits] = await Promise.all([
    prisma.unit.count({ where: { levelId: unit.levelId, status: "ACTIVE" } }),
    prisma.userUnitProgress.count({
      where: { userId, completedAt: { not: null }, unit: { levelId: unit.levelId } },
    }),
  ]);

  if (totalUnits > 0 && completedUnits >= totalUnits) {
    await prisma.userLevelBadge.upsert({
      where: { userId_level: { userId, level: unit.level.slug } },
      update: {},
      create: { userId, level: unit.level.slug },
    });
  }
}

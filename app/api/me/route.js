import { getContext } from "@/lib/context";
import { getTrialDaysRemaining, getTrialEndDate, hasActiveAccess } from "@/lib/billing";
import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

async function ensureSubscription(userId) {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) return existing;

  // Primer login: arranca el trial de 7 días con acceso completo (incluido
  // Pro) sin necesidad de que el usuario elija plan todavía.
  return prisma.subscription.create({
    data: {
      userId,
      status: "TRIALING",
      trialEndsAt: getTrialEndDate(),
    },
  });
}

export async function GET(req) {
  try {
    const ctx = await getContext(req);
    await ensureSubscription(ctx.userId);

    const [subscription, levelBadges, unitProgress, placementAttempts] = await Promise.all([
      prisma.subscription.findUnique({ where: { userId: ctx.userId }, include: { plan: true } }),
      prisma.userLevelBadge.findMany({ where: { userId: ctx.userId } }),
      prisma.userUnitProgress.findMany({ where: { userId: ctx.userId } }),
      prisma.placementTestAttempt.findMany({ where: { userId: ctx.userId }, orderBy: { createdAt: "desc" }, take: 1 }),
    ]);

    const totalStars = unitProgress.reduce((sum, item) => sum + item.stars, 0);

    return Response.json({
      demoMode: ctx.demoMode,
      user: {
        id: ctx.user.id,
        publicHandle: ctx.user.publicHandle,
        displayName: ctx.user.displayName,
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        phone: ctx.user.phone,
        address: ctx.user.address,
        role: ctx.user.role,
        ageGroup: ctx.user.ageGroup,
        commentsBlocked: ctx.user.commentsBlocked,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            planSlug: subscription.plan?.slug || null,
            planName: subscription.plan?.name || null,
            trialEndsAt: subscription.trialEndsAt,
            trialDaysRemaining: getTrialDaysRemaining(subscription),
            hasActiveAccess: hasActiveAccess(subscription),
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      progress: {
        totalStars,
        unitsStarted: unitProgress.length,
        levelBadges: levelBadges.map((badge) => badge.level),
        hasPlacementAttempt: placementAttempts.length > 0,
      },
    });
  } catch (error) {
    return jsonError(error, 500);
  }
}

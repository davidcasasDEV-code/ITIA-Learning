import { getContext } from "@/lib/context";
import { jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const ctx = await getContext(req);
    requireAdmin(ctx);

    const [totalUsers, byStatus, byActivePlan, plans] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.subscription.groupBy({
        by: ["planId"],
        where: { status: { in: ["ACTIVE", "PAST_DUE"] }, planId: { not: null } },
        _count: { _all: true },
      }),
      prisma.plan.findMany({ orderBy: { priceAmount: "asc" } }),
    ]);

    const statusCounts = Object.fromEntries(byStatus.map((row) => [row.status, row._count._all]));
    const activeSubscribers = (statusCounts.ACTIVE || 0) + (statusCounts.PAST_DUE || 0);
    const activeCountByPlanId = Object.fromEntries(byActivePlan.map((row) => [row.planId, row._count._all]));
    // Placeholder de ingresos: no depende todavía de la facturación real de
    // Stripe (ver docs/aws-setup.md, fase 2 conecta invoices reales por mes/año).
    const estimatedMonthlyRevenueCents = plans.reduce((sum, plan) => {
      const subscribersOnPlan = activeCountByPlanId[plan.id] || 0;
      return sum + subscribersOnPlan * plan.priceAmount;
    }, 0);

    return Response.json({
      totalUsers,
      subscriptionsByStatus: statusCounts,
      activeSubscribers,
      trialUsers: statusCounts.TRIALING || 0,
      estimatedMonthlyRevenueCents,
      plans,
    });
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

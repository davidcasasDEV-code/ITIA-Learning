import { z } from "zod";
import { audit } from "@/lib/audit";
import { getContext } from "@/lib/context";
import { jsonError, parseJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const cancelSchema = z.object({
  reason: z.enum(["muy_caro", "no_lo_use", "cambio_plataforma", "funcionalidad_faltante", "otro"]),
  comment: z.string().max(1000).optional(),
});

export async function POST(req) {
  try {
    const ctx = await getContext(req);
    const body = await parseJson(req, cancelSchema);

    const subscription = await prisma.subscription.findUnique({ where: { userId: ctx.userId } });

    if (!subscription || !["TRIALING", "ACTIVE", "PAST_DUE"].includes(subscription.status)) {
      return jsonError("No tienes una suscripción activa para cancelar.", 404);
    }

    if (subscription.stripeSubscriptionId) {
      await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: { cancellationReason: body.reason },
      });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancellationReason: body.reason,
      },
    });

    await audit(req, ctx, {
      action: "billing.subscription_cancel_requested",
      entity: "subscription",
      entityId: subscription.id,
      metadata: body,
    });

    return Response.json(updated);
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

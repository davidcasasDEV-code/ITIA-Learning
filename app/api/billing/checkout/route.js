import { z } from "zod";
import { audit } from "@/lib/audit";
import { getContext } from "@/lib/context";
import { jsonError, parseJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";

const checkoutSchema = z.object({
  planSlug: z.enum(["basic", "pro"]),
});

export async function POST(req) {
  try {
    const ctx = await getContext(req);
    const body = await parseJson(req, checkoutSchema);

    const plan = await prisma.plan.findUnique({ where: { slug: body.planSlug } });

    if (!plan?.stripePriceId) {
      return jsonError("Este plan todavía no tiene un precio de Stripe configurado.", 400);
    }

    const session = await createCheckoutSession({ plan, user: ctx.user });

    await audit(req, ctx, {
      action: "billing.checkout_started",
      entity: "user",
      entityId: ctx.userId,
      metadata: { planId: plan.id, sessionId: session.id },
    });

    return Response.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toStripeSubscriptionStatus } from "@/lib/billing";
import { verifyStripeWebhook } from "@/lib/stripe";

export const runtime = "nodejs";

function fromStripeTimestamp(value) {
  return value ? new Date(value * 1000) : null;
}

async function upsertSubscriptionFromStripe(subscription, fallbackUserId = null, fallbackPlanId = null) {
  const userId = subscription.metadata?.userId || fallbackUserId;
  const planId = subscription.metadata?.planId || fallbackPlanId;

  if (!userId) {
    throw new Error(`Stripe subscription ${subscription.id} missing userId metadata`);
  }

  const data = {
    planId,
    status: toStripeSubscriptionStatus(subscription.status),
    stripeCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
    currentPeriodStart: fromStripeTimestamp(subscription.current_period_start),
    currentPeriodEnd: fromStripeTimestamp(subscription.current_period_end),
    trialEndsAt: fromStripeTimestamp(subscription.trial_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    canceledAt: fromStripeTimestamp(subscription.canceled_at),
  };

  return prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: data,
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      ...data,
    },
  });
}

export async function POST(req) {
  try {
    const event = await verifyStripeWebhook(req);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const stripeSubscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (stripeSubscriptionId && userId) {
          await prisma.subscription.upsert({
            where: { stripeSubscriptionId },
            update: {
              userId,
              planId,
              stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
              status: "INCOMPLETE",
            },
            create: {
              userId,
              planId,
              stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
              stripeSubscriptionId,
              status: "INCOMPLETE",
            },
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscriptionFromStripe(event.data.object);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const stripeSubscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        const subscription = stripeSubscriptionId
          ? await prisma.subscription.findUnique({ where: { stripeSubscriptionId } })
          : null;

        if (subscription) {
          await prisma.invoice.upsert({
            where: { stripeInvoiceId: invoice.id },
            update: {
              userId: subscription.userId,
              status: event.type === "invoice.paid" ? "PAID" : "FAILED",
              amountPaid: invoice.amount_paid,
              currency: invoice.currency || "usd",
              paidAt: fromStripeTimestamp(invoice.status_transitions?.paid_at),
              errorMessage: event.type === "invoice.payment_failed" ? "Stripe payment failed" : null,
            },
            create: {
              userId: subscription.userId,
              stripeInvoiceId: invoice.id,
              status: event.type === "invoice.paid" ? "PAID" : "FAILED",
              amountPaid: invoice.amount_paid,
              currency: invoice.currency || "usd",
              paidAt: fromStripeTimestamp(invoice.status_transitions?.paid_at),
              errorMessage: event.type === "invoice.payment_failed" ? "Stripe payment failed" : null,
            },
          });
        }
        break;
      }

      case "customer.subscription.trial_will_end":
        break;

      default:
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    return jsonError(error, 400);
  }
}

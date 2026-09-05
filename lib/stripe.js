import Stripe from "stripe";
import { getEnv, getRequiredEnv } from "./env.js";

let stripe;

export function getStripe() {
  stripe ||= new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2025-04-30.basil",
  });

  return stripe;
}

export async function createCheckoutSession({ plan, user }) {
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: plan.trialDays,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
    },
    metadata: {
      userId: user.id,
      planId: plan.id,
    },
    success_url: getEnv("STRIPE_SUCCESS_URL"),
    cancel_url: getEnv("STRIPE_CANCEL_URL"),
    allow_promotion_codes: true,
  });

  return session;
}

export async function createBillingPortalSession({ stripeCustomerId }) {
  return getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: getEnv("STRIPE_SUCCESS_URL"),
  });
}

export async function verifyStripeWebhook(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    throw new Error("Missing stripe-signature header");
  }

  return getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    getRequiredEnv("STRIPE_WEBHOOK_SECRET")
  );
}

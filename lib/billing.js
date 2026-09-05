const TRIAL_DAYS = 7;

export function toStripeSubscriptionStatus(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "TRIALING") return "TRIALING";
  if (normalized === "ACTIVE") return "ACTIVE";
  if (normalized === "PAST_DUE") return "PAST_DUE";
  if (normalized === "CANCELED") return "CANCELED";
  if (normalized === "UNPAID") return "UNPAID";

  return "INCOMPLETE";
}

export function getTrialEndDate(from = new Date()) {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end;
}

// Un usuario tiene acceso al contenido si está en prueba vigente o si su
// suscripción está activa/en gracia (PAST_DUE deja un pequeño margen antes de
// cortar el acceso, igual que hace Stripe con "past_due" antes de cancelar).
export function hasActiveAccess(subscription) {
  if (!subscription) return false;

  if (subscription.status === "TRIALING") {
    return !subscription.trialEndsAt || new Date(subscription.trialEndsAt) > new Date();
  }

  return subscription.status === "ACTIVE" || subscription.status === "PAST_DUE";
}

export function getTrialDaysRemaining(subscription) {
  if (!subscription?.trialEndsAt) return 0;
  const diffMs = new Date(subscription.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export const TRIAL_PERIOD_DAYS = TRIAL_DAYS;

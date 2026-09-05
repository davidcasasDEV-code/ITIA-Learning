import { hasActiveAccess } from "./billing.js";
import { getCognitoGroups, getTokenFromRequest, verifyCognitoToken } from "./auth.js";
import { getEnv } from "./env.js";
import { prisma } from "./prisma.js";

function randomHandleSuffix() {
  return Math.floor(100 + Math.random() * 900);
}

async function generatePublicHandle(baseName, email) {
  const base = (baseName || email.split("@")[0] || "user")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 16) || "user";

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = `@${base}_${randomHandleSuffix()}`;
    const exists = await prisma.user.findUnique({ where: { publicHandle: candidate } });
    if (!exists) return candidate;
  }

  return `@${base}_${Date.now()}`;
}

async function upsertUserFromClaims(payload, role) {
  const cognitoSub = payload.sub;
  const username = typeof payload.username === "string" ? payload.username : "";
  const emailFromClaims = payload.email || (username.includes("@") ? username : "");
  const fallbackEmail = `${cognitoSub}@cognito.local`;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { cognitoSub },
        ...(emailFromClaims ? [{ email: emailFromClaims.toLowerCase() }] : []),
      ],
    },
  });

  const email = emailFromClaims ? emailFromClaims.toLowerCase() : existing?.email || fallbackEmail;
  const displayName = payload.name || payload.given_name || existing?.displayName || email.split("@")[0];

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        cognitoSub,
        email,
        displayName,
        emailVerified: payload.email_verified === true,
        lastLoginAt: new Date(),
      },
      include: { subscription: { include: { plan: true } } },
    });
  }

  const publicHandle = await generatePublicHandle(displayName, email);

  // Bootstrap: antes de tener Cognito configurado con el grupo Admin, el
  // primer usuario que se registra en una instalación nueva queda como
  // ADMIN automáticamente (no hay ningún otro Admin todavía). Después de
  // eso, el rol lo define el grupo de Cognito como es normal.
  const hasAdmin = (await prisma.user.count({ where: { role: "ADMIN" } })) > 0;
  const resolvedRole = !hasAdmin ? "ADMIN" : role;

  return prisma.user.create({
    data: {
      cognitoSub,
      email,
      displayName,
      publicHandle,
      role: resolvedRole,
      emailVerified: payload.email_verified === true,
      lastLoginAt: new Date(),
    },
    include: { subscription: { include: { plan: true } } },
  });
}

export async function getContext(req, options = {}) {
  const { token: tokenOverride = null } = options;
  const token = tokenOverride || getTokenFromRequest(req);
  const claims = await verifyCognitoToken(token);
  const groups = getCognitoGroups(claims);
  const adminGroup = getEnv("COGNITO_ADMIN_GROUP", "Admin");
  const teacherGroup = getEnv("COGNITO_TEACHER_GROUP", "Teacher");
  const role = groups.includes(adminGroup) ? "ADMIN" : groups.includes(teacherGroup) ? "TEACHER" : "USER";
  const user = await upsertUserFromClaims(claims, role);

  const subscription = user.subscription
    ? {
        ...user.subscription,
        planSlug: user.subscription.plan?.slug || null,
        hasActiveAccess: hasActiveAccess(user.subscription),
      }
    : null;

  return {
    claims,
    groups,
    user,
    userId: user.id,
    role: user.role,
    subscription,
  };
}

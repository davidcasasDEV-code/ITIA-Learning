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

const DEMO_EMAIL = "demo@itia-learning.local";
const DEMO_COGNITO_SUB = "demo-bypass-user";

// Bypass temporal para previsualizar la app ANTES de tener Cognito
// configurado: se activa solo con DEMO_MODE=true (ver .env.example) y crea/
// reusa un único usuario de demostración sin verificar ningún token. Nunca se
// activa a menos que tú mismo pongas esa variable — quítala en cuanto
// Cognito esté listo para que las rutas vuelvan a exigir sesión real.
async function getOrCreateDemoUser() {
  const role = getEnv("DEMO_ROLE", "ADMIN");
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { subscription: { include: { plan: true } } },
  });

  if (existing) {
    if (existing.role === role) return existing;
    return prisma.user.update({
      where: { id: existing.id },
      data: { role },
      include: { subscription: { include: { plan: true } } },
    });
  }

  return prisma.user.create({
    data: {
      cognitoSub: DEMO_COGNITO_SUB,
      email: DEMO_EMAIL,
      displayName: "Demo",
      publicHandle: "@demo",
      role,
      emailVerified: true,
    },
    include: { subscription: { include: { plan: true } } },
  });
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
  const demoMode = getEnv("DEMO_MODE") === "true";
  const { token: tokenOverride = null } = options;

  let claims = null;
  let groups = [];
  let user;

  if (demoMode) {
    user = await getOrCreateDemoUser();
  } else {
    const token = tokenOverride || getTokenFromRequest(req);
    claims = await verifyCognitoToken(token);
    groups = getCognitoGroups(claims);
    const adminGroup = getEnv("COGNITO_ADMIN_GROUP", "Admin");
    const teacherGroup = getEnv("COGNITO_TEACHER_GROUP", "Teacher");
    const role = groups.includes(adminGroup) ? "ADMIN" : groups.includes(teacherGroup) ? "TEACHER" : "USER";
    user = await upsertUserFromClaims(claims, role);
  }

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
    demoMode,
  };
}

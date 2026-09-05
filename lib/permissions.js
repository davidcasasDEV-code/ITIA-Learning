export function isAdmin(role) {
  return role === "ADMIN";
}

export function isTeacher(role) {
  return role === "TEACHER";
}

export function requireAdmin(ctx) {
  if (!isAdmin(ctx.role)) {
    const error = new Error("Admin access required");
    error.status = 403;
    throw error;
  }
}

export function requireTeacher(ctx) {
  if (!isTeacher(ctx.role) && !isAdmin(ctx.role)) {
    const error = new Error("Teacher access required");
    error.status = 403;
    throw error;
  }
}

// El plan PRO desbloquea Cine y Citas con Maestros. Durante los 7 días de
// prueba cualquier usuario tiene acceso completo (incluido Pro); al vencer
// el trial solo lo conservan quienes tengan el plan Pro activo. Un Admin
// siempre tiene acceso completo para poder probar/curar ese contenido.
export function canAccessPro(ctx) {
  if (isAdmin(ctx.role)) return true;
  if (!ctx.subscription?.hasActiveAccess) return false;
  return ctx.subscription.planSlug === "pro" || ctx.subscription.status === "TRIALING";
}

// Cualquier suscripción activa o en periodo de prueba (7 días) da acceso al
// contenido base del curso. Fuera de eso, el usuario ve el paywall.
export function canAccessContent(ctx) {
  if (isAdmin(ctx.role)) return true;
  return ctx.subscription?.hasActiveAccess === true;
}

export function canRateTeacher(hasAttendedAppointment) {
  return hasAttendedAppointment === true;
}

export function requireContentAccess(ctx) {
  if (canAccessContent(ctx)) return;
  const error = new Error("Tu prueba gratuita terminó. Suscríbete para seguir viendo el contenido.");
  error.status = 402;
  throw error;
}

export function requireProAccess(ctx) {
  if (canAccessPro(ctx)) return;
  const error = new Error("Esta sección requiere el Plan Pro (incluye Cine y Maestros).");
  error.status = 402;
  throw error;
}

"use client";

import Link from "next/link";
import { Badge, Container, COLORS } from "./ui-kit";

export function AppShell({ me, children }) {
  const subscription = me?.subscription;
  const trial = subscription?.status === "TRIALING";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {me?.demoMode && (
        <div
          style={{
            background: "#111827",
            color: "#fde68a",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 700,
            padding: "6px 12px",
          }}
        >
          ⚠️ DEMO_MODE activo: no hay login real, todos ven la sesión de "{me.user?.publicHandle}". Quita
          DEMO_MODE de las variables de entorno antes de invitar usuarios de verdad.
        </div>
      )}
      <header style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
        <Container style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/dashboard" style={{ textDecoration: "none", fontWeight: 900, fontSize: 20, color: COLORS.blue }}>
            ITIA Learning
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {trial && <Badge color={COLORS.yellow}>{subscription.trialDaysRemaining} días de prueba</Badge>}
            {!trial && subscription?.planSlug && (
              <Badge color={subscription.planSlug === "pro" ? COLORS.purple : COLORS.blue}>
                Plan {subscription.planSlug === "pro" ? "Pro" : "Basic"}
              </Badge>
            )}
            {me?.user?.role === "ADMIN" && (
              <Link href="/admin" style={{ fontWeight: 700, color: COLORS.textMuted, textDecoration: "none" }}>
                Admin
              </Link>
            )}
            <span style={{ fontWeight: 700, color: COLORS.textMuted }}>{me?.user?.publicHandle}</span>
            <a href="/api/auth/logout" style={{ fontWeight: 700, color: COLORS.pink, textDecoration: "none" }}>
              Salir
            </a>
          </nav>
        </Container>
      </header>
      <main>{children}</main>
    </div>
  );
}

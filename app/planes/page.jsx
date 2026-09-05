"use client";

import { useEffect, useState } from "react";
import { Btn, Card, Container } from "../components/ui-kit";

const PLANS = [
  {
    slug: "basic",
    name: "Plan Basic",
    price: "$9",
    color: "var(--brand-blue)",
    features: [
      "Niveles Basic, Medium y Advanced completos",
      "Exámenes, medallas y estrellas de progreso",
      "Minijuegos (memorama y más)",
      "Comunidad: comparte tu propio contenido",
    ],
  },
  {
    slug: "pro",
    name: "Plan Pro",
    price: "$19",
    color: "var(--brand-purple)",
    features: [
      "Todo lo del Plan Basic",
      "Cine con transcripción pausable",
      "Citas con maestros (agenda, favoritos, calificaciones)",
      "Grupos de hasta 10 personas por clase",
    ],
  },
];

export default function PlanesPage() {
  const [me, setMe] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
      .catch(() => {});
  }, []);

  async function choosePlan(slug) {
    setError("");
    setLoadingPlan(slug);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago.");
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(e.message);
      setLoadingPlan("");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", padding: "50px 0" }}>
      <Container>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: 34, fontWeight: 900, margin: "0 0 8px" }}>Elige tu plan</h1>
          <p style={{ color: "var(--neutral-500)" }}>
            {me?.subscription?.status === "TRIALING"
              ? `Te quedan ${me.subscription.trialDaysRemaining} día(s) de prueba gratis.`
              : "Cancela cuando quieras."}
          </p>
        </div>

        {error && (
          <div style={{ maxWidth: 480, margin: "0 auto 20px", color: "#991b1b", textAlign: "center" }}>{error}</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, maxWidth: 800, margin: "0 auto" }}>
          {PLANS.map((plan) => (
            <Card key={plan.slug} style={{ borderTop: `5px solid ${plan.color}`, padding: 28 }}>
              <div style={{ fontWeight: 900, fontSize: 20 }}>{plan.name}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: plan.color, margin: "10px 0" }}>
                {plan.price}
                <span style={{ fontSize: 16, color: "var(--neutral-400)", fontWeight: 700 }}> /mes</span>
              </div>
              <ul style={{ padding: 0, listStyle: "none", margin: "0 0 22px", display: "grid", gap: 8 }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--neutral-600)" }}>
                    <span style={{ color: plan.color }}>✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Btn
                full
                size="lg"
                variant={plan.slug === "pro" ? "pro" : "primary"}
                disabled={loadingPlan === plan.slug}
                onClick={() => choosePlan(plan.slug)}
              >
                {loadingPlan === plan.slug ? "Redirigiendo…" : "Elegir " + plan.name}
              </Btn>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}

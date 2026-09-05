import Link from "next/link";
import { Btn, Card, Container } from "./components/ui-kit";
import { SECTION_META, LEVEL_META } from "./components/theme";

const PILLARS = ["DIALOGS", "VOCABULARY", "EXERCISES", "INTONATION", "PRONUNCIATION", "COMPREHENSION"];

export default function HomePage() {
  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>
      <header style={{ padding: "18px 0" }}>
        <Container style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900, fontSize: 22, color: "var(--brand-blue)" }}>ITIA Learning</div>
          <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/planes" style={{ textDecoration: "none", color: "var(--foreground)", fontWeight: 700 }}>
              Planes
            </Link>
            <Link href="/login">
              <Btn variant="outline" size="sm">Iniciar sesión</Btn>
            </Link>
            <a href="/api/auth/signup">
              <Btn size="sm">Crear cuenta gratis</Btn>
            </a>
          </nav>
        </Container>
      </header>

      <section style={{ padding: "60px 0 40px" }}>
        <Container style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 40, alignItems: "center" }} >
          <div>
            <h1 style={{ fontSize: 46, lineHeight: 1.1, margin: "0 0 16px", fontWeight: 900 }}>
              Aprende inglés <span style={{ background: "var(--gradient-hero)", WebkitBackgroundClip: "text", color: "transparent" }}>jugando</span>
            </h1>
            <p style={{ fontSize: 18, color: "var(--neutral-600)", maxWidth: 520, marginBottom: 28 }}>
              Diálogos, vocabulario, ejercicios, entonación, pronunciación y comprensión auditiva
              en un solo lugar — con minijuegos, exámenes y medallas de progreso desde el nivel
              Basic hasta Advanced.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="/api/auth/signup">
                <Btn size="lg">Empezar prueba gratis de 7 días</Btn>
              </a>
              <Link href="/planes">
                <Btn variant="outline" size="lg">Ver planes</Btn>
              </Link>
            </div>
          </div>
          <Card style={{ padding: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
              {PILLARS.map((type) => {
                const meta = SECTION_META[type];
                return (
                  <div key={type} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        margin: "0 auto 8px",
                        borderRadius: "50%",
                        border: `3px solid ${meta.color}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      {meta.icon}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: meta.color }}>{meta.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Container>
      </section>

      <section style={{ padding: "40px 0" }}>
        <Container>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 20 }}>Tres niveles, un mismo viaje</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {Object.entries(LEVEL_META).map(([slug, meta]) => (
              <Card key={slug} hover style={{ borderTop: `4px solid ${meta.color}` }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: meta.color }}>{meta.label}</div>
                <p style={{ color: "var(--neutral-500)", marginTop: 8 }}>
                  9 unidades · 6 pilares por unidad · exámenes y medallas de progreso.
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section style={{ padding: "50px 0 90px" }}>
        <Container>
          <Card style={{ background: "var(--gradient-cta)", color: "#fff", padding: 40, textAlign: "center" }}>
            <h2 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 10px" }}>
              Empieza gratis. Sin tarjeta de crédito.
            </h2>
            <p style={{ opacity: 0.9, marginBottom: 22 }}>
              7 días de prueba con acceso completo, incluido el Plan Pro (Cine + Maestros).
            </p>
            <a href="/api/auth/signup">
              <Btn variant="outline" size="lg" style={{ background: "#fff", color: "var(--brand-purple-deep)" }}>
                Crear mi cuenta
              </Btn>
            </a>
          </Card>
        </Container>
      </section>
    </main>
  );
}

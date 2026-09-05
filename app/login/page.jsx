import { Btn, Card, Container } from "../components/ui-kit";

const ERROR_MESSAGES = {
  cognito_token: "Cognito no pudo intercambiar el código de autorización por una sesión.",
  invalid_session: "Cognito devolvió una sesión, pero la app no pudo validarla.",
  missing_code: "Cognito regresó sin código de autorización.",
};

export default async function LoginPage({ searchParams }) {
  const params = (await searchParams) || {};
  const error = params?.error;
  const demoMode = process.env.DEMO_MODE === "true";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--gradient-hero)",
      }}
    >
      <Container style={{ maxWidth: 440 }}>
        <Card style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 24, color: "var(--brand-blue)", marginBottom: 6 }}>
            ITIA Learning
          </div>
          <p style={{ color: "var(--neutral-500)", marginBottom: 24 }}>
            Cursos de inglés con diálogos, juegos, cine y maestros.
          </p>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#991b1b",
                borderRadius: 12,
                padding: 12,
                marginBottom: 18,
                fontSize: 14,
                textAlign: "left",
              }}
            >
              {ERROR_MESSAGES[error] || "No pudimos completar el inicio de sesión."}
            </div>
          )}

          {demoMode ? (
            <>
              <div
                style={{
                  background: "#fffbeb",
                  color: "#92400e",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 18,
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                ⚠️ DEMO_MODE está activo: el login real de Cognito está desactivado y todos entran
                como el mismo usuario de demostración.
              </div>
              <a href="/dashboard" style={{ display: "block" }}>
                <Btn full size="lg">Entrar en modo demo</Btn>
              </a>
            </>
          ) : (
            <>
              <a href="/api/auth/login" style={{ display: "block", marginBottom: 12 }}>
                <Btn full size="lg">Iniciar sesión</Btn>
              </a>
              <a href="/api/auth/signup" style={{ display: "block" }}>
                <Btn full size="lg" variant="outline">Crear cuenta (7 días gratis)</Btn>
              </a>
            </>
          )}
        </Card>
      </Container>
    </main>
  );
}

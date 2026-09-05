"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { PlacementTestModal } from "../components/placement-test-modal";
import { Btn, Card, Container, COLORS, LEVEL_META, ProgressDots, StarRow } from "../components/ui-kit";

const PLACEMENT_DISMISSED_KEY = "itia_placement_dismissed";

export default function DashboardPage() {
  const [me, setMe] = useState(null);
  const [levels, setLevels] = useState([]);
  const [activeLevelSlug, setActiveLevelSlug] = useState("BASIC");
  const [loading, setLoading] = useState(true);
  const [showPlacement, setShowPlacement] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const meRes = await fetch("/api/me", { credentials: "include" });
      const meData = await meRes.json();
      if (!meRes.ok) throw new Error(meData.error || "No se pudo cargar tu perfil.");
      setMe(meData);

      const curriculumRes = await fetch("/api/curriculum", { credentials: "include" });
      const curriculumData = await curriculumRes.json();
      if (!curriculumRes.ok) throw new Error(curriculumData.error || "No se pudo cargar el currículo.");
      setLevels(curriculumData);

      const isBrandNew = meData.progress.unitsStarted === 0 && !meData.progress.hasPlacementAttempt;
      const dismissed = typeof window !== "undefined" && localStorage.getItem(PLACEMENT_DISMISSED_KEY);
      if (isBrandNew && !dismissed) setShowPlacement(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function dismissPlacement(recommendedLevel) {
    localStorage.setItem(PLACEMENT_DISMISSED_KEY, "1");
    setShowPlacement(false);
    if (recommendedLevel) setActiveLevelSlug(recommendedLevel);
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p>Cargando…</p>
      </main>
    );
  }

  if (error === "Tu prueba gratuita terminó. Suscríbete para seguir viendo el contenido.") {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
        <Card style={{ maxWidth: 440, textAlign: "center", padding: 32 }}>
          <h2>Tu prueba gratuita terminó</h2>
          <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>
            Suscríbete para seguir con tus unidades, exámenes y medallas.
          </p>
          <Link href="/planes">
            <Btn full size="lg">Ver planes</Btn>
          </Link>
        </Card>
      </main>
    );
  }

  const activeLevel = levels.find((l) => l.slug === activeLevelSlug) || levels[0];

  return (
    <AppShell me={me}>
      {showPlacement && (
        <PlacementTestModal
          onClose={() => dismissPlacement()}
          onFinished={(result) => dismissPlacement(result.recommendedLevel)}
        />
      )}

      <Container style={{ padding: "32px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26 }}>Hola, {me.user.displayName} 👋</h1>
            <p style={{ margin: "4px 0 0", color: COLORS.textMuted }}>
              {me.progress.totalStars} estrellas · {me.progress.levelBadges.length} medalla(s)
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {me.progress.levelBadges.map((level) => (
              <span key={level} title={`Medalla ${level}`} style={{ fontSize: 30 }}>
                🎖️
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {levels.map((level) => (
            <button
              key={level.slug}
              onClick={() => level.unlocked && setActiveLevelSlug(level.slug)}
              disabled={!level.unlocked}
              style={{
                border: "none",
                borderRadius: 9999,
                padding: "10px 20px",
                fontWeight: 800,
                cursor: level.unlocked ? "pointer" : "not-allowed",
                background: activeLevelSlug === level.slug ? LEVEL_META[level.slug]?.color : COLORS.surfaceMuted,
                color: activeLevelSlug === level.slug ? "#fff" : COLORS.textMuted,
                opacity: level.unlocked ? 1 : 0.5,
              }}
            >
              {LEVEL_META[level.slug]?.label || level.name} {!level.unlocked && "🔒"}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="itia-grid-1-mobile">
          {activeLevel?.units.map((unit) => (
            <Card key={unit.id} hover style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{unit.title}</strong>
                {unit.completed && <span title="Unidad completa">✅</span>}
              </div>
              <StarRow count={unit.stars} total={unit.totalSections || 6} />
              <ProgressDots done={unit.stars} total={unit.totalSections || 6} color={LEVEL_META[activeLevelSlug]?.color} />
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <Link href={`/learn/${unit.id}`} style={{ flex: 1 }}>
                  <Btn full size="sm">{unit.stars > 0 ? "Continuar" : "Empezar"}</Btn>
                </Link>
                <Link href={`/games/memorama?unitId=${unit.id}`}>
                  <Btn size="sm" variant="outline">🎮</Btn>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </AppShell>
  );
}

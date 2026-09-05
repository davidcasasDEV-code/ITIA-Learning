"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { Btn, Card, Container, COLORS } from "../../components/ui-kit";

export default function MemoramaClient() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get("unitId");
  const [me, setMe] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [flipped, setFlipped] = useState([]); // indices actualmente boca arriba (máx. 2)
  const [matched, setMatched] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" }).then((r) => r.json()).then(setMe);
    startGame();
  }, [unitId]);

  async function startGame() {
    if (!unitId) return;
    const res = await fetch("/api/games/memorama", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo iniciar el memorama.");
      return;
    }
    setSessionId(data.sessionId);
    setTiles(data.tiles);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setFinished(false);
  }

  function flipTile(index) {
    if (flipped.length === 2) return;
    if (flipped.includes(index) || matched.has(index)) return;

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextFlipped;
      const isMatch = tiles[a].pairId === tiles[b].pairId && tiles[a].kind !== tiles[b].kind;

      setTimeout(async () => {
        if (isMatch) {
          const nextMatched = new Set(matched);
          nextMatched.add(a);
          nextMatched.add(b);
          setMatched(nextMatched);

          if (nextMatched.size === tiles.length) {
            const score = Math.max(0, 100 - (moves + 1) * 5);
            setFinished(true);
            await fetch(`/api/games/memorama/${sessionId}`, {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ score, won: true }),
            });
          }
        }
        setFlipped([]);
      }, 700);
    }
  }

  if (!unitId) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Card style={{ padding: 28 }}>
          <p>Elige una unidad desde tu panel para jugar memorama.</p>
          <Link href="/dashboard">
            <Btn>Ir al panel</Btn>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <AppShell me={me}>
      <Container style={{ padding: "28px 20px 60px", maxWidth: 720 }}>
        <Link href="/dashboard" style={{ color: COLORS.textMuted, fontWeight: 700, textDecoration: "none" }}>
          ← Volver al panel
        </Link>
        <h1 style={{ margin: "8px 0 20px" }}>Memorama de vocabulario 🎮</h1>

        {error && <Card style={{ padding: 20, color: "#991b1b" }}>{error}</Card>}

        {!error && tiles.length > 0 && (
          <>
            <p style={{ color: COLORS.textMuted, marginBottom: 16 }}>Movimientos: {moves}</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              {tiles.map((tile, index) => {
                const isFaceUp = flipped.includes(index) || matched.has(index);
                return (
                  <button
                    key={tile.tileId}
                    onClick={() => flipTile(index)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 14,
                      border: `2px solid ${COLORS.border}`,
                      background: isFaceUp ? COLORS.surface : COLORS.gradientHero,
                      color: isFaceUp ? COLORS.text : "#fff",
                      fontWeight: 700,
                      fontSize: 12,
                      padding: 6,
                      cursor: matched.has(index) ? "default" : "pointer",
                      opacity: matched.has(index) ? 0.5 : 1,
                    }}
                  >
                    {isFaceUp ? tile.label : "?"}
                  </button>
                );
              })}
            </div>

            {finished && (
              <Card style={{ marginTop: 24, padding: 24, textAlign: "center" }}>
                <h2>¡Completaste el memorama! 🎉</h2>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                  <Btn onClick={startGame}>Jugar de nuevo</Btn>
                  <Link href="/dashboard">
                    <Btn variant="outline">Volver al panel</Btn>
                  </Link>
                </div>
              </Card>
            )}
          </>
        )}
      </Container>
    </AppShell>
  );
}

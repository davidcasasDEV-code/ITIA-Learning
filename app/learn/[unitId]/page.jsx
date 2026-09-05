"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { Btn, Card, Container, COLORS, SECTION_META } from "../../components/ui-kit";

const SECTION_ORDER = ["DIALOGS", "VOCABULARY", "EXERCISES", "INTONATION", "PRONUNCIATION", "COMPREHENSION"];

export default function LearnUnitPage() {
  const { unitId } = useParams();
  const [me, setMe] = useState(null);
  const [unit, setUnit] = useState(null);
  const [activeType, setActiveType] = useState("DIALOGS");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me", { credentials: "include" }).then((r) => r.json()).then(setMe);
    loadUnit();
  }, [unitId]);

  async function loadUnit() {
    const res = await fetch(`/api/units/${unitId}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo cargar la unidad.");
      return;
    }
    setUnit(data);
    const firstIncomplete = SECTION_ORDER.find(
      (type) => !data.sections.find((s) => s.type === type)?.completedAt
    );
    setActiveType(firstIncomplete || "DIALOGS");
  }

  async function completeSection(sectionId, score) {
    await fetch(`/api/sections/${sectionId}/complete`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(score !== undefined ? { score } : {}),
    });
    await loadUnit();
  }

  if (error) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Card style={{ padding: 28, textAlign: "center" }}>
          <p>{error}</p>
          <Link href="/dashboard">
            <Btn>Volver al panel</Btn>
          </Link>
        </Card>
      </main>
    );
  }

  if (!unit || !me) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p>Cargando…</p>
      </main>
    );
  }

  const activeSection = unit.sections.find((s) => s.type === activeType);

  return (
    <AppShell me={me}>
      <Container style={{ padding: "28px 20px 60px" }}>
        <Link href="/dashboard" style={{ color: COLORS.textMuted, fontWeight: 700, textDecoration: "none" }}>
          ← Volver al panel
        </Link>
        <h1 style={{ margin: "8px 0 20px" }}>{unit.title}</h1>

        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {SECTION_ORDER.map((type) => {
            const section = unit.sections.find((s) => s.type === type);
            const meta = SECTION_META[type];
            const active = activeType === type;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                style={{
                  border: `2px solid ${meta.color}`,
                  background: active ? meta.color : "transparent",
                  color: active ? "#fff" : meta.color,
                  borderRadius: 9999,
                  padding: "8px 16px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                {meta.icon} {meta.label} {section?.completedAt ? "✓" : ""}
              </button>
            );
          })}
        </div>

        <Card style={{ padding: 28 }}>
          {activeSection && (
            <SectionPlayer section={activeSection} onComplete={(score) => completeSection(activeSection.id, score)} />
          )}
        </Card>
      </Container>
    </AppShell>
  );
}

function SectionPlayer({ section, onComplete }) {
  switch (section.type) {
    case "DIALOGS":
      return <DialogPlayer section={section} onComplete={onComplete} />;
    case "VOCABULARY":
      return <VocabularyPlayer section={section} onComplete={onComplete} />;
    case "EXERCISES":
      return <QuizPlayer items={section.exerciseItems} onComplete={onComplete} />;
    case "INTONATION":
      return <IntonationPlayer section={section} onComplete={onComplete} />;
    case "PRONUNCIATION":
      return <PronunciationPlayer section={section} onComplete={onComplete} />;
    case "COMPREHENSION":
      return (
        <QuizPlayer
          items={section.comprehensionItems.map((c) => ({ ...c, prompt: { question: c.question } }))}
          onComplete={onComplete}
        />
      );
    default:
      return null;
  }
}

function EmptyState({ label }) {
  return (
    <p style={{ color: COLORS.textMuted }}>
      Todavía no hay contenido de {label} en esta unidad. El Admin puede agregarlo desde el panel de Admin.
    </p>
  );
}

function DialogPlayer({ section, onComplete }) {
  if (section.dialogItems.length === 0) return <EmptyState label="diálogo" />;
  return (
    <div>
      <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        {section.dialogItems.map((line) => (
          <div key={line.id} style={{ display: "flex", gap: 10 }}>
            <strong style={{ color: COLORS.blue, minWidth: 90 }}>{line.speaker}:</strong>
            <span>{line.line}</span>
            <button title="Escuchar" style={{ border: "none", background: "none", cursor: "pointer" }}>
              🔊
            </button>
          </div>
        ))}
      </div>
      <Btn onClick={() => onComplete()}>Marcar diálogo como visto</Btn>
    </div>
  );
}

function VocabularyPlayer({ section, onComplete }) {
  const [index, setIndex] = useState(0);
  const cards = section.vocabularyCards;
  if (cards.length === 0) return <EmptyState label="vocabulario" />;
  const card = cards[index];
  const isLast = index === cards.length - 1;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 10 }}>
        {index + 1} / {cards.length}
      </div>
      <Card style={{ padding: 32, marginBottom: 20 }}>
        <button title="Escuchar y repetir" style={{ border: "none", background: "none", fontSize: 32, cursor: "pointer" }}>
          🔊
        </button>
        <h2 style={{ margin: "10px 0" }}>{card.term}</h2>
        <p style={{ color: COLORS.textMuted }}>{card.definition}</p>
      </Card>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Btn variant="outline" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Anterior
        </Btn>
        {isLast ? (
          <Btn onClick={() => onComplete()}>Terminar vocabulario</Btn>
        ) : (
          <Btn onClick={() => setIndex(index + 1)}>Siguiente</Btn>
        )}
      </div>
    </div>
  );
}

function IntonationPlayer({ section, onComplete }) {
  if (section.intonationItems.length === 0) return <EmptyState label="entonación" />;
  return (
    <div>
      <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
        {section.intonationItems.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{item.pattern === "rising" ? "↗️" : "↘️"}</span>
            <span>{item.phrase}</span>
            <button title="Escuchar" style={{ border: "none", background: "none", cursor: "pointer" }}>
              🔊
            </button>
          </div>
        ))}
      </div>
      <Btn onClick={() => onComplete()}>Marcar entonación como practicada</Btn>
    </div>
  );
}

function PronunciationPlayer({ section, onComplete }) {
  if (section.pronunciationItems.length === 0) return <EmptyState label="pronunciación" />;
  return (
    <div>
      <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
        {section.pronunciationItems.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <strong>{item.word}</strong>
            <span style={{ color: COLORS.pink }}>{item.ipa}</span>
            <button title="Escuchar" style={{ border: "none", background: "none", cursor: "pointer" }}>
              🔊
            </button>
          </div>
        ))}
      </div>
      <Btn onClick={() => onComplete()}>Marcar pronunciación como practicada</Btn>
    </div>
  );
}

function QuizPlayer({ items, onComplete }) {
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const finished = useMemo(() => items.length > 0 && index >= items.length, [index, items.length]);

  if (items.length === 0) return <EmptyState label="ejercicios" />;

  if (finished) {
    const score = Math.round((correctCount / items.length) * 100);
    return (
      <div style={{ textAlign: "center" }}>
        <h2>Resultado: {correctCount}/{items.length}</h2>
        <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>Puntaje: {score}</p>
        <Btn onClick={() => onComplete(score)}>Continuar</Btn>
      </div>
    );
  }

  const item = items[index];
  const question = item.prompt?.question;

  function choose(choiceIndex) {
    if (selected !== null) return;
    setSelected(choiceIndex);
    if (choiceIndex === item.correctIndex) setCorrectCount((c) => c + 1);
    setTimeout(() => {
      setSelected(null);
      setIndex((i) => i + 1);
    }, 700);
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 10 }}>
        {index + 1} / {items.length}
      </div>
      {item.prompt?.examples && (
        <div style={{ background: COLORS.surfaceMuted, borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13 }}>
          {item.prompt.examples.map((example, i) => (
            <div key={i}>
              <strong>Example {i + 1}:</strong> {example.input} → {example.answer}
            </div>
          ))}
        </div>
      )}
      <h2 style={{ marginBottom: 18 }}>{question}</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {item.choices.map((choice, choiceIndex) => {
          const isSelected = selected === choiceIndex;
          const isCorrect = choiceIndex === item.correctIndex;
          let variant = "outline";
          if (selected !== null && isSelected) variant = isCorrect ? "primary" : "danger";
          return (
            <Btn key={choice} full variant={variant} onClick={() => choose(choiceIndex)}>
              {choice}
            </Btn>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Btn, Card, COLORS } from "./ui-kit";

export function PlacementTestModal({ onClose, onFinished }) {
  const [questions, setQuestions] = useState(null);
  const [step, setStep] = useState(-1); // -1 = intro screen
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/placement-test", { credentials: "include" })
      .then((res) => res.json())
      .then(setQuestions)
      .catch(() => setError("No se pudo cargar el test de nivel."));
  }, []);

  function start() {
    setStep(0);
  }

  async function answer(questionId, selectedIndex) {
    const nextAnswers = [...answers, { questionId, selectedIndex }];
    setAnswers(nextAnswers);

    if (step + 1 < (questions?.length || 0)) {
      setStep(step + 1);
      return;
    }

    const res = await fetch("/api/placement-test", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: nextAnswers }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo calificar el test.");
      return;
    }
    setResult(data);
    onFinished?.(data);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,21,31,.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <Card style={{ maxWidth: 480, width: "100%", padding: 28 }}>
        {error && <p style={{ color: "#991b1b" }}>{error}</p>}

        {!error && step === -1 && !result && (
          <>
            <h2 style={{ margin: "0 0 8px" }}>¿Quieres hacer el test de nivel?</h2>
            <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>
              Es opcional y toma 1 minuto: 6 preguntas rápidas para saber en qué nivel empezar.
              También puedes empezar desde el Nivel Basic si prefieres.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn full onClick={start} disabled={!questions}>
                Sí, hacer el test
              </Btn>
              <Btn full variant="outline" onClick={onClose}>
                No gracias
              </Btn>
            </div>
          </>
        )}

        {!error && step >= 0 && questions && !result && (
          <>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>
              Pregunta {step + 1} de {questions.length}
            </div>
            <h2 style={{ margin: "0 0 20px" }}>{questions[step].prompt}</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {questions[step].choices.map((choice, index) => (
                <Btn key={choice} variant="outline" full onClick={() => answer(questions[step].id, index)}>
                  {choice}
                </Btn>
              ))}
            </div>
          </>
        )}

        {result && (
          <>
            <h2 style={{ margin: "0 0 8px" }}>¡Listo!</h2>
            <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>
              Te recomendamos empezar en el nivel <strong>{result.recommendedLevel}</strong>. Puedes cambiar de
              nivel cuando quieras desde tu panel.
            </p>
            <Btn full onClick={onClose}>
              Ir a mi panel
            </Btn>
          </>
        )}
      </Card>
    </div>
  );
}

// Constantes puras (sin "use client") para que Server Components como
// app/page.jsx puedan importarlas directamente. Un módulo "use client" (como
// ui-kit.jsx) convierte TODOS sus exports en referencias de cliente cuando lo
// importa un Server Component, incluidos objetos planos — por eso estas
// constantes viven aparte y ui-kit.jsx las re-exporta para los componentes
// cliente.
export const COLORS = {
  blue: "var(--brand-blue)",
  blueDeep: "var(--brand-blue-deep)",
  pink: "var(--brand-pink)",
  pinkDeep: "var(--brand-pink-deep)",
  green: "var(--brand-green)",
  greenDeep: "var(--brand-green-deep)",
  yellow: "var(--brand-yellow)",
  purple: "var(--brand-purple)",
  purpleDeep: "var(--brand-purple-deep)",
  bg: "var(--background)",
  surface: "var(--surface)",
  surfaceMuted: "var(--surface-muted)",
  border: "var(--border)",
  text: "var(--foreground)",
  textMuted: "var(--neutral-500)",
  textLight: "var(--neutral-400)",
  shadowCard: "var(--shadow-card)",
  shadowLift: "var(--shadow-lift)",
  gradientHero: "var(--gradient-hero)",
  gradientCta: "var(--gradient-cta)",
  gradientPro: "var(--gradient-pro)",
};

export const font = `"Nunito", "Segoe UI", system-ui, sans-serif`;

// Un color por pilar del curso, igual a los íconos que David mostró:
// Dialogs/Intonation en azul, Vocabulary/Pronunciation en rosa,
// Exercises/Comprehension en verde.
export const SECTION_META = {
  DIALOGS: { label: "Dialogs", color: COLORS.blue, icon: "💬" },
  VOCABULARY: { label: "Vocabulary", color: COLORS.pink, icon: "🔤" },
  EXERCISES: { label: "Exercises", color: COLORS.green, icon: "📝" },
  INTONATION: { label: "Intonation", color: COLORS.blue, icon: "🎙️" },
  PRONUNCIATION: { label: "Pronunciation", color: COLORS.pink, icon: "🗣️" },
  COMPREHENSION: { label: "Comprehension", color: COLORS.green, icon: "🔊" },
};

export const LEVEL_META = {
  BASIC: { label: "Basic", color: COLORS.blue },
  MEDIUM: { label: "Medium", color: COLORS.pink },
  ADVANCED: { label: "Advanced", color: COLORS.green },
};

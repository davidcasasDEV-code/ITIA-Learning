"use client";

// Las constantes de color/tema viven en theme.js (sin "use client") para que
// Server Components también puedan importarlas directamente; aquí solo se
// re-exportan por comodidad para los componentes cliente de este archivo.
export { COLORS, font, SECTION_META, LEVEL_META } from "./theme";
import { COLORS, font } from "./theme";

export function Container({ children, style = undefined }) {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px", ...style }}>
      {children}
    </div>
  );
}

export function Badge({ children, color = COLORS.blue }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 9999,
        background: `${color}1a`,
        color,
        border: `1px solid ${color}33`,
      }}
    >
      {children}
    </span>
  );
}

export function Card({ children, style = undefined, hover = false }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        boxShadow: COLORS.shadowCard,
        padding: 20,
        transition: hover ? "transform .16s ease, box-shadow .16s ease" : undefined,
        ...style,
      }}
      onMouseEnter={
        hover
          ? (e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = COLORS.shadowLift;
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = COLORS.shadowCard;
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function Btn({
  children,
  variant = "primary",
  size = "md",
  onClick = undefined,
  full = false,
  disabled = false,
  type = "button",
  style = undefined,
}) {
  const base = {
    fontFamily: font,
    fontWeight: 800,
    borderRadius: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    transition: "transform .12s ease, box-shadow .12s ease, opacity .12s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: disabled ? 0.5 : 1,
    width: full ? "100%" : undefined,
    minHeight: size === "sm" ? 36 : size === "lg" ? 56 : 46,
  };

  const sizes = {
    sm: { fontSize: 13, padding: "0 16px" },
    md: { fontSize: 15, padding: "0 22px" },
    lg: { fontSize: 17, padding: "0 30px" },
  };

  const variants = {
    primary: { background: COLORS.gradientCta, color: "#fff", boxShadow: COLORS.shadowLift },
    pro: { background: COLORS.gradientPro, color: "#fff", boxShadow: COLORS.shadowLift },
    outline: { background: COLORS.surface, color: COLORS.text, border: `2px solid ${COLORS.border}` },
    ghost: { background: "transparent", color: COLORS.textMuted },
    danger: { background: "#ef4444", color: "#fff" },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.97)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "none";
      }}
    >
      {children}
    </button>
  );
}

export function StarRow({ count = 0, total = 4, size = 18 }) {
  return (
    <div style={{ display: "flex", gap: 2 }} aria-label={`${count}/${total} estrellas`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ fontSize: size, color: i < count ? COLORS.yellow : COLORS.border }}>
          {"★"}
        </span>
      ))}
    </div>
  );
}

// Los "puntitos" de progreso por sección que se ven en las capturas de
// referencia (2 puntos por pilar del curso).
export function ProgressDots({ done = 0, total = 2, color = COLORS.blue }) {
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 9999,
            background: i < done ? color : COLORS.border,
          }}
        />
      ))}
    </div>
  );
}

export function SectionIcon({ type, size = 72, active = false }) {
  const meta = SECTION_META[type] || SECTION_META.VOCABULARY;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px solid ${meta.color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        background: active ? `${meta.color}14` : "transparent",
        color: meta.color,
      }}
    >
      {meta.icon}
    </div>
  );
}

export function TextInput({ value, onChange = undefined, placeholder = undefined, type = "text", style = undefined, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        width: "100%",
        borderRadius: 12,
        border: `2px solid ${COLORS.border}`,
        padding: "10px 14px",
        fontSize: 15,
        outline: "none",
        background: COLORS.surface,
        color: COLORS.text,
        ...style,
      }}
      {...rest}
    />
  );
}

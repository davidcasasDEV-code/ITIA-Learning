import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITIA Learning — Aprende inglés jugando",
  description:
    "Cursos de inglés por nivel, exámenes, medallas, minijuegos, cine con transcripción y citas con maestros.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

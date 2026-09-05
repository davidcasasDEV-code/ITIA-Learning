import { getCognitoSignupUrl } from "@/lib/auth";
import { getRequestOrigin, jsonError } from "@/lib/http";
import { NextResponse } from "next/server";

function getCallbackUri(req) {
  return new URL("/api/auth/callback", getRequestOrigin(req)).toString();
}

// Cognito Hosted UI no distingue "signup nuevo" de "login existente" en la
// URL de callback, así que el aviso opcional de test de nivel se decide en
// el cliente (dashboard) según si el usuario ya tiene progreso o intentos
// de placement test guardados — ver app/dashboard/page.jsx.
export async function GET(req) {
  try {
    return NextResponse.redirect(getCognitoSignupUrl({ redirectUri: getCallbackUri(req) }));
  } catch (error) {
    return jsonError(error, 500);
  }
}

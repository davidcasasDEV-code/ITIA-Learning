import { NextResponse } from "next/server";
import {
  getAuthCookieOptions,
  getRefreshTokenFromRequest,
  getSessionCookieName,
  refreshCognitoSessionFromRequest,
} from "@/lib/auth";

async function refresh(req) {
  if (!getRefreshTokenFromRequest(req)) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  try {
    const refreshed = await refreshCognitoSessionFromRequest(req);
    const response = NextResponse.json({ ok: true });

    response.cookies.set(
      getSessionCookieName(),
      refreshed.sessionToken,
      getAuthCookieOptions(refreshed.expiresIn)
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "session_refresh_failed" },
      { status: error.status || 401 }
    );
  }
}

export async function GET(req) {
  return refresh(req);
}

export async function POST(req) {
  return refresh(req);
}

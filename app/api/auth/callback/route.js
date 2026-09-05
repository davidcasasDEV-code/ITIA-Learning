import { decodeJwt } from "jose";
import { NextResponse } from "next/server";
import {
  getAuthCookieOptions,
  getCognitoIssuer,
  getRefreshCookieName,
  getSessionCookieName,
  verifyCognitoToken,
} from "@/lib/auth";
import { getRequestOrigin } from "@/lib/http";
import { getEnv, getRequiredEnv } from "@/lib/env";

function readExpectedIssuer() {
  try {
    return getCognitoIssuer();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function getTokenDiagnostics(token) {
  if (!token) return {};

  try {
    const decoded = decodeJwt(token);
    const tokenClientId = decoded.client_id || decoded.aud;

    return {
      token_issuer: decoded.iss || "",
      token_use: decoded.token_use || "",
      token_client_id: Array.isArray(tokenClientId) ? tokenClientId.join(",") : tokenClientId || "",
    };
  } catch {
    return {
      token_decode_error: "unable_to_decode_jwt",
    };
  }
}

function invalidSessionRedirect(callbackOrigin, error, tokenType, token) {
  const redirectUrl = new URL("/login", callbackOrigin);
  const diagnostics = {
    error: "invalid_session",
    reason: error instanceof Error ? error.message : String(error),
    checked_token_type: tokenType || "",
    expected_issuer: readExpectedIssuer(),
    expected_client_id: getEnv("COGNITO_APP_CLIENT_ID", ""),
    ...getTokenDiagnostics(token),
  };

  for (const [key, value] of Object.entries(diagnostics)) {
    if (value) redirectUrl.searchParams.set(key, String(value).slice(0, 240));
  }

  return NextResponse.redirect(redirectUrl);
}

export async function GET(req) {
  const url = new URL(req.url);
  const callbackOrigin = getRequestOrigin(req);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", callbackOrigin));
  }

  const domain = getRequiredEnv("COGNITO_DOMAIN").replace(/\/$/, "");
  const clientId = getRequiredEnv("COGNITO_APP_CLIENT_ID");
  const clientSecret = getEnv("COGNITO_APP_CLIENT_SECRET");
  const redirectUri = new URL("/api/auth/callback", callbackOrigin).toString();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (clientSecret) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  }

  const tokenResponse = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers,
    body,
  });

  if (!tokenResponse.ok) {
    console.error("Cognito token exchange failed", {
      status: tokenResponse.status,
      body: await tokenResponse.text(),
    });
    return NextResponse.redirect(new URL("/login?error=cognito_token", callbackOrigin));
  }

  const tokens = await tokenResponse.json();
  const idToken = tokens.id_token;
  const accessToken = tokens.access_token;
  const candidates =
    idToken && idToken.length <= 3800
      ? [
          ["id_token", idToken],
          ["access_token", accessToken],
        ]
      : [
          ["access_token", accessToken],
          ["id_token", idToken],
        ];

  let sessionToken = null;
  let sessionTokenType = null;
  let failedToken = null;
  let failedTokenType = null;
  let verificationError = null;

  for (const [tokenType, token] of candidates) {
    if (!token) continue;

    try {
      await verifyCognitoToken(token);
      sessionToken = token;
      sessionTokenType = tokenType;
      break;
    } catch (error) {
      verificationError = error;
      failedToken = token;
      failedTokenType = tokenType;
    }
  }

  if (!sessionToken) {
    console.error("Cognito session token verification failed", {
      error: verificationError instanceof Error ? verificationError.message : String(verificationError),
      diagnostics: getTokenDiagnostics(failedToken),
      expectedIssuer: readExpectedIssuer(),
      expectedClientId: getEnv("COGNITO_APP_CLIENT_ID", ""),
    });
    return invalidSessionRedirect(callbackOrigin, verificationError, failedTokenType, failedToken);
  }

  if (sessionToken.length > 3800) {
    console.warn("Cognito session cookie is close to browser size limits", {
      tokenType: sessionTokenType,
      length: sessionToken.length,
    });
  }

  const response = NextResponse.redirect(new URL("/dashboard", callbackOrigin));

  response.cookies.set(getSessionCookieName(), sessionToken, {
    ...getAuthCookieOptions(tokens.expires_in || 3600),
  });

  if (tokens.refresh_token) {
    response.cookies.set(
      getRefreshCookieName(),
      tokens.refresh_token,
      getAuthCookieOptions(Number(getEnv("APP_REFRESH_COOKIE_MAX_AGE", "2592000")))
    );
  }

  return response;
}

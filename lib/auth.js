import { createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { getAppBaseUrl, getAwsRegion, getEnv, getRequiredEnv } from "./env.js";

let jwks;
const INVITATION_SECRET_NAME = "INVITATION_TOKEN_SECRET";
const INVITATION_SECRET_PLACEHOLDERS = new Set([
  "replace-with-32-byte-secret",
  "replace-with-stable-32-plus-character-secret",
]);
const INVITATION_SECRET_MIN_LENGTH = 32;

function configurationError(message) {
  const error = new Error(message);
  error.status = 500;
  error.code = "APP_CONFIGURATION_ERROR";
  return error;
}

function parseCookieHeader(cookieHeader) {
  return Object.fromEntries(
    (cookieHeader || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator === -1) return [part, ""];
        return [
          decodeURIComponent(part.slice(0, separator)),
          decodeURIComponent(part.slice(separator + 1)),
        ];
      })
  );
}

export function getSessionCookieName() {
  return getEnv("APP_SESSION_COOKIE", "itia_session");
}

export function getRefreshCookieName() {
  return getEnv("APP_REFRESH_COOKIE", "itia_refresh");
}

export function getAuthCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function getCognitoIssuer() {
  const userPoolId = getRequiredEnv("COGNITO_USER_POOL_ID");
  return `https://cognito-idp.${getAwsRegion()}.amazonaws.com/${userPoolId}`;
}

export function getCognitoLoginUrl({ redirectUri, state } = {}) {
  const domain = getRequiredEnv("COGNITO_DOMAIN").replace(/\/$/, "");
  const clientId = getRequiredEnv("COGNITO_APP_CLIENT_ID");
  const callbackUri = redirectUri || getEnv("COGNITO_REDIRECT_URI", `${getAppBaseUrl()}/api/auth/callback`);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: callbackUri,
  });

  if (state) {
    params.set("state", state);
  }

  return `${domain}/oauth2/authorize?${params.toString()}`;
}

export function getCognitoSignupUrl({ redirectUri, state } = {}) {
  const loginUrl = getCognitoLoginUrl({ redirectUri, state });
  return loginUrl.replace("/oauth2/authorize", "/signup");
}

export function getCognitoLogoutUrl({ logoutUri } = {}) {
  const domain = getRequiredEnv("COGNITO_DOMAIN").replace(/\/$/, "");
  const clientId = getRequiredEnv("COGNITO_APP_CLIENT_ID");
  const postLogoutUri = encodeURIComponent(
    logoutUri || getEnv("COGNITO_LOGOUT_REDIRECT_URI", `${getAppBaseUrl()}/`)
  );

  return `${domain}/logout?client_id=${clientId}&logout_uri=${postLogoutUri}`;
}

export function getTokenFromRequest(req) {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookies = parseCookieHeader(req.headers.get("cookie"));
  return cookies[getSessionCookieName()] || null;
}

export function getRefreshTokenFromRequest(req) {
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  return cookies[getRefreshCookieName()] || null;
}

export async function verifyCognitoToken(token) {
  if (!token) {
    const error = new Error("Authentication token required");
    error.status = 401;
    throw error;
  }

  const issuer = getCognitoIssuer();
  jwks ||= createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

  let payload;

  try {
    ({ payload } = await jwtVerify(token, jwks, { issuer }));
  } catch (error) {
    error.status = 401;
    throw error;
  }

  const clientId = getRequiredEnv("COGNITO_APP_CLIENT_ID");
  const tokenClientId = payload.client_id || payload.aud;

  if (Array.isArray(tokenClientId)) {
    if (!tokenClientId.includes(clientId)) {
      const error = new Error("Invalid Cognito client");
      error.status = 401;
      throw error;
    }
  } else if (tokenClientId !== clientId) {
    const error = new Error("Invalid Cognito client");
    error.status = 401;
    throw error;
  }

  return payload;
}

export async function refreshCognitoSessionFromRequest(req) {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    const error = new Error("Refresh token required");
    error.status = 401;
    throw error;
  }

  const domain = getRequiredEnv("COGNITO_DOMAIN").replace(/\/$/, "");
  const clientId = getRequiredEnv("COGNITO_APP_CLIENT_ID");
  const clientSecret = getEnv("COGNITO_APP_CLIENT_SECRET");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
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
    const error = new Error("Unable to refresh Cognito session");
    error.status = 401;
    throw error;
  }

  const tokens = await tokenResponse.json();
  const candidates =
    tokens.id_token && tokens.id_token.length <= 3800
      ? [tokens.id_token, tokens.access_token]
      : [tokens.access_token, tokens.id_token];

  let sessionToken = null;
  let verificationError = null;

  for (const token of candidates) {
    if (!token) continue;

    try {
      await verifyCognitoToken(token);
      sessionToken = token;
      break;
    } catch (error) {
      verificationError = error;
    }
  }

  if (!sessionToken) {
    const error = verificationError || new Error("Unable to verify refreshed session");
    error.status = 401;
    throw error;
  }

  return {
    sessionToken,
    expiresIn: tokens.expires_in || 3600,
  };
}

export function getCognitoGroups(payload) {
  const groups = payload["cognito:groups"];
  return Array.isArray(groups) ? groups : [];
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function getInvitationTokenSecret() {
  const secret = getEnv(INVITATION_SECRET_NAME, "").trim();

  if (!secret || INVITATION_SECRET_PLACEHOLDERS.has(secret)) {
    throw configurationError(
      `Falta configurar ${INVITATION_SECRET_NAME}. Agrega un secreto estable de al menos ${INVITATION_SECRET_MIN_LENGTH} caracteres en Amplify y en .env local para firmar invitaciones de maestros.`
    );
  }

  if (secret.length < INVITATION_SECRET_MIN_LENGTH) {
    throw configurationError(
      `${INVITATION_SECRET_NAME} debe tener al menos ${INVITATION_SECRET_MIN_LENGTH} caracteres para firmar invitaciones.`
    );
  }

  return secret;
}

export function assertInvitationTokenSecretConfigured() {
  getInvitationTokenSecret();
}

export async function signInvitationToken(payload, expiresIn = "7d") {
  const secret = new TextEncoder().encode(getInvitationTokenSecret());
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyInvitationToken(token) {
  const secret = new TextEncoder().encode(getInvitationTokenSecret());
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

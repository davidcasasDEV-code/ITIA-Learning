import { getCognitoLoginUrl } from "@/lib/auth";
import { getRequestOrigin, jsonError } from "@/lib/http";
import { NextResponse } from "next/server";

function getCallbackUri(req) {
  return new URL("/api/auth/callback", getRequestOrigin(req)).toString();
}

export async function GET(req) {
  try {
    return NextResponse.redirect(getCognitoLoginUrl({ redirectUri: getCallbackUri(req) }));
  } catch (error) {
    return jsonError(error, 500);
  }
}

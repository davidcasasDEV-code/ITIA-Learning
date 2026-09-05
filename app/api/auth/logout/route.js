import { NextResponse } from "next/server";
import { getRefreshCookieName, getSessionCookieName } from "@/lib/auth";
import { getRequestOrigin } from "@/lib/http";

export async function GET(req) {
  const response = NextResponse.redirect(new URL("/", getRequestOrigin(req)));
  response.cookies.delete(getSessionCookieName());
  response.cookies.delete(getRefreshCookieName());
  return response;
}

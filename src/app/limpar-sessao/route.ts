import { clearAllSessionCookies } from "@/lib/auth-cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const login = new URL("/login", request.url);
  login.searchParams.set("error", "cookies_cleared");
  const response = NextResponse.redirect(login);
  return clearAllSessionCookies(response, request.headers.get("cookie"));
}

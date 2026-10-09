import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");
  const isProtected =
    req.nextUrl.pathname.startsWith("/protected") ||
    req.nextUrl.pathname.startsWith("/library") ||
    req.nextUrl.pathname.startsWith("/watchlist") ||
    req.nextUrl.pathname.startsWith("/history") ||
    req.nextUrl.pathname.startsWith("/settings");

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/protected", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/protected/:path*",
    "/library/:path*",
    "/watchlist/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/login",
  ],
};

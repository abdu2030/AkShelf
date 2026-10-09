import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, search } = req.nextUrl;
  const isLoginPage = pathname === "/login" || pathname.startsWith("/login/");

  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/title") ||
    pathname.startsWith("/library") ||
    pathname.startsWith("/watchlist") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/dev");

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    const callback = `${pathname}${search}`;
    loginUrl.searchParams.set("callbackUrl", callback);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/search/:path*",
    "/title/:path*",
    "/library/:path*",
    "/watchlist/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/dev/:path*",
    "/login",
  ],
};

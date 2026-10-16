import { describe, expect, it } from "vitest";
import { handleMiddleware } from "./middleware";

describe("Route Protection Middleware Boundaries", () => {
  const origin = "http://localhost:3000";

  describe("Unauthenticated Visitors", () => {
    it("redirects root path '/' to /login with callbackUrl", () => {
      const response = handleMiddleware({
        auth: null,
        nextUrl: { pathname: "/", search: "", origin },
      });

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(`${origin}/login?callbackUrl=%2F`);
    });

    it("redirects '/search' with query params intact", () => {
      const response = handleMiddleware({
        auth: null,
        nextUrl: { pathname: "/search", search: "?q=oppenheimer&type=MOVIE", origin },
      });

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `${origin}/login?callbackUrl=%2Fsearch%3Fq%3Doppenheimer%26type%3DMOVIE`,
      );
    });

    it("redirects protected subpaths: /library, /watchlist, /history, /settings, /dev", () => {
      const paths = ["/library", "/watchlist", "/history", "/settings", "/dev/palette"];

      for (const pathname of paths) {
        const response = handleMiddleware({
          auth: null,
          nextUrl: { pathname, search: "", origin },
        });

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(
          `${origin}/login?callbackUrl=${encodeURIComponent(pathname)}`,
        );
      }
    });

    it("redirects title details path '/title/:id'", () => {
      const response = handleMiddleware({
        auth: null,
        nextUrl: { pathname: "/title/tmdb-550", search: "", origin },
      });

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `${origin}/login?callbackUrl=%2Ftitle%2Ftmdb-550`,
      );
    });

    it("allows unauthenticated visitor to reach /login", () => {
      const response = handleMiddleware({
        auth: null,
        nextUrl: { pathname: "/login", search: "", origin },
      });

      // Should not redirect
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("allows unauthenticated visitor to reach non-protected public routes", () => {
      const response = handleMiddleware({
        auth: null,
        nextUrl: { pathname: "/api/health", search: "", origin },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  });

  describe("Authenticated Users", () => {
    const mockSession = { user: { id: "user-1", email: "owner@akshelf.local" } };

    it("permits access to protected routes without redirecting", () => {
      const protectedPaths = [
        "/",
        "/search",
        "/library",
        "/watchlist",
        "/history",
        "/title/123",
        "/settings",
      ];

      for (const pathname of protectedPaths) {
        const response = handleMiddleware({
          auth: mockSession,
          nextUrl: { pathname, search: "", origin },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get("location")).toBeNull();
      }
    });

    it("redirects logged-in user away from /login back to '/'", () => {
      const response = handleMiddleware({
        auth: mockSession,
        nextUrl: { pathname: "/login", search: "", origin },
      });

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(`${origin}/`);
    });

    it("redirects logged-in user away from nested /login/ subpaths back to '/'", () => {
      const response = handleMiddleware({
        auth: mockSession,
        nextUrl: { pathname: "/login/verify", search: "", origin },
      });

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(`${origin}/`);
    });
  });
});

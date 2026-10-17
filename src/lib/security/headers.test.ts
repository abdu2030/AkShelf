import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

describe("Production Security Headers (next.config.ts)", () => {
  it("configures security headers for all routes (/:path*)", async () => {
    if (typeof nextConfig.headers !== "function") {
      throw new Error("headers configuration is not defined on nextConfig");
    }

    const headerConfigs = await nextConfig.headers();
    expect(headerConfigs.length).toBeGreaterThan(0);

    const rootConfig = headerConfigs.find((c) => c.source === "/:path*");
    expect(rootConfig).toBeDefined();

    const headersMap = new Map<string, string>();
    for (const h of rootConfig!.headers) {
      headersMap.set(h.key, h.value);
    }

    // 1. Content Security Policy (CSP)
    const csp = headersMap.get("Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("https://image.tmdb.org");
    expect(csp).toContain("https://s4.anilist.co");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("upgrade-insecure-requests");

    // 2. Strict Transport Security (HSTS)
    const hsts = headersMap.get("Strict-Transport-Security");
    expect(hsts).toBeDefined();
    expect(hsts).toContain("max-age=63072000");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");

    // 3. Framing & MIME Protections
    expect(headersMap.get("X-Frame-Options")).toBe("DENY");
    expect(headersMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headersMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");

    // 4. Permissions Policy
    const permPolicy = headersMap.get("Permissions-Policy");
    expect(permPolicy).toBeDefined();
    expect(permPolicy).toContain("camera=()");
    expect(permPolicy).toContain("microphone=()");
    expect(permPolicy).toContain("geolocation=()");
  });
});

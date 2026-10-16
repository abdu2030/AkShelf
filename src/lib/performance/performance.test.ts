import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import nextConfig from "../../../next.config";

describe("Performance & Core Web Vitals Pass (Day 47)", () => {
  describe("Next.js Configuration & Headers", () => {
    it("configures modern compressed image formats (AVIF and WebP)", () => {
      expect(nextConfig.images?.formats).toBeDefined();
      expect(nextConfig.images?.formats).toContain("image/avif");
      expect(nextConfig.images?.formats).toContain("image/webp");
    });

    it("configures high cache TTL for remote image assets", () => {
      expect(nextConfig.images?.minimumCacheTTL).toBeDefined();
      expect(nextConfig.images?.minimumCacheTTL).toBeGreaterThanOrEqual(86400); // >= 1 day
    });

    it("configures responsive deviceSizes and imageSizes for optimal srcset selection", () => {
      expect(nextConfig.images?.deviceSizes).toBeDefined();
      expect(Array.isArray(nextConfig.images?.deviceSizes)).toBe(true);
      expect((nextConfig.images?.deviceSizes as number[]).length).toBeGreaterThanOrEqual(4);

      expect(nextConfig.images?.imageSizes).toBeDefined();
      expect(Array.isArray(nextConfig.images?.imageSizes)).toBe(true);
      expect((nextConfig.images?.imageSizes as number[]).length).toBeGreaterThanOrEqual(4);
    });

    it("configures remote patterns for TMDB and AniList CDN hosts", () => {
      const patterns = nextConfig.images?.remotePatterns ?? [];
      const hostnames = patterns.map((p: { hostname: string }) => p.hostname);
      expect(hostnames).toContain("image.tmdb.org");
      expect(hostnames).toContain("s4.anilist.co");
    });

    it("configures package import optimizations for lucide-react tree-shaking", () => {
      const optimizePackages = nextConfig.experimental?.optimizePackageImports ?? [];
      expect(optimizePackages).toContain("lucide-react");
    });

    it("configures performance and security headers across all routes", async () => {
      expect(nextConfig.headers).toBeDefined();
      if (typeof nextConfig.headers === "function") {
        const headerRules = await nextConfig.headers();
        const globalRule = headerRules.find(
          (rule: { source: string }) => rule.source === "/:path*",
        );
        expect(globalRule).toBeDefined();

        const headers = globalRule?.headers ?? [];
        const headerMap = Object.fromEntries(
          headers.map((h: { key: string; value: string }) => [h.key, h.value]),
        );

        expect(headerMap["X-DNS-Prefetch-Control"]).toBe("on");
        expect(headerMap["X-Content-Type-Options"]).toBe("nosniff");
        expect(headerMap["X-Frame-Options"]).toBe("DENY");
        expect(headerMap["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
        expect(headerMap["Permissions-Policy"]).toContain("camera=()");
      }
    });
  });

  describe("Layout Shift (CLS) & Font Optimization", () => {
    it("does not use render-blocking external Google Fonts @import in globals.css", () => {
      const globalsCssPath = path.resolve(process.cwd(), "src/app/globals.css");
      const content = fs.readFileSync(globalsCssPath, "utf-8");

      expect(content).not.toMatch(/@import\s+url\("https:\/\/fonts\.googleapis\.com/i);
    });

    it("declares font-sans and font-display referencing CSS variables with system fallbacks", () => {
      const globalsCssPath = path.resolve(process.cwd(), "src/app/globals.css");
      const content = fs.readFileSync(globalsCssPath, "utf-8");

      expect(content).toContain("--font-inter");
      expect(content).toContain("--font-jakarta");
      expect(content).toContain("system-ui");
      expect(content).toContain("sans-serif");
    });

    it("configures next/font/google with display: swap in layout.tsx", () => {
      const layoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");

      expect(content).toContain('from "next/font/google"');
      expect(content).toContain("Inter(");
      expect(content).toContain("Plus_Jakarta_Sans(");
      expect(content).toContain('display: "swap"');
      expect(content).toContain("--font-inter");
      expect(content).toContain("--font-jakarta");
    });
  });

  describe("Image Component Dimensions & Aspect Ratios", () => {
    const componentsToCheck = [
      "src/components/title/media-card.tsx",
      "src/components/title/title-hero.tsx",
      "src/components/search/search-result-row.tsx",
      "src/components/history/history-row.tsx",
      "src/components/title/cast-preview.tsx",
      "src/components/dashboard/continue-watching-card.tsx",
      "src/components/dashboard/recently-watched-card.tsx",
    ];

    it.each(componentsToCheck)(
      "ensures %s supplies responsive sizes attribute for fill images",
      (fileRelPath) => {
        const filePath = path.resolve(process.cwd(), fileRelPath);
        const content = fs.readFileSync(filePath, "utf-8");

        // When <Image is used with fill, it should also specify sizes
        if (content.includes("<Image") && content.includes("fill")) {
          expect(content).toMatch(/sizes=(?:"|{)/);
        }
      },
    );

    it("ensures media-card enforces 2:3 aspect ratio container for poster stability", () => {
      const cardPath = path.resolve(process.cwd(), "src/components/title/media-card.tsx");
      const content = fs.readFileSync(cardPath, "utf-8");

      expect(content).toContain("aspect-[2/3]");
    });

    it("ensures title-hero enforces 2:3 aspect ratio container for hero poster stability", () => {
      const heroPath = path.resolve(process.cwd(), "src/components/title/title-hero.tsx");
      const content = fs.readFileSync(heroPath, "utf-8");

      expect(content).toContain("aspect-[2/3]");
    });
  });

  describe("Loading Skeletons Structural Parity", () => {
    it("ensures Dashboard loading skeleton mirrors real components", () => {
      const loadingPath = path.resolve(process.cwd(), "src/app/loading.tsx");
      const content = fs.readFileSync(loadingPath, "utf-8");

      expect(content).toContain("StatsBandSkeleton");
      expect(content).toContain("ContinueWatchingShelfSkeleton");
      expect(content).toContain("RecentlyWatchedSectionSkeleton");
      expect(content).toContain("AnalyticsStatsSkeleton");
    });

    it("ensures Library loading skeleton mirrors filter bar and media grid", () => {
      const loadingPath = path.resolve(process.cwd(), "src/app/library/loading.tsx");
      const content = fs.readFileSync(loadingPath, "utf-8");

      expect(content).toContain("MediaGridSkeleton");
      expect(content).toContain("rounded-full");
    });

    it("ensures Title Detail loading skeleton preserves 2:3 poster frame aspect ratio", () => {
      const loadingPath = path.resolve(process.cwd(), "src/app/title/[id]/loading.tsx");
      const content = fs.readFileSync(loadingPath, "utf-8");

      expect(content).toContain("aspect-[2/3]");
    });
  });

  describe("Bundle Analysis Tooling", () => {
    it("provides analyze script in package.json", () => {
      const pkgPath = path.resolve(process.cwd(), "package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

      expect(pkg.scripts?.analyze).toBeDefined();
      expect(pkg.scripts?.analyze).toContain("scripts/analyze.mjs");
    });

    it("includes cross-platform analyze runner script", () => {
      const scriptPath = path.resolve(process.cwd(), "scripts/analyze.mjs");
      expect(fs.existsSync(scriptPath)).toBe(true);

      const content = fs.readFileSync(scriptPath, "utf-8");
      expect(content).toContain('ANALYZE = "true"');
    });
  });
});

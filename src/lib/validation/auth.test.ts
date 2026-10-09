import { describe, expect, it } from "vitest";
import { loginSchema, validateCallbackUrl } from "./auth";

describe("loginSchema validation", () => {
  it("rejects invalid or empty email addresses", () => {
    const res1 = loginSchema.safeParse({ email: "", password: "password123" });
    expect(res1.success).toBe(false);

    const res2 = loginSchema.safeParse({ email: "invalid-email", password: "password123" });
    expect(res2.success).toBe(false);
  });

  it("rejects empty password", () => {
    const res = loginSchema.safeParse({ email: "owner@akshelf.local", password: "" });
    expect(res.success).toBe(false);
  });

  it("accepts valid owner credentials format", () => {
    const res = loginSchema.safeParse({
      email: "owner@akshelf.local",
      password: "securePassword123",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.email).toBe("owner@akshelf.local");
      expect(res.data.password).toBe("securePassword123");
    }
  });
});

describe("validateCallbackUrl", () => {
  it("allows valid same-site paths", () => {
    expect(validateCallbackUrl("/")).toBe("/");
    expect(validateCallbackUrl("/library")).toBe("/library");
    expect(validateCallbackUrl("/search?q=dune")).toBe("/search?q=dune");
    expect(validateCallbackUrl("/title/123#details")).toBe("/title/123#details");
  });

  it("falls back to '/' for missing or empty input", () => {
    expect(validateCallbackUrl(null)).toBe("/");
    expect(validateCallbackUrl(undefined)).toBe("/");
    expect(validateCallbackUrl("")).toBe("/");
    expect(validateCallbackUrl("   ")).toBe("/");
  });

  it("rejects protocol-relative and external URLs", () => {
    expect(validateCallbackUrl("//evil.com")).toBe("/");
    expect(validateCallbackUrl("https://evil.com")).toBe("/");
    expect(validateCallbackUrl("http://evil.com")).toBe("/");
    expect(validateCallbackUrl("/\\evil.com")).toBe("/");
  });

  it("rejects /login redirect loops", () => {
    expect(validateCallbackUrl("/login")).toBe("/");
    expect(validateCallbackUrl("/login?callbackUrl=/library")).toBe("/");
  });
});

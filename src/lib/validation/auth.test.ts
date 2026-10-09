import { describe, expect, it } from "vitest";
import { loginSchema } from "./auth";

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

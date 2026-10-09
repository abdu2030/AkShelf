import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn utility", () => {
  it("merges standard class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("px-4", false && "py-2", true && "text-white")).toBe("px-4 text-white");
  });

  it("resolves Tailwind conflicts using tailwind-merge", () => {
    expect(cn("px-2 text-red-500", "px-4 text-blue-500")).toBe("px-4 text-blue-500");
  });
});

import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";

describe("User Schema Password Hash Field", () => {
  it("includes passwordHash property in User scalar field enum", () => {
    expect(Prisma.UserScalarFieldEnum.passwordHash).toBe("passwordHash");
  });
});

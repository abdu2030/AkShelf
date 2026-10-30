# In-App Password Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an in-app "Change Password" section in Settings allowing the authenticated owner to update their password directly from the website with database persistence and zero downtime.

**Architecture:** Add a nullable `password_hash` column to the PostgreSQL `users` table so passwords can be modified at runtime. Update authentication to check the database hash first with fallback to `process.env.OWNER_PASSWORD_HASH`. Create a secure Server Action validating current password and new password constraints with bcrypt, then render an accessible inline form in `/settings`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19 (`useActionState`), Prisma 6, PostgreSQL, Zod, bcryptjs, Tailwind CSS, Lucide icons, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-30-password-change-design.md`

## Global Constraints

- Must preserve single-owner mode: all operations strictly target the authenticated owner user.
- Security minimums: Password length $\ge 8$ characters; bcrypt cost factor 10; current password must be validated before updating.
- Backward compatibility: If `User.passwordHash` is `null`, authentication must continue to fall back to `process.env.OWNER_PASSWORD_HASH`.
- Hosting portability: Works across Railway, Vercel, Supabase, and local development without environment variable modifications.

## Review Focus

1. **Unauthenticated or spoofed request to `changePasswordAction`**: Must reject with unauthorized error without querying or modifying user data.
2. **Current password mismatch**: If user submits an incorrect current password, return clear error without updating database.
3. **New password identical to current password**: Validation must reject with "New password must be different from current password."
4. **Database fallback transition**: When `passwordHash` in DB is initially null, login must still succeed with env hash; once changed, login must succeed with new DB password and reject old env password.
5. **Form state & UI recovery**: On error, display accessible alert and preserve input; on success, display success message and clear sensitive password input values.

---

### Task 1: Database Schema Migration & Prisma Model Update

**Files:**

- Modify: `prisma/schema.prisma:28-41`
- Test: `src/lib/db/user-schema.test.ts`

**Interfaces:**

- Produces: `User.passwordHash: string | null` field on Prisma Client.

- [ ] **Step 1: Write failing test verifying `User.passwordHash` field exists in Prisma model**

```ts
// src/lib/db/user-schema.test.ts
import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";

describe("User Schema Password Hash Field", () => {
  it("includes passwordHash property in User scalar field enum", () => {
    expect(Prisma.UserScalarFieldEnum.passwordHash).toBe("passwordHash");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/db/user-schema.test.ts`
Expected: FAIL (property `passwordHash` does not exist on `UserScalarFieldEnum`).

- [ ] **Step 3: Update `prisma/schema.prisma` and sync database**

Add `passwordHash String? @map("password_hash")` to the `User` model in `prisma/schema.prisma`.
Run `npm run db:push` to apply the column addition to PostgreSQL and regenerate `@prisma/client`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/db/user-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/db/user-schema.test.ts
git commit -m "feat(db): add password_hash column to user model"
```

---

### Task 2: Password Change Validation Schema

**Files:**

- Modify: `src/lib/validation/auth.ts`
- Modify: `src/lib/validation/auth.test.ts`

**Interfaces:**

- Produces: `changePasswordSchema: z.ZodType<ChangePasswordInput>` and `type ChangePasswordInput`.

- [ ] **Step 1: Write failing unit tests for `changePasswordSchema`**

```ts
// In src/lib/validation/auth.test.ts
describe("changePasswordSchema", () => {
  it("rejects empty current password", () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });
    expect(res.success).toBe(false);
  });

  it("rejects new password shorter than 8 characters", () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123!",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(res.success).toBe(false);
  });

  it("rejects mismatched new and confirm passwords", () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
      confirmPassword: "DifferentPassword123!",
    });
    expect(res.success).toBe(false);
  });

  it("rejects new password that is identical to current password", () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: "SamePassword123!",
      newPassword: "SamePassword123!",
      confirmPassword: "SamePassword123!",
    });
    expect(res.success).toBe(false);
  });

  it("accepts valid inputs meeting all constraints", () => {
    const res = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123!",
      newPassword: "NewStrongPassword123!",
      confirmPassword: "NewStrongPassword123!",
    });
    expect(res.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/validation/auth.test.ts`
Expected: FAIL (`changePasswordSchema` is not exported).

- [ ] **Step 3: Implement `changePasswordSchema` in `src/lib/validation/auth.ts`**

Define `changePasswordSchema` enforcing `currentPassword` ($\ge 1$), `newPassword` ($\ge 8$), confirmation match, and non-identity with current password.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/validation/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation/auth.ts src/lib/validation/auth.test.ts
git commit -m "feat(auth): add changePasswordSchema validation"
```

---

### Task 3: Database Password Check & Fallback in Credential Verification

**Files:**

- Modify: `src/lib/auth/password.ts`
- Modify: `src/lib/auth/password.test.ts`

**Interfaces:**

- Consumes: `prisma.user.findUnique({ where: { email } })`
- Produces: `verifyOwnerCredentials(email: string, password: string, options?: { prismaClient?: PrismaClient }): Promise<boolean>`

- [ ] **Step 1: Write failing unit tests for DB hash verification and env fallback**

```ts
// In src/lib/auth/password.test.ts
describe("verifyOwnerCredentials with database hash support", () => {
  it("uses database passwordHash when present", async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "u1",
          email: "owner@akshelf.local",
          passwordHash: await bcrypt.hash("DbPassword123!", 10),
        }),
      },
    };
    const valid = await verifyOwnerCredentials("owner@akshelf.local", "DbPassword123!", {
      prismaClient: mockPrisma as any,
    });
    expect(valid).toBe(true);

    const invalid = await verifyOwnerCredentials("owner@akshelf.local", "WrongPassword!", {
      prismaClient: mockPrisma as any,
    });
    expect(invalid).toBe(false);
  });

  it("falls back to process.env.OWNER_PASSWORD_HASH when database passwordHash is null", async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "u1",
          email: "owner@akshelf.local",
          passwordHash: null,
        }),
      },
    };
    process.env.OWNER_PASSWORD_HASH = await bcrypt.hash("EnvPassword123!", 10);
    const valid = await verifyOwnerCredentials("owner@akshelf.local", "EnvPassword123!", {
      prismaClient: mockPrisma as any,
    });
    expect(valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/auth/password.test.ts`
Expected: FAIL (options parameter or DB check not yet implemented).

- [ ] **Step 3: Update `verifyOwnerCredentials` in `src/lib/auth/password.ts`**

Check email against `process.env.OWNER_EMAIL`. Query database user by email. If `user?.passwordHash` exists, test against that; otherwise test against `process.env.OWNER_PASSWORD_HASH`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/auth/password.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/password.ts src/lib/auth/password.test.ts
git commit -m "feat(auth): support database password hash with env fallback"
```

---

### Task 4: Server Action `changePasswordAction`

**Files:**

- Modify: `src/actions/auth.ts`
- Create: `src/actions/auth-password.test.ts`

**Interfaces:**

- Consumes: `auth()`, `changePasswordSchema`, `verifyPasswordHash`, `prisma.user.update`
- Produces: `changePasswordAction(prevState: ChangePasswordState | undefined, formData: FormData): Promise<ChangePasswordState>`
- Type: `export type ChangePasswordState = { error?: string; success?: boolean; message?: string }`

- [ ] **Step 1: Write failing unit test for `changePasswordAction`**

```ts
// src/actions/auth-password.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { changePasswordAction } from "@/actions/auth";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("changePasswordAction", () => {
  it("returns error when unauthenticated", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as any);

    const formData = new FormData();
    formData.set("currentPassword", "Current123!");
    formData.set("newPassword", "NewPassword123!");
    formData.set("confirmPassword", "NewPassword123!");

    const result = await changePasswordAction(undefined, formData);
    expect(result.error).toBe("Unauthorized. Please log in first.");
  });

  it("returns error when current password is wrong", async () => {
    // Mock authenticated session & DB user
    // Provide incorrect current password
    // Assert error === "Current password is not correct."
  });

  it("updates user passwordHash and returns success on valid credentials", async () => {
    // Mock valid current password, new matching password
    // Assert prisma.user.update called with new bcrypt hash
    // Assert result.success === true
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/actions/auth-password.test.ts`
Expected: FAIL (`changePasswordAction` not defined).

- [ ] **Step 3: Implement `changePasswordAction` in `src/actions/auth.ts`**

1. Ensure session is valid (`const session = await auth(); if (!session?.user?.email) ...`).
2. Parse inputs via `changePasswordSchema`.
3. Check current password using `verifyPasswordHash` against the user's active hash.
4. Hash new password with `bcrypt.hash(newPassword, 10)`.
5. Update database record via `prisma.user.update`.
6. Return `{ success: true, message: "Password updated successfully." }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/actions/auth-password.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/actions/auth.ts src/actions/auth-password.test.ts
git commit -m "feat(auth): implement changePasswordAction server action"
```

---

### Task 5: Settings UI "Change Password" Inline Card

**Files:**

- Modify: `src/app/settings/page.tsx`
- Create: `src/components/settings/change-password-form.tsx`
- Test: `src/components/settings/change-password-form.test.tsx`

**Interfaces:**

- Consumes: `changePasswordAction` from `@/actions/auth`
- Produces: `<ChangePasswordForm />` component mounted in `/settings` Account panel.

- [ ] **Step 1: Write failing component test for `<ChangePasswordForm />`**

```tsx
// src/components/settings/change-password-form.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChangePasswordForm } from "./change-password-form";

describe("<ChangePasswordForm />", () => {
  it("renders current, new, and confirm password fields", () => {
    render(<ChangePasswordForm />);
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it("toggles password visibility when eye icon clicked", () => {
    render(<ChangePasswordForm />);
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    expect(newPasswordInput).toHaveAttribute("type", "password");
    const toggleButtons = screen.getAllByRole("button", { name: /show password/i });
    fireEvent.click(toggleButtons[1]); // New password toggle
    expect(newPasswordInput).toHaveAttribute("type", "text");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/settings/change-password-form.test.tsx`
Expected: FAIL (Component not found).

- [ ] **Step 3: Implement `ChangePasswordForm` and integrate into `src/app/settings/page.tsx`**

1. Create `src/components/settings/change-password-form.tsx` using `useActionState(changePasswordAction, undefined)`.
   - Include inputs: `currentPassword`, `newPassword`, `confirmPassword`.
   - Include toggle buttons for `showPassword` per input.
   - Display error alert box if `state?.error`.
   - Display success message box if `state?.success`.
   - Reset inputs when `state?.success` is true.
2. In `src/app/settings/page.tsx`, mount `<ChangePasswordForm />` directly inside Panel 1: Account beneath the user profile row.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/components/settings/change-password-form.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/change-password-form.tsx src/components/settings/change-password-form.test.tsx src/app/settings/page.tsx
git commit -m "feat(settings): add change password form to account panel"
```

---

### Task 6: Full System Verification & Regression Suite

**Files:**

- Test: all test suites

- [ ] **Step 1: Run complete unit test suite**

Run: `npm run test`
Expected: All tests pass (including new tests and 591 existing tests).

- [ ] **Step 2: Run TypeScript typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Run ESLint**

Run: `npm run lint`
Expected: 0 warnings, 0 errors.

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: Successful Next.js build.

- [ ] **Step 5: Push to GitHub & deploy**

```bash
git push origin main
```

Confirm Railway deployment completes cleanly.

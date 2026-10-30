# Design Document: In-App Password Change (Settings)

**Date**: 2026-10-30  
**Status**: Pending Approval  
**Author**: Antigravity & User

---

## 1. Intent & The Why

AkShelf is a private, single-owner media tracker. Currently, authentication checks the owner's password against an environment variable (`OWNER_PASSWORD_HASH`). Because environment variables cannot be modified by the web application at runtime, the owner has no way to change their password directly on the website without redeploying or manually updating hosting environment variables.

The goal is to provide an in-app "Change Password" section inside the Settings page where the authenticated owner can securely update their password at any time, with immediate persistence in the database and zero server redeployments.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals

- Allow the authenticated owner to update their password from the Settings page by providing their current password and a valid new password.
- Store the new bcrypt-hashed password in the PostgreSQL `users` table (`password_hash` column).
- Seamlessly fall back to `OWNER_PASSWORD_HASH` if `user.passwordHash` is `null` (e.g. before the first in-app change), ensuring zero downtime or lockouts during migration.
- Provide real-time UI feedback: show/hide eye toggles, clear error messaging (incorrect current password, passwords don't match, length requirements), and an instant success notification.
- Maintain full session security: require an active authenticated session to change the password.

### Non-Goals

- An outbound email-based "Forgot Password" reset flow (no email delivery service is configured).
- Multi-user authentication or public registration (AkShelf remains strictly single-owner).

### Anti-Goals

- Modifying or attempting to write to `.env` or deployment environment variables at runtime.
- Breaking existing logins that rely on `OWNER_PASSWORD_HASH` in `.env`.
- Plaintext password storage or weak hashing algorithms.

---

## 3. Constraints

- **Single-Owner Mode**: All operations strictly target the authenticated owner user record.
- **Security**: Must verify the current password before applying changes. Password minimum length of 8 characters. Bcrypt cost factor 10.
- **Hosting Portability**: Must work identically on Railway, Vercel, Supabase, and local Docker/development.
- **Backwards Compatibility**: If `User.passwordHash` is null in the database, `verifyOwnerCredentials` checks `process.env.OWNER_PASSWORD_HASH`. Once updated in the DB, the DB hash takes precedence.

---

## 4. Approaches Considered

1. **Option 1: Inline Card in Settings (Selected)**
   - _Description_: A dedicated card directly inside the Account section of `/settings`. Contains Current Password, New Password, Confirm New Password, password visibility toggles, and submit button.
   - _Pros_: Direct access, no extra clicks or modal state management, fits naturally into the existing Settings layout alongside Appearance and Data Safety.
   - _Trade-off_: Adds some vertical space to Settings.
   - _Decision_: **Selected** by user.

2. **Option 2: Pop-up Modal Dialog (Rejected)**
   - _Description_: A "Change Password" button in the Account row that opens a modal dialog.
   - _Trade-off_: Extra click to open, awkward keyboard trap and scrolling on mobile viewports.
   - _Decision_: Rejected in favor of Option 1.

3. **Option 3: Redundant Credentials Table (Rejected)**
   - _Description_: Creating a separate `UserCredential` table with foreign key to `User`.
   - _Trade-off_: Unnecessary join and schema overhead for a 1-row table in a single-owner application.
   - _Decision_: Rejected; adding a nullable `password_hash` column to `users` is standard, simple, and clean.

---

## 5. Architecture & Implementation Details

### 5.1 Database Schema (`prisma/schema.prisma`)

Add a nullable column to the `User` model:

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  image        String?
  passwordHash String?   @map("password_hash")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  ...
```

Synchronize via `npm run db:push` (or migration) and generate Prisma Client.

### 5.2 Authentication Logic (`src/lib/auth/password.ts` & `src/lib/auth/index.ts`)

Update credentials verification to check the database user record:

- Query user by email in `verifyOwnerCredentials` / `authorize`.
- If `user?.passwordHash` is populated, verify against `user.passwordHash`.
- If `user?.passwordHash` is null/empty, fall back to `verifyPasswordHash(password, process.env.OWNER_PASSWORD_HASH)`.

### 5.3 Validation Schema (`src/lib/validation/auth.ts`)

Add `changePasswordSchema`:

```ts
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });
```

### 5.4 Server Action (`src/actions/auth.ts`)

Export `changePasswordAction(prevState, formData)`:

1. Verify active session via `auth()`. Throw 401 if unauthenticated.
2. Parse form data with `changePasswordSchema`. Return validation errors if invalid.
3. Fetch user record from database (or fallback to owner email).
4. Verify `currentPassword` against active hash (DB hash if present, else env hash). Return "Current password is incorrect" if invalid.
5. Hash `newPassword` using `bcrypt.hash(newPassword, 10)`.
6. Update user in Prisma: `prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })`.
7. Return `{ success: true, message: "Password updated successfully." }`.

### 5.5 UI Component (`src/app/settings/page.tsx`)

In the Account section:

- Render a "Change Password" sub-card.
- Include Current Password, New Password, and Confirm Password fields with show/hide password buttons.
- Display error alerts on failure, and a success banner/toast on successful update.
- Reset the form inputs after successful update.

---

## 6. What's Left to the Builder

- Implement unit tests for `changePasswordSchema` and `changePasswordAction`.
- Verify end-to-end password change flow and subsequent login with the new password.
- Ensure accessible labels (`aria-label`, `htmlFor`), keyboard navigation, and theme consistency.

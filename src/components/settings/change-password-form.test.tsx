import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChangePasswordForm } from "./change-password-form";

describe("<ChangePasswordForm />", () => {
  it("renders form inputs for current, new, and confirm password", () => {
    const html = renderToStaticMarkup(<ChangePasswordForm />);

    expect(html).toContain('name="currentPassword"');
    expect(html).toContain('name="newPassword"');
    expect(html).toContain('name="confirmPassword"');
    expect(html).toContain("Current Password");
    expect(html).toContain("New Password");
    expect(html).toContain("Confirm New Password");
    expect(html).toContain("Update password");
  });

  it("includes security hint and accessible labels", () => {
    const html = renderToStaticMarkup(<ChangePasswordForm />);

    expect(html).toContain("Minimum 8 characters");
    expect(html).toContain('aria-label="Current Password"');
  });
});

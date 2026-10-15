import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Toast, ToastProvider } from "./toast";

describe("Toast Component (UI Spec 9.17 & 17.4)", () => {
  it("renders success toast with message and polite live region", () => {
    const html = renderToStaticMarkup(<Toast type="success" message="Watched S2 E4." />);

    expect(html).toContain("Watched S2 E4.");
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("glass-3");
    expect(html).toContain("text-emerald-400");
  });

  it("renders action button with accessible label and style", () => {
    const html = renderToStaticMarkup(
      <Toast
        type="success"
        message="Watched S2 E4."
        actionLabel="Undo"
        onAction={() => {}}
        onClose={() => {}}
      />,
    );

    expect(html).toContain("Watched S2 E4.");
    expect(html).toContain("Undo");
    expect(html).toContain('aria-label="Dismiss notification"');
    expect(html).toContain("text-accent");
  });

  it("renders error toast with alert role and assertive live region", () => {
    const html = renderToStaticMarkup(
      <Toast
        type="error"
        message="Could not save. Your change was not recorded."
        actionLabel="Try again"
        onAction={() => {}}
      />,
    );

    expect(html).toContain("Could not save. Your change was not recorded.");
    expect(html).toContain("Try again");
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain("text-red-400");
  });

  it("renders info and warning toast variants with respective semantic styles", () => {
    const infoHtml = renderToStaticMarkup(<Toast type="info" message="Already on your shelf." />);
    expect(infoHtml).toContain("Already on your shelf.");
    expect(infoHtml).toContain("text-sky-400");

    const warnHtml = renderToStaticMarkup(
      <Toast type="warning" message="Search is slow right now." />,
    );
    expect(warnHtml).toContain("Search is slow right now.");
    expect(warnHtml).toContain("text-amber-400");
  });

  it("renders ToastProvider children without errors", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <div id="test-child">App Content</div>
      </ToastProvider>,
    );

    expect(html).toContain("test-child");
    expect(html).toContain("App Content");
  });
});

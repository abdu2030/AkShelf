import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";

describe("Dialog Component (Accessibility & Semantics)", () => {
  it("renders trigger button with correct ARIA attributes", () => {
    const html = renderToStaticMarkup(
      <Dialog>
        <DialogTrigger>Open Modal</DialogTrigger>
        <DialogContent>
          <DialogTitle>Modal Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("Open Modal");
    expect(html).not.toContain('role="dialog"');
  });

  it("renders dialog with role=dialog, aria-modal, and accessible title/description when open", () => {
    const html = renderToStaticMarkup(
      <Dialog open={true}>
        <DialogTrigger>Trigger</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>Are you sure you want to proceed?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Confirm Action");
    expect(html).toContain("Are you sure you want to proceed?");
    expect(html).toContain('aria-label="Close dialog"');
    expect(html).toContain("Cancel");
  });
});

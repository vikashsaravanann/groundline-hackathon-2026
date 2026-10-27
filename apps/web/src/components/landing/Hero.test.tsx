import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/components/design/Reveal", () => ({
  Reveal: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

import { Hero } from "@/components/landing/Hero";

describe("landing hero navigation", () => {
  it("opens the dedicated workflow page and Studio", () => {
    render(<Hero />);

    expect(screen.getByRole("link", { name: /explore the workflow/i })).toHaveAttribute(
      "href",
      "/how-it-works",
    );
    expect(screen.getByRole("link", { name: /open groundline studio/i })).toHaveAttribute(
      "href",
      "/studio",
    );
    expect(screen.queryByText("Aurora Desk Lamp")).not.toBeInTheDocument();
    expect(screen.queryByText(/Model GL-DEMO-2048 · 12 V/)).not.toBeInTheDocument();
  });
});

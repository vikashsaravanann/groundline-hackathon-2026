import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Footer } from "@/components/layout/Footer";

describe("Groundline footer", () => {
  it("gives reviewers a clear current-versus-planned scope summary", () => {
    render(<Footer />);

    expect(screen.getByRole("heading", { name: /for judges and collaborators/i })).toBeInTheDocument();
    expect(screen.getByText(/Visual region grounding, task preparation, and a fuller approval timeline are not implemented yet/i)).toBeInTheDocument();
    expect(screen.getByText(/synthetic and marked SAMPLE · MOCK/i)).toBeInTheDocument();
  });

  it("keeps primary product and creator routes available", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/how-it-works");
    expect(screen.getByRole("link", { name: "About the creator" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "Open Studio" })).toHaveAttribute("href", "/studio");
    expect(screen.getByRole("link", { name: "Features" })).toHaveClass("border");
    expect(screen.getByRole("link", { name: "Security" })).toHaveAttribute("href", "/legal/security");
  });
});

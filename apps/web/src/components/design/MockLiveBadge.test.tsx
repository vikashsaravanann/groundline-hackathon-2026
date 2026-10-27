import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MockLiveBadge } from "@/components/design/MockLiveBadge";

describe("MockLiveBadge", () => {
  it("announces MOCK for fixture results", () => {
    render(<MockLiveBadge source="mock" />);
    expect(screen.getByText(/MOCK — fixture/i)).toBeInTheDocument();
  });

  it("announces LIVE only for a real Meta response", () => {
    render(<MockLiveBadge source="meta-live" />);
    expect(screen.getByText(/LIVE — Meta model response/i)).toBeInTheDocument();
  });
});

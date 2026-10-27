import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExtractedFieldCard } from "@/components/studio/ExtractedFieldCard";
import type { AnalysisField } from "@/types/analysis";

const field: AnalysisField = {
  id: "f0",
  label: "Model number",
  value: "GL-DEMO-2048",
  confidence: null,
  evidence: null,
  userConfirmed: false,
};

describe("ExtractedFieldCard", () => {
  it("shows 'Not evaluated' when confidence is null", () => {
    render(<ExtractedFieldCard field={field} onConfirm={() => {}} onEdit={() => {}} />);
    expect(screen.getByText(/Not evaluated/i)).toBeInTheDocument();
    expect(screen.getByText("GL-DEMO-2048")).toBeInTheDocument();
  });

  it("lets the user edit a value", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ExtractedFieldCard field={field} onConfirm={() => {}} onEdit={onEdit} />);

    await user.click(screen.getByLabelText(/Edit Model number/i));
    const input = screen.getByLabelText(/Edit Model number/i);
    await user.clear(input);
    await user.type(input, "NEW-123");
    await user.click(screen.getByText("Save"));

    expect(onEdit).toHaveBeenCalledWith("f0", "NEW-123");
  });

  it("toggles confirmation", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ExtractedFieldCard field={field} onConfirm={onConfirm} onEdit={() => {}} />);
    await user.click(screen.getByLabelText(/Confirm Model number/i));
    expect(onConfirm).toHaveBeenCalledWith("f0");
  });
});

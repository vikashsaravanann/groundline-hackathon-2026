import { describe, expect, it } from "vitest";

import { estimateBytes } from "@/lib/image";

describe("estimateBytes", () => {
  it("computes byte length from a data URL's base64 payload", () => {
    expect(estimateBytes("data:image/png;base64,AAAA")).toBe(3);
    expect(estimateBytes("data:image/png;base64,AAA=")).toBe(2);
    expect(estimateBytes("data:image/png;base64,AA==")).toBe(1);
  });
});

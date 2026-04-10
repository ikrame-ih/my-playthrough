import { describe, it, expect } from "vitest";
import { passwordPolicyMessage } from "./passwordPolicy";

describe("passwordPolicyMessage", () => {
  it("acepta Presentacion2026!", () => {
    expect(passwordPolicyMessage("Presentacion2026!")).toBeNull();
  });
  it("rechaza sin mayúscula", () => {
    expect(passwordPolicyMessage("presentacion2026!")).toMatch(/mayúscula/i);
  });
});

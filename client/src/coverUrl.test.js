import { describe, it, expect, vi } from "vitest";

vi.mock("./api", () => ({
  API_BASE: "http://localhost:3000",
}));

import { displayCoverUrl } from "./coverUrl";

describe("displayCoverUrl", () => {
  it("devuelve cadena vacía si no hay URL", () => {
    expect(displayCoverUrl("")).toBe("");
    expect(displayCoverUrl(null)).toBe("");
  });

  it("no modifica data URLs", () => {
    const data = "data:image/png;base64,abc";
    expect(displayCoverUrl(data)).toBe(data);
  });

  it("no anida el proxy si la URL ya es del proxy", () => {
    const proxied =
      "http://localhost:3000/api/covers/proxy?u=https%3A%2F%2Fcdn.example.com%2Fa.jpg";
    expect(displayCoverUrl(proxied)).toBe(proxied);
  });

  it("envuelve URLs http(s) en el endpoint proxy", () => {
    const url = "https://cdn.akamai.steamstatic.com/steam/apps/123/header.jpg";
    const out = displayCoverUrl(url);
    expect(out).toContain("/api/covers/proxy?u=");
    expect(decodeURIComponent(out.split("u=")[1])).toBe(url);
  });
});

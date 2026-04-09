import { describe, it, expect } from "vitest";
import { labelEstado, estadoBadgeClass } from "./gameLabels";

describe("labelEstado", () => {
  it("traduce valores de BD a etiquetas de UI", () => {
    expect(labelEstado("Pendiente")).toBe("BACKLOG");
    expect(labelEstado("Jugando")).toBe("JUGANDO");
    expect(labelEstado("Completado")).toBe("COMPLETADO");
  });

  it("devuelve el valor tal cual si no coincide", () => {
    expect(labelEstado("Desconocido")).toBe("Desconocido");
  });
});

describe("estadoBadgeClass", () => {
  it("asigna clases de acento a estados activos", () => {
    expect(estadoBadgeClass("Jugando")).toContain("brand-tealBtn");
    expect(estadoBadgeClass("Completado")).toContain("brand-tealBtn");
  });

  it("usa estilo neutro para backlog", () => {
    expect(estadoBadgeClass("Pendiente")).toContain("slate-700");
  });
});

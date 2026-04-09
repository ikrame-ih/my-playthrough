/**
 * Pruebas automáticas (unitarias) para normalize.js.
 * Las corro con `npm test` en la carpeta server. Vitest las ejecuta solas.
 * Complementan el plan de pruebas manuales que está en docs/pruebas.md.
 */
const {
  normalizeEmail,
  normalizeGameTitle,
  titleMatchKey,
  normalizePlataforma,
  normalizeEstadoForDb,
  parseCatalogoRef,
  serverErrorPayload,
} = require("./normalize");

// --- Email: en el plan manual (V-01) vimos que hay que normalizar antes de guardar ---
describe("normalizeEmail", () => {
  it("quita espacios y pone minúsculas como en el caso V-01", () => {
    expect(normalizeEmail("  Usuario@GMAIL.com  ")).toBe("usuario@gmail.com");
  });

  it("si viene vacío o raro (null) no pete, devuelve string vacío", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

// --- Título del juego: los espacios dobles sobran (V-02) ---
describe("normalizeGameTitle", () => {
  it("deja un solo espacio entre palabras", () => {
    expect(normalizeGameTitle("The  Witcher   3")).toBe("The Witcher 3");
  });

  it("también recorta por los lados", () => {
    expect(normalizeGameTitle("  Halo  ")).toBe("Halo");
  });
});

// Esto sirve para detectar duplicados aunque el usuario escriba distinto
describe("titleMatchKey", () => {
  it("mismo título en mayúsculas o no da la misma clave", () => {
    expect(titleMatchKey("Dark Souls")).toBe(titleMatchKey("DARK SOULS"));
  });
});

describe("normalizePlataforma", () => {
  // V-04: si no mandan plataforma, en BD guardamos PC
  it("si no ponen nada, por defecto PC", () => {
    expect(normalizePlataforma("")).toBe("PC");
    expect(normalizePlataforma(null)).toBe("PC");
  });

  it("si ponen una plataforma, se limpia y se respeta", () => {
    expect(normalizePlataforma("  Switch  ")).toBe("Switch");
  });
});

describe("normalizeEstadoForDb", () => {
  // A veces el cliente manda el estado en inglés (V-03); hay que traducirlo al español de la BD
  it("Completed, Backlog, Playing se mapean bien", () => {
    expect(normalizeEstadoForDb("Completed")).toBe("Completado");
    expect(normalizeEstadoForDb("Backlog")).toBe("Pendiente");
    expect(normalizeEstadoForDb("Playing")).toBe("Jugando");
  });

  it("si ya viene en español no lo rompe", () => {
    expect(normalizeEstadoForDb("Completado")).toBe("Completado");
    expect(normalizeEstadoForDb("Pendiente")).toBe("Pendiente");
  });
});

// Cuando eliges un juego del buscador viene catalogo_ref; hay que validar que no sea basura
describe("parseCatalogoRef", () => {
  it("RAWG con id válido ok", () => {
    expect(parseCatalogoRef({ catalogo_ref: { source: "rawg", id: 42 } })).toEqual({
      source: "rawg",
      id: 42,
    });
  });

  it("Steam también vale y el source lo pone en minúsculas", () => {
    expect(parseCatalogoRef({ catalogo_ref: { source: "STEAM", id: "123" } })).toEqual({
      source: "steam",
      id: 123,
    });
  });

  it("cosas raras (epic, id 0, sin ref) = null", () => {
    expect(parseCatalogoRef({ catalogo_ref: { source: "epic", id: 1 } })).toBeNull();
    expect(parseCatalogoRef({ catalogo_ref: { source: "rawg", id: 0 } })).toBeNull();
    expect(parseCatalogoRef({})).toBeNull();
  });
});

// En producción no queremos filtrar errores internos al usuario; en dev sí ayuda para depurar
describe("serverErrorPayload", () => {
  const prevEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = prevEnv;
  });

  it("en development sí manda el detail del error (para debug)", () => {
    process.env.NODE_ENV = "development";
    const err = new Error("detalle técnico");
    err.code = "23505";
    expect(serverErrorPayload(err, "Algo salió mal")).toEqual({
      error: "Algo salió mal",
      detail: "detalle técnico",
      code: "23505",
    });
  });

  it("en production solo el mensaje genérico, sin el detalle", () => {
    process.env.NODE_ENV = "production";
    const err = new Error("secreto");
    expect(serverErrorPayload(err, "Error genérico")).toEqual({ error: "Error genérico" });
  });
});

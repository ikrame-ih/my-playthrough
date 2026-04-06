import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_BASE, authHeaders } from "../api";

/**
 * Lee el rol del usuario desde localStorage para personalizar
 * el mensaje de "no hay coincidencias" en el buscador de carátulas.
 * @returns {boolean} `true` si el usuario tiene rol 'admin'.
 */
function isAdminUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return false;
    return JSON.parse(raw)?.rol === "admin";
  } catch {
    return false;
  }
}

/**
 * Elimina espacios extra del título introducido por el usuario.
 * @param {string} s - Cadena a normalizar.
 * @returns {string} Cadena limpia.
 */
function normalizeTitleText(s) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

const PLATFORM_OPTIONS = [
  "PC",
  "PS5",
  "PS4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
  "Steam Deck",
  "Otra",
];

/**
 * Formulario unificado de creación y edición de fichas de juego.
 * Detecta automáticamente si está en modo edición según si existe `:id` en la URL.
 * El campo de título lanza una búsqueda en RAWG+Steam con debounce de 550ms
 * para mostrar una galería de carátulas entre las que el usuario puede elegir.
 * Al seleccionar un juego del buscador, se incluye `catalogo_ref` en el payload
 * para que el backend lo enlace con la tabla `catalogo_juegos`.
 *
 * @component
 */
export default function GameForm() {
  const [formData, setFormData] = useState({
    titulo: "",
    estado: "Pendiente",
    plataforma: "",
    puntuacion: 5,
    horas_jugadas: 0,
    url_imagen: "",
  });
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverHint, setCoverHint] = useState("");
  const [coverOptions, setCoverOptions] = useState([]);
  const [selectedCoverKey, setSelectedCoverKey] = useState(null);
  const [mergeDuplicate, setMergeDuplicate] = useState(false);

  const tituloDirty = useRef(false);
  const coverReqId = useRef(0);
  const selectedCoverKeyRef = useRef(null);
  const lastCoverSelectionRef = useRef(null);

  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      fetch(`${API_BASE}/api/games/${id}`, {
        headers: authHeaders(),
      })
        .then((res) => {
          if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.reload();
          }
          return res.json();
        })
        .then((data) => {
          tituloDirty.current = false;
          setFormData({
            titulo: data.titulo,
            estado: data.estado,
            plataforma: data.plataforma ?? "",
            puntuacion: data.puntuacion,
            horas_jugadas: data.horas_jugadas,
            url_imagen: data.url_imagen ?? "",
          });
          if (data.url_imagen) {
            setCoverHint("Imagen guardada en tu ficha.");
          }
        })
        .catch((err) => console.error("Error al obtener el juego:", err));
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (!tituloDirty.current) return;

    const t = formData.titulo.trim();

    if (t.length < 2) {
      setCoverHint("");
      setCoverOptions([]);
      selectedCoverKeyRef.current = null;
      lastCoverSelectionRef.current = null;
      setSelectedCoverKey(null);
      if (t.length === 0) {
        setFormData((f) => ({ ...f, url_imagen: "" }));
      }
      return;
    }

    const reqId = ++coverReqId.current;
    const timer = setTimeout(async () => {
      setCoverLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/games/cover-search?q=${encodeURIComponent(t)}`,
          { headers: authHeaders() },
        );

        if (reqId !== coverReqId.current) return;

        if (!res.ok) {
          setCoverHint("");
          setCoverOptions([]);
          selectedCoverKeyRef.current = null;
          lastCoverSelectionRef.current = null;
          setSelectedCoverKey(null);
          setCoverLoading(false);
          return;
        }

        const data = await res.json();
        const list = Array.isArray(data.results) ? data.results : [];
        setCoverOptions(list);

        if (list.length > 0) {
          const keyOf = (o) => `${o.source}-${o.id}`;
          let nextKey = null;
          if (list.length === 1) {
            nextKey = keyOf(list[0]);
          } else {
            const prev = selectedCoverKeyRef.current;
            if (prev && list.some((o) => keyOf(o) === prev)) {
              nextKey = prev;
            }
          }
          selectedCoverKeyRef.current = nextKey;
          setSelectedCoverKey(nextKey);
          const chosen = nextKey
            ? list.find((o) => keyOf(o) === nextKey)
            : null;
          lastCoverSelectionRef.current = chosen ?? null;
          setFormData((f) => ({
            ...f,
            url_imagen: chosen?.background_image ?? "",
          }));
          setCoverHint(
            list.length === 1
              ? `1 resultado — confirma que es el juego correcto`
              : `${list.length} resultados — elige el juego correspondiente`,
          );
        } else {
          selectedCoverKeyRef.current = null;
          lastCoverSelectionRef.current = null;
          setSelectedCoverKey(null);
          setFormData((f) => ({ ...f, url_imagen: "" }));
          setCoverHint(
            isAdminUser()
              ? "No hay coincidencias. Prueba otras palabras o configura RAWG_API_KEY en el servidor para incluir juegos fuera de Steam."
              : "No hay coincidencias. Prueba con otras palabras en el título.",
          );
        }
      } catch {
        if (reqId === coverReqId.current) {
          setCoverHint("");
          setCoverOptions([]);
          selectedCoverKeyRef.current = null;
          lastCoverSelectionRef.current = null;
          setSelectedCoverKey(null);
        }
      } finally {
        if (reqId === coverReqId.current) {
          setCoverLoading(false);
        }
      }
    }, 550);

    return () => clearTimeout(timer);
  }, [formData.titulo]);

  const handleChange = (e) => {
    setFeedback({ type: "", text: "" });
    if (e.target.name === "titulo") tituloDirty.current = true;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const coverKey = (opt) => `${opt.source}-${opt.id}`;

  const selectCoverOption = (opt) => {
    const k = coverKey(opt);
    selectedCoverKeyRef.current = k;
    lastCoverSelectionRef.current = opt;
    setSelectedCoverKey(k);
    setFormData((f) => ({ ...f, url_imagen: opt.background_image }));
    const src =
      opt.source === "steam" ? "Steam" : opt.source === "rawg" ? "RAWG" : "";
    setCoverHint(
      src ? `Seleccionado (${src}): ${opt.name}` : `Seleccionado: ${opt.name}`,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    setFeedback({ type: "", text: "" });

    const url = isEditing
      ? `${API_BASE}/api/games/${id}`
      : `${API_BASE}/api/games`;

    const method = isEditing ? "PUT" : "POST";

    const puntuacion = Math.min(
      10,
      Math.max(0, Number(formData.puntuacion) || 0),
    );
    const horas_jugadas = Math.max(0, Number(formData.horas_jugadas) || 0);

    const fromList =
      selectedCoverKey &&
      coverOptions.find((o) => coverKey(o) === selectedCoverKey);
    const selected =
      fromList ||
      (selectedCoverKey &&
      lastCoverSelectionRef.current &&
      coverKey(lastCoverSelectionRef.current) === selectedCoverKey
        ? lastCoverSelectionRef.current
        : null);

    const tituloFinal = selected
      ? normalizeTitleText(selected.name)
      : normalizeTitleText(formData.titulo);

    if (!tituloFinal) {
      setFeedback({
        type: "error",
        text: "Indica un título o elige un juego de la lista de resultados.",
      });
      return;
    }

    const urlFinal =
      (selected?.background_image && String(selected.background_image).trim()) ||
      (typeof formData.url_imagen === "string" && formData.url_imagen.trim() !== ""
        ? formData.url_imagen.trim()
        : null);

    const payload = {
      titulo: tituloFinal,
      estado: formData.estado,
      plataforma: formData.plataforma ?? "",
      puntuacion,
      horas_jugadas,
      url_imagen: urlFinal,
      ...(isEditing && mergeDuplicate ? { merge_duplicate: true } : {}),
      ...(selected && selected.source && selected.id != null
        ? {
            catalogo_ref: {
              source: selected.source,
              id: selected.id,
            },
          }
        : {}),
    };

    setFormSubmitting(true);
    try {
      const response = await fetch(url, {
        method: method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
        return;
      }

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: "Respuesta del servidor no válida." };
      }

      if (!response.ok) {
        const hint = [data.error, data.detail].filter(Boolean).join(" — ");
        if (data.merge_available && isEditing) {
          setMergeDuplicate(true);
        }
        setFeedback({
          type: "error",
          text:
            hint ||
            data.message ||
            `No se pudo guardar (${response.status}).`,
        });
        return;
      }

      setFeedback({
        type: "ok",
        text: isEditing
          ? "Juego actualizado correctamente."
          : "Juego guardado correctamente.",
      });
      setTimeout(() => navigate("/"), 900);
    } catch (error) {
      console.error("Error en la operación:", error);
      setFeedback({
        type: "error",
        text: "No se pudo conectar con el servidor.",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex flex-wrap items-start gap-4">
        <Link
          to="/"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-brand-input text-slate-400 transition hover:border-white/20 hover:text-white"
          aria-label="Volver"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {isEditing ? "Editar juego" : "Añadir nuevo juego"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isEditing
              ? "Actualiza los datos de tu ficha."
              : "Escribe el título y elige el juego en la lista de resultados."}
          </p>
        </div>
      </div>

      <div className="figma-panel p-6 sm:p-9">
        {feedback.text && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === "ok"
                ? "border-emerald-500/35 bg-emerald-950/40 text-emerald-100"
                : "border-red-500/35 bg-red-950/35 text-red-100"
            }`}
            role="status"
          >
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              Título del juego <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              placeholder="Ej. The Legend of Zelda: Breath of the Wild"
              className="figma-input"
              autoComplete="off"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {coverLoading && (
                <span className="text-xs text-brand-accent animate-pulse">
                  Buscando coincidencias…
                </span>
              )}
              {!coverLoading && coverHint && (
                <span className="text-xs text-slate-500">{coverHint}</span>
              )}
            </div>

            {!coverLoading && coverOptions.length > 0 && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-400">
                  Elige el juego
                </label>
                <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-white/10 bg-brand-input/40 p-2 sm:grid-cols-3">
                  {coverOptions.map((opt) => {
                    const active = selectedCoverKey === coverKey(opt);
                    return (
                      <button
                        key={coverKey(opt)}
                        type="button"
                        onClick={() => selectCoverOption(opt)}
                        className={`flex flex-col gap-1.5 rounded-lg border p-2 text-left transition ${
                          active
                            ? "border-brand-accent bg-brand-accent/10 ring-1 ring-brand-accent/40"
                            : "border-transparent bg-slate-900/50 hover:border-white/15"
                        }`}
                      >
                        <img
                          src={opt.background_image}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="aspect-[3/4] w-full rounded-md object-cover"
                          loading="lazy"
                        />
                        <span className="line-clamp-2 text-[0.7rem] leading-tight text-slate-300">
                          {opt.name}
                        </span>
                        <span className="text-[0.65rem] uppercase tracking-wide text-slate-500">
                          {opt.source === "rawg" ? "RAWG" : "Steam"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.url_imagen && !coverLoading && (
              <div className="mt-4 flex items-start gap-4">
                <img
                  src={formData.url_imagen}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-28 w-20 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                  onError={() => {
                    setFormData((f) => ({ ...f, url_imagen: "" }));
                    setCoverHint("No se pudo cargar la imagen.");
                  }}
                />
                <p className="text-xs leading-relaxed text-slate-500">
                  Vista previa; se guarda con la ficha.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Plataforma
              </label>
              <input
                type="text"
                name="plataforma"
                list="platform-list"
                value={formData.plataforma}
                onChange={handleChange}
                placeholder="Ej. PC"
                className="figma-input"
              />
              <datalist id="platform-list">
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Estado
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="figma-input"
              >
                <option value="Pendiente">Backlog</option>
                <option value="Jugando">Jugando</option>
                <option value="Completado">Completado</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Horas jugadas
              </label>
              <input
                type="number"
                name="horas_jugadas"
                min="0"
                value={formData.horas_jugadas}
                onChange={handleChange}
                className="figma-input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Nota (0–10)
              </label>
              <input
                type="number"
                name="puntuacion"
                min="0"
                max="10"
                value={formData.puntuacion}
                onChange={handleChange}
                className="figma-input"
              />
            </div>
          </div>

          {isEditing && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={mergeDuplicate}
                  onChange={(e) => setMergeDuplicate(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-brand-input text-brand-accent focus:ring-brand-accent/40"
                />
                <span>
                  <span className="font-medium text-amber-100/95">
                    Eliminar la otra ficha duplicada
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                    Actívalo si al guardar el juego correcto el sistema dice que ya tienes
                    otra entrada con el mismo título o catálogo (por ejemplo tenías el DLC
                    y ya habías añadido el juego base). Se borrará la otra ficha y se
                    conservará esta.
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.06] pt-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-lg border border-white/10 bg-brand-input px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="figma-btn-primary px-8 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formSubmitting
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Crear juego"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

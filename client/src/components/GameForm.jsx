import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_BASE, authHeaders } from "../api";

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
          setFormData({
            titulo: data.titulo,
            estado: data.estado,
            plataforma: data.plataforma ?? "",
            puntuacion: data.puntuacion,
            horas_jugadas: data.horas_jugadas,
            url_imagen: data.url_imagen ?? "",
          });
        })
        .catch((err) => console.error("Error al obtener el juego:", err));
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    setFeedback({ type: "", text: "" });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    const url = isEditing
      ? `${API_BASE}/api/games/${id}`
      : `${API_BASE}/api/games`;

    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: authHeaders(),
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
        return;
      }

      const data = await response.json();

      if (response.status === 400) {
        setFeedback({ type: "error", text: data.error || "No se pudo guardar." });
        return;
      }

      if (response.ok) {
        setFeedback({
          type: "ok",
          text: isEditing
            ? "Juego actualizado correctamente."
            : "Juego guardado correctamente.",
        });
        setTimeout(() => navigate("/"), 900);
      }
    } catch (error) {
      console.error("Error en la operación:", error);
      setFeedback({
        type: "error",
        text: "No se pudo conectar con el servidor.",
      });
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
              : "Registra un nuevo juego en tu biblioteca personal."}
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
            />
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              URL de imagen (opcional)
            </label>
            <input
              type="url"
              name="url_imagen"
              value={formData.url_imagen}
              onChange={handleChange}
              placeholder="https://ejemplo.com/portada.jpg"
              className="figma-input"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.06] pt-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-lg border border-white/10 bg-brand-input px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
            >
              Cancelar
            </button>
            <button type="submit" className="figma-btn-primary px-8 py-3">
              {isEditing ? "Guardar cambios" : "Crear juego"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import UserAvatar from "./UserAvatar";
import { displayCoverUrl } from "../coverUrl";
import ErrorRetryPanel from "./ErrorRetryPanel";

/**
 * Bandeja de recomendaciones recibidas.
 */
export default function RecommendationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/social/recommendations`);
      if (!res.ok) {
        setErr("No se pudo cargar la bandeja.");
        setItems([]);
        return;
      }
      setItems(await res.json());
    } catch {
      setErr("Error de conexión.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await apiFetch(`${API_BASE}/api/social/recommendations/${id}/read`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, leida: true } : r)),
      );
    } catch {
      /* ignorar */
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Recomendaciones
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Juegos que otros miembros te han recomendado desde su biblioteca.
          </p>
        </div>
        <Link
          to="/community"
          className="text-sm font-medium text-brand-accent transition hover:text-teal-300"
        >
          ← Comunidad
        </Link>
      </header>

      {loading && (
        <ul
          className="space-y-4"
          aria-busy="true"
          aria-label="Cargando recomendaciones"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="figma-panel h-28 animate-pulse bg-slate-900/40 ring-0"
            />
          ))}
        </ul>
      )}
      {err && !loading && (
        <ErrorRetryPanel title={err} onRetry={() => void load()} />
      )}

      {!loading && !err && items.length === 0 && (
        <div className="figma-panel px-6 py-12 text-center text-sm text-slate-400">
          Aún no tienes recomendaciones. Pide a alguien que te siga y te envíe
          un título desde su colección.
        </div>
      )}

      {!loading && !err && items.length > 0 && (
      <ul className="space-y-4">
        {items.map((r) => {
          const cover = r.juego_url_imagen?.trim()
            ? displayCoverUrl(r.juego_url_imagen.trim())
            : "";
          return (
            <li key={r.id}>
              <article
                className={`figma-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-start ${
                  !r.leida ? "ring-1 ring-brand-accent/35" : ""
                }`}
              >
                <div className="flex shrink-0 items-start gap-3">
                  <UserAvatar
                    avatarId={r.remitente_avatar_id}
                    size="lg"
                    title={r.remitente_nombre}
                  />
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className="h-20 w-14 rounded-lg object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-20 w-14 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-500">
                      Sin carátula
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-400">
                    <span className="font-semibold text-brand-accent">
                      {r.remitente_nombre}
                    </span>{" "}
                    te recomienda
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-white">
                    {r.juego_titulo}
                  </h2>
                  {r.mensaje && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      «{r.mensaje}»
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleString("es-ES")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/juego/${r.juego_id}/discussion`}
                      className="text-sm font-semibold text-brand-accent hover:text-teal-300"
                      onClick={() => {
                        if (!r.leida) markRead(r.id);
                      }}
                    >
                      Ver ficha y discusión →
                    </Link>
                    {!r.leida && (
                      <button
                        type="button"
                        className="text-sm font-medium text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-slate-200"
                        onClick={() => markRead(r.id)}
                      >
                        Marcar leída
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}

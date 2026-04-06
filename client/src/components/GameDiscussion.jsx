import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import { displayCoverUrl } from "../coverUrl";

/**
 * Lee y parsea el usuario actual del localStorage.
 * Encapsula el try-catch para no repetirlo en cada componente que lo necesite.
 * @returns {object|null} Objeto de usuario o null si no hay sesión.
 */
function parseUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Bloque recursivo que renderiza un comentario y sus respuestas anidadas.
 * Se llama a sí mismo (recursivamente) para los comentarios hijos,
 * aumentando la sangría (`depth`) en cada nivel.
 * Puede borrar: el autor del comentario, el dueño del juego o un admin.
 *
 * @component
 * @param {object}   props
 * @param {object}   props.c             - Datos del comentario actual.
 * @param {object[]} props.childrenList  - Lista de comentarios hijos directos.
 * @param {number}   props.depth         - Nivel de anidamiento actual (0 = raíz).
 * @param {string}   props.gameId        - ID del juego al que pertenece el comentario.
 * @param {number}   props.gameOwnerId   - ID del propietario de la ficha de juego.
 * @param {Function} props.onDeleted     - Callback para recargar los comentarios tras borrar.
 * @param {Function} props.onReply       - Callback para marcar este comentario como "respondiendo a".
 * @param {Map}      props.allByParent   - Mapa completo de `parentId → [comentarios hijos]`.
 */
function CommentBlock({
  c,
  childrenList,
  depth,
  gameId,
  gameOwnerId,
  onDeleted,
  onReply,
  allByParent,
}) {
  const me = parseUser();
  const canDelete =
    me &&
    (me.id === c.usuario_id ||
      me.id === gameOwnerId ||
      me.rol === "admin");

  return (
    <div
      className={`${depth > 0 ? "ml-6 border-l border-white/[0.08] pl-4" : ""}`}
    >
      <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-semibold text-brand-accent">
            {c.autor_nombre || "Usuario"}
          </span>
          <time
            className="text-xs text-slate-500"
            dateTime={c.fecha_creacion}
          >
            {c.fecha_creacion
              ? new Date(c.fecha_creacion).toLocaleString("es-ES", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : ""}
          </time>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
          {c.cuerpo}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onReply(c.id)}
            className="text-xs font-medium text-slate-400 hover:text-brand-accent"
          >
            Responder
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm("¿Eliminar este comentario?")) return;
                try {
                  const res = await apiFetch(
                    `${API_BASE}/api/games/${gameId}/comments/${c.id}`,
                    { method: "DELETE" },
                  );
                  if (res.ok) onDeleted();
                } catch {
                  alert("No se pudo eliminar.");
                }
              }}
              className="text-xs font-medium text-red-400/90 hover:text-red-300"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
      {(childrenList || []).map((ch) => (
        <CommentBlock
          key={ch.id}
          c={ch}
          childrenList={allByParent.get(ch.id) || []}
          depth={depth + 1}
          gameId={gameId}
          gameOwnerId={gameOwnerId}
          onDeleted={onDeleted}
          onReply={onReply}
          allByParent={allByParent}
        />
      ))}
    </div>
  );
}

/**
 * Página de discusión y reseñas de una ficha de juego.
 * Carga en paralelo los datos del juego y su hilo de comentarios.
 * Los comentarios se organizan en árbol usando un Map de `parentId → hijos`
 * para renderizar las respuestas anidadas sin recursión extra de datos.
 *
 * @component
 */
export default function GameDiscussion() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setErr("");
    try {
      const [gRes, cRes] = await Promise.all([
        apiFetch(`${API_BASE}/api/community/games/${gameId}`),
        apiFetch(`${API_BASE}/api/games/${gameId}/comments`),
      ]);

      if (!gRes.ok) {
        setErr("No se encontró el juego.");
        setLoading(false);
        return;
      }

      const gData = await gRes.json();
      setGame(gData);

      if (cRes.status === 503) {
        const d = await cRes.json().catch(() => ({}));
        setErr(d.error || "Comentarios no disponibles.");
        setComments([]);
      } else if (cRes.ok) {
        const cData = await cRes.json();
        setComments(Array.isArray(cData.comments) ? cData.comments : []);
      } else {
        setComments([]);
      }
    } catch (e) {
      console.error(e);
      setErr("Error al cargar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [gameId]);

  const submit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/games/${gameId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          cuerpo: body,
          parent_id: replyTo ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "No se pudo publicar.");
        return;
      }
      setText("");
      setReplyTo(null);
      load();
    } catch {
      alert("Error de conexión.");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="figma-panel py-20 text-center text-lg font-medium text-brand-accent animate-pulse">
        Cargando…
      </div>
    );
  }

  if (!game) {
    return (
      <div className="figma-panel px-6 py-12 text-center text-slate-400">
        {err || "Juego no encontrado."}
        <div className="mt-6">
          <Link to="/community" className="figma-btn-primary inline-flex">
            Volver a comunidad
          </Link>
        </div>
      </div>
    );
  }

  const rawCover = game.url_imagen?.trim();
  const coverSrc = rawCover ? displayCoverUrl(rawCover) : "";

  const byParent = new Map();
  for (const c of comments) {
    const k = c.parent_id ?? 0;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k).push(c);
  }
  const roots = byParent.get(0) || [];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <Link
          to={`/user/${game.usuario_id}`}
          className="text-sm font-medium text-brand-accent hover:text-teal-300"
        >
          ← Colección de {game.propietario_nombre}
        </Link>
      </div>

      <div className="figma-panel mb-8 overflow-hidden p-0 sm:flex">
        <div className="relative h-48 w-full shrink-0 bg-slate-900 sm:h-auto sm:w-52">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-600">
              Sin carátula
            </div>
          )}
        </div>
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {game.titulo}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Entrada de{" "}
            <span className="text-slate-300">{game.propietario_nombre}</span>
            · {game.plataforma || "—"} · Nota {game.puntuacion ?? "—"}/10
          </p>
        </div>
      </div>

      {err && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          {err}
        </div>
      )}

      <section className="figma-panel p-6 sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-white">
          Discusión y reseñas
        </h2>

        <form onSubmit={submit} className="mb-8 space-y-3">
          {replyTo != null && (
            <p className="text-xs text-slate-500">
              Respondiendo al hilo #{replyTo}{" "}
              <button
                type="button"
                className="text-brand-accent hover:underline"
                onClick={() => setReplyTo(null)}
              >
                Cancelar
              </button>
            </p>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tu reseña o comentario…"
            rows={4}
            className="figma-input resize-y"
            maxLength={8000}
          />
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className="figma-btn-primary px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {posting ? "Publicando…" : "Publicar"}
          </button>
        </form>

        <div className="space-y-4">
          {roots.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no hay mensajes. Sé el primero en comentar.
            </p>
          ) : (
            roots.map((c) => (
              <CommentBlock
                key={c.id}
                c={c}
                childrenList={byParent.get(c.id) || []}
                depth={0}
                gameId={gameId}
                gameOwnerId={game.usuario_id}
                onDeleted={load}
                onReply={(id) => setReplyTo(id)}
                allByParent={byParent}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

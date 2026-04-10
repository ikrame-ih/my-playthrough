import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import { displayCoverUrl } from "../coverUrl";
import { IconThumbDown, IconThumbUp } from "./icons";
import UserAvatar from "./UserAvatar";

/**
 * Lee y parsea el usuario actual del localStorage.
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
 * Bloque recursivo: reseña o respuesta. Las reseñas raíz incluyen votación estilo Steam.
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
  onVote,
  voteBusyId,
  highlightId,
}) {
  const me = parseUser();
  const canDelete =
    me &&
    (me.id === c.usuario_id ||
      me.id === gameOwnerId ||
      me.rol === "admin");

  const isRoot = depth === 0;
  const mi = c.mi_voto;
  const up = c.votos_arriba ?? 0;
  const down = c.votos_abajo ?? 0;

  return (
    <div
      className={`${depth > 0 ? "ml-6 border-l border-white/[0.08] pl-4" : ""}`}
    >
      <div
        id={`comment-${c.id}`}
        className={`flex gap-3 ${isRoot ? "sm:gap-4" : ""}`}
      >
        {isRoot && (
          <div
            className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-[#0d1520] px-2 py-2 shadow-inner"
            aria-label="Valoración de la reseña"
          >
            <span className="text-[0.7rem] font-bold tabular-nums text-slate-500">
              {up}
            </span>
            <button
              type="button"
              disabled={voteBusyId === c.id}
              onClick={() => onVote(c.id, mi === 1 ? 0 : 1)}
              className={`rounded-lg p-1.5 transition ${
                mi === 1
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"
              }`}
              title={mi === 1 ? "Quitar voto positivo" : "Útil"}
              aria-pressed={mi === 1}
              aria-label="Voto positivo"
            >
              <IconThumbUp className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={voteBusyId === c.id}
              onClick={() => onVote(c.id, mi === -1 ? 0 : -1)}
              className={`rounded-lg p-1.5 transition ${
                mi === -1
                  ? "bg-rose-500/20 text-rose-400"
                  : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"
              }`}
              title={mi === -1 ? "Quitar voto negativo" : "No recomendado"}
              aria-pressed={mi === -1}
              aria-label="Voto negativo"
            >
              <IconThumbDown className="h-5 w-5" />
            </button>
            <span className="text-[0.7rem] font-bold tabular-nums text-slate-500">
              {down}
            </span>
          </div>
        )}

        <div
          className={`min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-slate-900/40 px-4 py-3 transition-shadow ${
            highlightId === String(c.id)
              ? "ring-2 ring-brand-accent/40 shadow-[0_0_24px_-8px_rgba(45,212,191,0.35)]"
              : ""
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              to={`/user/${c.usuario_id}`}
              className="flex min-w-0 items-center gap-2 hover:opacity-90"
            >
              <UserAvatar
                avatarId={c.autor_avatar_id}
                size="sm"
                title={`Avatar de ${c.autor_nombre || "Usuario"}`}
              />
              <span className="truncate font-semibold text-brand-accent">
                {c.autor_nombre || "Usuario"}
              </span>
            </Link>
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
          onVote={onVote}
          voteBusyId={voteBusyId}
          highlightId={highlightId}
        />
      ))}
    </div>
  );
}

/**
 * Reseñas y discusión de una ficha (vista pública). Votación en reseñas raíz.
 */
export default function GameDiscussion() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("c");

  const [game, setGame] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [posting, setPosting] = useState(false);
  const [voteBusyId, setVoteBusyId] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar solo al cambiar ficha
  }, [gameId]);

  useEffect(() => {
    if (loading || !highlightId) return;
    const t = window.setTimeout(() => {
      document
        .getElementById(`comment-${highlightId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [loading, highlightId, comments]);

  const onVote = useCallback(
    async (commentId, val) => {
      setVoteBusyId(commentId);
      try {
        const res = await apiFetch(
          `${API_BASE}/api/games/${gameId}/comments/${commentId}/vote`,
          {
            method: "PUT",
            body: JSON.stringify({ val }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.error || "No se pudo votar.");
          return;
        }
        setComments((prev) =>
          prev.map((row) =>
            row.id === commentId
              ? {
                  ...row,
                  votos_arriba: data.votos_arriba,
                  votos_abajo: data.votos_abajo,
                  mi_voto: data.mi_voto,
                }
              : row,
          ),
        );
      } catch {
        alert("Error de conexión.");
      } finally {
        setVoteBusyId(null);
      }
    },
    [gameId],
  );

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
  const rootsRaw = byParent.get(0) || [];
  const roots = rootsRaw.slice().sort((a, b) => {
    const netA = (a.votos_arriba || 0) - (a.votos_abajo || 0);
    const netB = (b.votos_arriba || 0) - (b.votos_abajo || 0);
    if (netB !== netA) return netB - netA;
    return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
  });

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
        <h2 className="mb-1 text-lg font-bold text-white">
          Reseñas y discusión
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Cualquier miembro puede leer y publicar. Las reseñas de primer nivel
          admiten votación útil / no recomendado (como en Steam). Las respuestas
          van en hilo.
        </p>

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
            placeholder="Escribe tu reseña o respuesta…"
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
              Aún no hay reseñas. Sé el primero en opinar.
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
                onVote={onVote}
                voteBusyId={voteBusyId}
                highlightId={highlightId}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import { useSearch } from "../SearchContext";
import { IconUsers } from "./icons";
import { CommunityMemberSkeleton } from "./Skeletons";
import UserAvatar from "./UserAvatar";
import ErrorRetryPanel from "./ErrorRetryPanel";

function getCurrentUserRole() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}")?.rol ?? "user";
  } catch {
    return "user";
  }
}

function getCurrentUserId() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}")?.id ?? null;
  } catch {
    return null;
  }
}

function labelLfgModo(m) {
  if (m === "online") return "Online / multiplayer";
  if (m === "coop_local") return "Local co-op or split-screen";
  return "Other";
}

/**
 * Página Comunidad con pestañas internas (estado React `tab`): Miembros (lista de
 * usuarios con seguir/dejar de seguir), Estadísticas (medias SQL globales), Actividad
 * (comentarios y LFG de gente a la que sigues) y Buscar grupo (publicar y listar LFG).
 * Los datos vienen de `/api/users`, `/api/community/stats`, `/api/social/activity` y `/api/social/lfg`.
 */
export default function Community() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [mainRetry, setMainRetry] = useState(0);
  const [tab, setTab] = useState("members");
  const { query } = useSearch();

  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [lfgList, setLfgList] = useState([]);
  const [lfgLoading, setLfgLoading] = useState(false);
  const [myGames, setMyGames] = useState([]);
  const [lfgGameId, setLfgGameId] = useState("");
  const [lfgModo, setLfgModo] = useState("online");
  const [lfgMsg, setLfgMsg] = useState("");
  const [lfgErr, setLfgErr] = useState("");
  const [lfgSubmitting, setLfgSubmitting] = useState(false);

  const isAdmin = getCurrentUserRole() === "admin";
  const myId = getCurrentUserId();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError(false);
      setLoading(true);
      try {
        const [uRes, sRes] = await Promise.all([
          apiFetch(`${API_BASE}/api/users`),
          apiFetch(`${API_BASE}/api/community/stats`),
        ]);
        if (cancelled) return;
        if (!uRes.ok) {
          setLoadError(true);
          return;
        }
        setUsers(await uRes.json());
        if (sRes.ok) {
          setStats(await sRes.json());
        } else {
          setStats([]);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [mainRetry]);

  useEffect(() => {
    if (tab !== "activity") return;
    let cancelled = false;
    async function load() {
      setActivityLoading(true);
      try {
        const res = await apiFetch(`${API_BASE}/api/social/activity`);
        if (res.ok && !cancelled) setActivity(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  useEffect(() => {
    if (tab !== "lfg") return;
    let cancelled = false;
    async function load() {
      setLfgLoading(true);
      try {
        const [lr, gr] = await Promise.all([
          apiFetch(`${API_BASE}/api/social/lfg`),
          apiFetch(`${API_BASE}/api/games`),
        ]);
        if (lr.ok && !cancelled) setLfgList(await lr.json());
        if (gr.ok && !cancelled) setMyGames(await gr.json());
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLfgLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const refreshLfg = async () => {
    const lr = await apiFetch(`${API_BASE}/api/social/lfg`);
    if (lr.ok) setLfgList(await lr.json());
  };

  const toggleFollowMember = async (u, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (u.siguiendo) {
        const res = await apiFetch(`${API_BASE}/api/social/follow/${u.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setUsers((prev) =>
            prev.map((x) =>
              x.id === u.id
                ? {
                    ...x,
                    siguiendo: false,
                    num_seguidores: Math.max(0, (x.num_seguidores ?? 0) - 1),
                  }
                : x,
            ),
          );
        }
      } else {
        const res = await apiFetch(`${API_BASE}/api/social/follow/${u.id}`, {
          method: "POST",
        });
        if (res.ok || res.status === 201) {
          setUsers((prev) =>
            prev.map((x) =>
              x.id === u.id
                ? {
                    ...x,
                    siguiendo: true,
                    num_seguidores: (x.num_seguidores ?? 0) + 1,
                  }
                : x,
            ),
          );
        }
      }
    } catch {
      /* ignorar */
    }
  };

  const submitLfg = async (ev) => {
    ev.preventDefault();
    setLfgErr("");
    const juego_id = parseInt(lfgGameId, 10);
    if (!Number.isFinite(juego_id)) {
      setLfgErr("Pick a game from your collection.");
      return;
    }
    const mensaje = lfgMsg.trim();
    if (!mensaje) {
      setLfgErr("Write a message (what you need, schedule, platform…).");
      return;
    }
    setLfgSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/social/lfg`, {
        method: "POST",
        body: JSON.stringify({
          juego_id,
          modo: lfgModo,
          mensaje,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLfgErr(data.error || "Could not post.");
        return;
      }
      setLfgMsg("");
      await refreshLfg();
    } catch {
      setLfgErr("Connection error.");
    } finally {
      setLfgSubmitting(false);
    }
  };

  const deleteLfg = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/social/lfg/${id}`, {
        method: "DELETE",
      });
      if (res.ok) await refreshLfg();
    } catch {
      /* ignorar */
    }
  };

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.nombre_usuario || "").toLowerCase().includes(q),
    );
  }, [users, query]);

  const tabBtn = (id, label) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 sm:px-4 ${
        tab === id
          ? "bg-brand-accent/18 text-brand-accent shadow-[inset_0_0_16px_-6px_rgba(45,212,191,0.35)] ring-1 ring-brand-accent/30"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Community
          </h1>
        </header>
        <ul
          aria-busy="true"
          aria-label="Loading members"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}>
              <CommunityMemberSkeleton />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Community
          </h1>
        </header>
        <ErrorRetryPanel
          title="We couldn't load the community."
          onRetry={() => setMainRetry((n) => n + 1)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Community
        </h1>
        <p className="mt-2 max-w-2xl text-base text-brand-accent/90">
          Members, stats, activity from people you follow, and find players
          to team up (LFG). Personal recommendations live in the header bell.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-full bg-slate-900/90 p-1 ring-1 ring-brand-accent/15 shadow-[0_0_24px_-8px_rgba(45,212,191,0.25)]">
        <button
          type="button"
          onClick={() => setTab("members")}
          className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 sm:px-4 ${
            tab === "members"
              ? "bg-brand-accent/18 text-brand-accent shadow-[inset_0_0_16px_-6px_rgba(45,212,191,0.35)] ring-1 ring-brand-accent/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <IconUsers className="h-4 w-4 shrink-0 opacity-90" />
          Members
        </button>
        {tabBtn("stats", "Statistics")}
        {tabBtn("activity", "Activity")}
        {tabBtn("lfg", "Find group")}
      </div>

      {tab === "members" && (
        <section>
          {users.length === 0 ? (
            <p className="figma-panel px-5 py-8 text-sm text-slate-400">
              No other registered users yet besides you.
            </p>
          ) : filteredUsers.length === 0 ? (
            <p className="figma-panel px-5 py-8 text-sm text-slate-400">
              No members match your search.
            </p>
          ) : (
            <ul className="motion-stagger grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredUsers.map((u) => {
                const name = (u.nombre_usuario || "?").trim();
                const num = u.num_juegos ?? 0;
                const seg = u.num_seguidores ?? 0;
                const plat = u.plataforma_ejemplo?.trim() || "—";
                return (
                  <li key={u.id}>
                    <div className="figma-panel-interactive relative flex items-center gap-4 p-4">
                      <Link
                        to={`/user/${u.id}`}
                        className="flex min-w-0 flex-1 items-center gap-4"
                      >
                        <UserAvatar
                          avatarId={u.avatar_id}
                          size="lg"
                          title={`${name}'s avatar`}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {u.nombre_usuario}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {num} {num === 1 ? "game" : "games"} · {seg}{" "}
                            {seg === 1 ? "follower" : "followers"} · {plat}
                          </p>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => toggleFollowMember(u, e)}
                        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                          u.siguiendo
                            ? "bg-white/[0.08] text-brand-accent ring-1 ring-brand-accent/25"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {u.siguiendo ? "Following" : "Follow"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "stats" && (
        <section>
          {isAdmin && (
            <p className="mb-5 max-w-2xl text-sm leading-relaxed text-slate-400">
              Average score per title across all community ratings.
            </p>
          )}
          {stats.length === 0 ? (
            <p className="figma-panel px-5 py-8 text-sm text-slate-500">
              Not enough data to calculate averages yet.
            </p>
          ) : (
            <div className="figma-table-wrap">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] bg-slate-900/40 text-slate-300">
                  <tr>
                    <th className="p-3 font-semibold">Title</th>
                    <th className="p-3 font-semibold">Avg. score</th>
                    <th className="p-3 font-semibold">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((row) => (
                    <tr
                      key={row.titulo}
                      className="border-t border-white/[0.04] transition hover:bg-slate-900/35"
                    >
                      <td className="p-3 font-medium text-slate-200">
                        {row.titulo}
                      </td>
                      <td className="p-3 text-brand-accent">
                        {row.nota_media}
                      </td>
                      <td className="p-3 text-slate-400">{row.num_votos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "activity" && (
        <section className="space-y-4">
          <p className="max-w-2xl text-sm text-slate-400">
            Comments and LFG posts from people you follow. Follow profiles from
            the Members tab or from their public collection.
          </p>
          {activityLoading && (
            <p className="text-sm text-slate-500">Loading activity…</p>
          )}
          {!activityLoading && activity.length === 0 && (
            <div className="figma-panel px-6 py-10 text-center text-sm text-slate-400">
              No recent activity. Follow other members to see updates here.
            </div>
          )}
          <ul className="space-y-3">
            {activity.map((row, i) => (
              <li key={`${row.tipo}-${row.en}-${i}`}>
                <div className="figma-panel px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <UserAvatar
                      avatarId={row.actor_avatar_id}
                      size="sm"
                      title={row.actor_nombre}
                    />
                    <span className="font-semibold text-white">
                      {row.actor_nombre}
                    </span>
                    <span className="text-slate-500">
                      {row.tipo === "comentario"
                        ? "commented on"
                        : "is LFG for"}
                    </span>
                    <Link
                      to={
                        row.tipo === "comentario" && row.comentario_id
                          ? `/juego/${row.juego_ficha_id}/discussion?c=${row.comentario_id}`
                          : `/juego/${row.juego_ficha_id}/discussion`
                      }
                      className="font-medium text-brand-accent hover:text-teal-300"
                    >
                      {row.juego_titulo}
                    </Link>
                  </div>
                  {row.tipo === "comentario" && row.resumen && (
                    <p className="mt-2 line-clamp-2 text-slate-400">
                      {row.resumen}
                    </p>
                  )}
                  {row.tipo === "lfg" && (
                    <p className="mt-2 text-slate-300">
                      <span className="text-xs font-semibold uppercase tracking-wide text-brand-accent/90">
                        {labelLfgModo(row.modo)}
                      </span>
                      {" · "}
                      {row.lfg_mensaje}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-600">
                    {new Date(row.en).toLocaleString("en-US")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "lfg" && (
        <section className="space-y-8">
          <div className="figma-panel p-6">
            <h2 className="text-lg font-bold text-white">Post a search</h2>
            <p className="mt-2 text-sm text-slate-400">
              Pick a title from your library, say how you want to play (online,
              local…), and what you are looking for. You choose the mode — we
              do not block single-player titles because optional modes vary.
            </p>
            <form onSubmit={submitLfg} className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-400">
                  Your game
                </span>
                <select
                  className="figma-input py-3 text-sm"
                  value={lfgGameId}
                  onChange={(e) => setLfgGameId(e.target.value)}
                  required
                >
                  <option value="">— Choose —</option>
                  {myGames.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.titulo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-400">Mode</span>
                <select
                  className="figma-input py-3 text-sm"
                  value={lfgModo}
                  onChange={(e) => setLfgModo(e.target.value)}
                >
                  <option value="online">Online / multiplayer</option>
                  <option value="coop_local">
                    Local co-op or split-screen
                  </option>
                  <option value="otro">Other</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-400">
                  Message
                </span>
                <textarea
                  className="figma-input min-h-[100px] py-3 text-sm"
                  value={lfgMsg}
                  onChange={(e) => setLfgMsg(e.target.value)}
                  maxLength={500}
                  placeholder="e.g. Ranked nights, EUW, voice chat…"
                  required
                />
              </label>
              {lfgErr && (
                <p className="text-sm text-red-400" role="alert">
                  {lfgErr}
                </p>
              )}
              <button
                type="submit"
                disabled={lfgSubmitting}
                className="figma-btn-primary self-start"
              >
                {lfgSubmitting ? "Posting…" : "Post"}
              </button>
            </form>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold text-white">
              Active posts
            </h2>
            {lfgLoading && <p className="text-sm text-slate-500">Loading…</p>}
            {!lfgLoading && lfgList.length === 0 && (
              <p className="figma-panel px-6 py-10 text-center text-sm text-slate-400">
                No one has posted a search yet.
              </p>
            )}
            <ul className="space-y-3">
              {lfgList.map((row) => (
                <li key={row.id}>
                  <div className="figma-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <UserAvatar
                        avatarId={row.avatar_id}
                        size="md"
                        title={row.nombre_usuario}
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {row.nombre_usuario}
                        </p>
                        <p className="text-sm text-brand-accent">
                          {row.juego_titulo}{" "}
                          <span className="text-slate-500">
                            · {row.plataforma?.trim() || "—"}
                          </span>
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {labelLfgModo(row.modo)}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          {row.mensaje}
                        </p>
                        <p className="mt-2 text-xs text-slate-600">
                          {new Date(row.created_at).toLocaleString("en-US")}
                        </p>
                        <Link
                          to={`/juego/${row.juego_id}/discussion`}
                          className="mt-2 inline-block text-xs font-semibold text-brand-accent hover:text-teal-300"
                        >
                          View game & discussion →
                        </Link>
                      </div>
                    </div>
                    {(row.usuario_id === myId || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => deleteLfg(row.id)}
                        className="self-end text-xs font-semibold text-red-400 hover:text-red-300 sm:self-start"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

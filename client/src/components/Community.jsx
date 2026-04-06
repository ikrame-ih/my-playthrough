import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, authHeaders } from "../api";
import { useSearch } from "../SearchContext";
import { IconUsers } from "./icons";
import { CommunityMemberSkeleton } from "./Skeletons";

/**
 * Página de la comunidad con dos pestañas: miembros y estadísticas globales.
 * Carga en paralelo la lista de usuarios y las estadísticas para reducir
 * el tiempo de espera total. La pestaña "Miembros" filtra por el SearchContext.
 * La variable `cancelled` evita actualizar el estado si el componente se desmonta
 * antes de que llegue la respuesta (evita un warning de React sobre actualizaciones
 * en componentes desmontados).
 *
 * @component
 */
export default function Community() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("members");
  const { query } = useSearch();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [uRes, sRes] = await Promise.all([
          fetch(`${API_BASE}/api/users`, { headers: authHeaders() }),
          fetch(`${API_BASE}/api/community/stats`, { headers: authHeaders() }),
        ]);

        if (uRes.status === 401 || sRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.reload();
          return;
        }

        if (uRes.ok && !cancelled) {
          setUsers(await uRes.json());
        }
        if (sRes.ok && !cancelled) {
          setStats(await sRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.nombre_usuario || "").toLowerCase().includes(q),
    );
  }, [users, query]);

  if (loading) {
    // Skeleton mientras carga
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Comunidad
          </h1>
        </header>
        <ul
          aria-busy="true"
          aria-label="Cargando miembros"
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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Comunidad
        </h1>
        <p className="mt-2 max-w-2xl text-base text-brand-accent/90">
          Conecta con otros jugadores y descubre las estadísticas globales
        </p>
      </header>

      <div className="inline-flex rounded-full bg-slate-900/90 p-1 ring-1 ring-white/10">
        <button
          type="button"
          onClick={() => setTab("members")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "members"
              ? "bg-white/[0.12] text-white shadow-inner"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <IconUsers className="h-4 w-4 opacity-90" />
          Miembros
        </button>
        <button
          type="button"
          onClick={() => setTab("stats")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "stats"
              ? "bg-white/[0.12] text-white shadow-inner"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Estadísticas globales
        </button>
      </div>

      {tab === "members" && (
        <section>
          {users.length === 0 ? (
            <p className="figma-panel px-5 py-8 text-sm text-slate-400">
              Aún no hay otros usuarios registrados además de ti.
            </p>
          ) : filteredUsers.length === 0 ? (
            <p className="figma-panel px-5 py-8 text-sm text-slate-400">
              Ningún miembro coincide con la búsqueda.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredUsers.map((u) => {
                const letter = (u.nombre_usuario || "?")
                  .trim()
                  .charAt(0)
                  .toUpperCase();
                const num = u.num_juegos ?? 0;
                const plat =
                  u.plataforma_ejemplo?.trim() || "—";
                return (
                  <li key={u.id}>
                    <Link
                      to={`/user/${u.id}`}
                      className="figma-panel flex items-center gap-4 p-4 transition hover:border-brand-accent/35 hover:shadow-figma-lg"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-brand-accent/50 bg-slate-900 text-lg font-bold text-white">
                        {letter}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {u.nombre_usuario}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {num} juegos · {plat}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "stats" && (
        <section>
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-slate-400">
            Nota media por título según las puntuaciones que la comunidad va
            guardando (mismo título = misma fila).
          </p>
          {stats.length === 0 ? (
            <p className="figma-panel px-5 py-8 text-sm text-slate-500">
              Aún no hay datos suficientes para calcular medias.
            </p>
          ) : (
            <div className="figma-table-wrap">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] bg-slate-900/40 text-slate-300">
                  <tr>
                    <th className="p-3 font-semibold">Título</th>
                    <th className="p-3 font-semibold">Nota media</th>
                    <th className="p-3 font-semibold">Votos</th>
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
                      <td className="p-3 text-brand-accent">{row.nota_media}</td>
                      <td className="p-3 text-slate-400">{row.num_votos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import UserAvatar from "./UserAvatar";

/**
 * Resultados de la búsqueda global (usuarios y fichas de juego en toda la comunidad).
 */
export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim();
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!q) {
      setUsers([]);
      setGames([]);
      setErr("");
      return;
    }
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr("");
      try {
        const res = await apiFetch(
          `${API_BASE}/api/community/search?q=${encodeURIComponent(q)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setErr(data.error || "No se pudo buscar.");
          return;
        }
        if (!cancelled) {
          setUsers(Array.isArray(data.users) ? data.users : []);
          setGames(Array.isArray(data.games) ? data.games : []);
        }
      } catch {
        if (!cancelled) setErr("Error de conexión.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Resultados de búsqueda
        </h1>
        {q ? (
          <p className="mt-2 text-slate-400">
            Coincidencias para «<span className="text-slate-200">{q}</span>»
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Escribe en la barra superior y pulsa Intro para buscar miembros y
            juegos registrados en la comunidad.
          </p>
        )}
      </header>

      {err && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
          {err}
        </div>
      )}

      {loading && (
        <p className="text-sm text-brand-accent animate-pulse">Buscando…</p>
      )}

      {!loading && q && !err && users.length === 0 && games.length === 0 && (
        <div className="figma-panel px-6 py-12 text-center text-sm text-slate-400">
          No hay coincidencias. Prueba con otro término.
        </div>
      )}

      {!loading && (users.length > 0 || games.length > 0) && (
        <div className="grid gap-10 lg:grid-cols-2">
          {users.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold text-white">Miembros</h2>
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id}>
                    <Link
                      to={`/user/${u.id}`}
                      className="figma-panel flex items-center gap-3 px-4 py-3 transition hover:border-brand-accent/25"
                    >
                      <UserAvatar
                        avatarId={u.avatar_id}
                        size="md"
                        title={u.nombre_usuario}
                      />
                      <span className="font-medium text-slate-100">
                        {u.nombre_usuario}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {games.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold text-white">Juegos</h2>
              <ul className="space-y-2">
                {games.map((g) => (
                  <li key={`${g.id}-${g.usuario_id}`}>
                    <Link
                      to={`/juego/${g.id}/discussion`}
                      className="figma-panel flex flex-col gap-0.5 px-4 py-3 transition hover:border-brand-accent/25"
                    >
                      <span className="font-medium text-brand-accent">
                        {g.titulo}
                      </span>
                      <span className="text-xs text-slate-500">
                        En la colección de {g.propietario_nombre}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

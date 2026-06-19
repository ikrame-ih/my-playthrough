import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import UserAvatar from "./UserAvatar";
import ErrorRetryPanel from "./ErrorRetryPanel";

/**
 * Global search results (users and game entries across the community).
 */
export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim();
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [retryTick, setRetryTick] = useState(0);

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
          if (!cancelled) {
            setErr(data.error || "Search failed.");
            setUsers([]);
            setGames([]);
          }
          return;
        }
        if (!cancelled) {
          setUsers(Array.isArray(data.users) ? data.users : []);
          setGames(Array.isArray(data.games) ? data.games : []);
        }
      } catch {
        if (!cancelled) {
          setErr("Connection error.");
          setUsers([]);
          setGames([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [q, retryTick]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Search results
        </h1>
        {q ? (
          <p className="mt-2 text-slate-400">
            Matches for «<span className="text-slate-200">{q}</span>»
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Type in the top bar and press Enter to search members and
            games registered in the community.
          </p>
        )}
      </header>

      {err && !loading && q && (
        <ErrorRetryPanel
          className="mb-6"
          title={err}
          hint="Try another search or retry with the same terms."
          onRetry={() => setRetryTick((t) => t + 1)}
        />
      )}

      {loading && (
        <p className="text-sm text-brand-accent animate-pulse">Searching…</p>
      )}

      {!loading && q && !err && users.length === 0 && games.length === 0 && (
        <div className="figma-panel px-6 py-12 text-center text-sm text-slate-400">
          No matches. Try a different term.
        </div>
      )}

      {!loading && !err && (users.length > 0 || games.length > 0) && (
        <div className="grid gap-10 lg:grid-cols-2">
          {users.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-bold text-white">Members</h2>
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
              <h2 className="mb-4 text-lg font-bold text-white">Games</h2>
              <ul className="space-y-2">
                {games.map((g) => (
                  <li key={`${g.id}-${g.usuario_id}`}>
                    <Link
                      to={`/game/${g.id}/discussion`}
                      className="figma-panel flex flex-col gap-0.5 px-4 py-3 transition hover:border-brand-accent/25"
                    >
                      <span className="font-medium text-brand-accent">
                        {g.titulo}
                      </span>
                      <span className="text-xs text-slate-500">
                        In {g.propietario_nombre}'s collection
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

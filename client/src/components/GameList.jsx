import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import { useSearch } from "../SearchContext";
import GameCard from "./GameCard";
import GameListRow from "./GameListRow";
import EmptyCollection from "./EmptyCollection";
import CollectionStats from "./CollectionStats";
import { GameCardSkeleton } from "./Skeletons";
import RecommendGameModal from "./RecommendGameModal";

const LS_SORT = "myplaythrough_sort";
const LS_VIEW = "myplaythrough_view";

function estadoRank(estado) {
  if (estado === "Pendiente") return 0;
  if (estado === "Jugando") return 1;
  if (estado === "Completado") return 2;
  return 3;
}

/**
 * Grid o lista de la colección con ordenación, vista y estadísticas.
 */
export default function GameList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recoGame, setRecoGame] = useState(null);
  const { query } = useSearch();

  const [sort, setSort] = useState(
    () => localStorage.getItem(LS_SORT) || "reciente",
  );
  const [view, setView] = useState(
    () => localStorage.getItem(LS_VIEW) || "grid",
  );

  useEffect(() => {
    localStorage.setItem(LS_SORT, sort);
  }, [sort]);

  useEffect(() => {
    localStorage.setItem(LS_VIEW, view);
  }, [view]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        (g.titulo || "").toLowerCase().includes(q) ||
        (g.plataforma || "").toLowerCase().includes(q),
    );
  }, [games, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "titulo":
        list.sort((a, b) =>
          (a.titulo || "").localeCompare(b.titulo || "", "es", {
            sensitivity: "base",
          }),
        );
        break;
      case "estado":
        list.sort(
          (a, b) =>
            estadoRank(a.estado) - estadoRank(b.estado) ||
            (a.titulo || "").localeCompare(b.titulo || "", "es"),
        );
        break;
      case "nota":
        list.sort((a, b) => {
          const pa = Number(a.puntuacion);
          const pb = Number(b.puntuacion);
          const na = Number.isFinite(pa) ? pa : -1;
          const nb = Number.isFinite(pb) ? pb : -1;
          return nb - na;
        });
        break;
      case "reciente":
      default:
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
    }
    return list;
  }, [filtered, sort]);

  const fetchGames = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/api/games`);
      if (response.ok) {
        setGames(await response.json());
      }
    } catch (error) {
      console.error("Error cargando juegos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const eliminarJuego = async (id, titulo) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${titulo}"?`)) {
      try {
        const response = await apiFetch(`${API_BASE}/api/games/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchGames();
        }
      } catch (error) {
        alert("No se pudo eliminar el juego.");
      }
    }
  };

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Cargando colección"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return <EmptyCollection />;
  }

  if (filtered.length === 0) {
    return (
      <div className="figma-panel px-6 py-14 text-center text-slate-400">
        <p className="font-medium text-slate-200">
          Ningún juego coincide con tu búsqueda.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Prueba con otro título o plataforma.
        </p>
      </div>
    );
  }

  return (
    <div>
      <RecommendGameModal
        open={Boolean(recoGame)}
        onClose={() => setRecoGame(null)}
        preselectedGame={recoGame}
        fixedRecipientId={null}
        onSent={() => fetchGames()}
      />
      <CollectionStats games={games} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="collection-sort" className="sr-only">
            Ordenar por
          </label>
          <select
            id="collection-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="figma-input max-w-[220px] py-2.5 text-sm"
          >
            <option value="reciente">Más recientes primero</option>
            <option value="titulo">Título (A–Z)</option>
            <option value="estado">Estado (backlog → completado)</option>
            <option value="nota">Nota (mayor primero)</option>
          </select>
        </div>
        <div
          className="inline-flex rounded-xl bg-slate-900/80 p-1 ring-1 ring-white/10"
          role="group"
          aria-label="Vista de la colección"
        >
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              view === "grid"
                ? "bg-brand-accent/20 text-brand-accent ring-1 ring-brand-accent/30"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Cuadrícula
          </button>
          <button
            type="button"
            onClick={() => setView("compact")}
            aria-pressed={view === "compact"}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              view === "compact"
                ? "bg-brand-accent/20 text-brand-accent ring-1 ring-brand-accent/30"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="motion-stagger grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sorted.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              showActions
              onDelete={eliminarJuego}
              onRecommend={setRecoGame}
              discussionTo={`/juego/${game.id}/discussion`}
            />
          ))}
        </div>
      ) : (
        <div className="motion-stagger flex flex-col gap-3" role="list">
          {sorted.map((game) => (
            <div key={game.id} role="listitem">
              <GameListRow
                game={game}
                showActions
                onDelete={eliminarJuego}
                onRecommend={setRecoGame}
                discussionTo={`/juego/${game.id}/discussion`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

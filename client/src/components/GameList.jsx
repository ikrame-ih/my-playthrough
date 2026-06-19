import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import GameCard from "./GameCard";
import GameListRow from "./GameListRow";
import EmptyCollection from "./EmptyCollection";
import CollectionStats from "./CollectionStats";
import { GameCardSkeleton } from "./Skeletons";
import RecommendGameModal from "./RecommendGameModal";
import ErrorRetryPanel from "./ErrorRetryPanel";
import ConfirmDialog from "./ConfirmDialog";

const LS_SORT = "myplaythrough_sort";
const LS_VIEW = "myplaythrough_view";

function estadoRank(estado) {
  if (estado === "Pendiente") return 0;
  if (estado === "Jugando") return 1;
  if (estado === "Completado") return 2;
  return 3;
}

/**
 * Grid or list view of the collection with sorting, view mode, and stats.
 */
export default function GameList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [recoGame, setRecoGame] = useState(null);
  /** Filter for this screen only; the top bar is global search (Enter). */
  const [collectionFilter, setCollectionFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

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
    const q = collectionFilter.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        (g.titulo || "").toLowerCase().includes(q) ||
        (g.plataforma || "").toLowerCase().includes(q),
    );
  }, [games, collectionFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "titulo":
        list.sort((a, b) =>
          (a.titulo || "").localeCompare(b.titulo || "", "en", {
            sensitivity: "base",
          }),
        );
        break;
      case "estado":
        list.sort(
          (a, b) =>
            estadoRank(a.estado) - estadoRank(b.estado) ||
            (a.titulo || "").localeCompare(b.titulo || "", "en"),
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
    setLoadError(false);
    setLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/api/games`);
      if (response.ok) {
        setGames(await response.json());
      } else {
        setLoadError(true);
      }
    } catch (error) {
      console.error("Error loading games:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const requestDeleteGame = (id, titulo) => {
    setDeleteError("");
    setDeleteTarget({
      id,
      title: "Delete game",
      message: `Are you sure you want to delete "${titulo}"?`,
    });
  };

  const confirmDeleteGame = async () => {
    if (!deleteTarget?.id) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const response = await apiFetch(
        `${API_BASE}/api/games/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setDeleteTarget(null);
        fetchGames();
      } else {
        const data = await response.json().catch(() => ({}));
        setDeleteError(data.error || "Could not delete the game.");
      }
    } catch {
      setDeleteError("Could not delete the game.");
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading collection"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorRetryPanel
        title="We couldn't load your collection."
        hint="Check that the server is running (port 3000) or that your connection is stable."
        onRetry={() => void fetchGames()}
      />
    );
  }

  if (games.length === 0) {
    return <EmptyCollection />;
  }

  if (filtered.length === 0) {
    return (
      <div className="figma-panel px-6 py-14 text-center text-slate-400">
        <p className="font-medium text-slate-200">
          No games match your search.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Adjust the filter below (title or platform) or clear it to see your full collection.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.title}
        message={deleteTarget?.message}
        confirmLabel="Delete"
        busy={deleteBusy}
        onConfirm={() => void confirmDeleteGame()}
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
      />
      {deleteError && (
        <div
          className="mb-4 rounded-lg border border-red-500/35 bg-red-950/35 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {deleteError}
        </div>
      )}
      <RecommendGameModal
        open={Boolean(recoGame)}
        onClose={() => setRecoGame(null)}
        preselectedGame={recoGame}
        fixedRecipientId={null}
        onSent={() => fetchGames()}
      />
      <CollectionStats games={games} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="collection-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="collection-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="figma-select"
            >
              <option value="reciente">Newest first</option>
              <option value="titulo">Title (A–Z)</option>
              <option value="estado">Status (backlog → completed)</option>
              <option value="nota">Rating (highest first)</option>
            </select>
          </div>
          <div className="min-w-0 w-full sm:w-auto sm:max-w-[240px]">
            <label htmlFor="collection-filter" className="sr-only">
              Filter my collection by title or platform
            </label>
            <input
              id="collection-filter"
              type="search"
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              placeholder="Filter my collection…"
              autoComplete="off"
              className="figma-input w-full py-2.5 text-sm"
            />
          </div>
        </div>
        <div
          className="inline-flex rounded-xl bg-slate-900/80 p-1 ring-1 ring-white/10"
          role="group"
          aria-label="Collection view"
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
            Grid
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
            List
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
              onDelete={requestDeleteGame}
              onRecommend={setRecoGame}
              discussionTo={`/game/${game.id}/discussion`}
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
                onDelete={requestDeleteGame}
                onRecommend={setRecoGame}
                discussionTo={`/game/${game.id}/discussion`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

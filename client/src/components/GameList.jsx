import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import { useSearch } from "../SearchContext";
import GameCard from "./GameCard";
import { GameCardSkeleton } from "./Skeletons";

/**
 * Grid de la colección personal del usuario.
 * Obtiene los juegos de la API al montarse y filtra localmente según
 * la búsqueda global del SearchContext (sin peticiones extra al servidor).
 * Muestra skeletons durante la carga para evitar saltos de layout.
 *
 * @component
 */
export default function GameList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { query } = useSearch();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        (g.titulo || "").toLowerCase().includes(q) ||
        (g.plataforma || "").toLowerCase().includes(q),
    );
  }, [games, query]);

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
    return (
      <div className="figma-panel border-dashed border-slate-600/80 px-6 py-16 text-center">
        <p className="mb-2 text-xl font-semibold tracking-tight text-white">
          Aún no hay juegos en tu colección.
        </p>
        <p className="mb-8 text-sm text-slate-500">
          Añade tu primer título con el botón de arriba.
        </p>
        <Link to="/game/new" className="figma-btn-primary">
          + Añadir juego
        </Link>
      </div>
    );
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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {filtered.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          showActions
          onDelete={eliminarJuego}
          discussionTo={`/juego/${game.id}/discussion`}
        />
      ))}
    </div>
  );
}

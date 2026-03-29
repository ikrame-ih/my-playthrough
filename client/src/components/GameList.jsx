import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function GameList() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Sacamos la función de carga fuera del useEffect para poder
  // llamarla de nuevo cada vez que borremos un juego.
  const fetchGames = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/games");
      if (response.ok) {
        const data = await response.json();
        setGames(data);
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

  // Función para borrar un juego por su ID
  const eliminarJuego = async (id, titulo) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${titulo}"?`)) {
      try {
        const response = await fetch(`http://localhost:3000/api/games/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Si el servidor confirma el borrado, refrescamos la lista
          fetchGames();
        }
      } catch (error) {
        alert("No se pudo eliminar el juego.");
      }
    }
  };

  if (loading)
    return (
      <div className="text-center text-teal-400 mt-10 text-xl animate-pulse">
        Cargando tu colección...
      </div>
    );

  if (games.length === 0)
    return (
      <div className="text-center text-slate-400 mt-10 p-8 border-2 border-dashed border-slate-700 rounded-lg">
        <p className="text-xl mb-4">Aún no hay juegos en tu colección.</p>
        <p>Ve a la pestaña "Añadir Juego" para empezar.</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <div
          key={game.id}
          className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg hover:border-teal-400/50 transition-all duration-300 relative group"
        >
          <Link
            to={`/edit/${game.id}`}
            className="absolute top-3 right-10 text-slate-500 hover:text-teal-400 transition-colors"
            title="Editar juego"
          >
            ✎
          </Link>
          {/* Botón para eliminar (esquina superior derecha) */}
          <button
            onClick={() => eliminarJuego(game.id, game.titulo)}
            className="absolute top-3 right-3 text-slate-500 hover:text-red-500 transition-colors font-bold"
            title="Borrar juego"
          >
            ✕
          </button>

          <h3 className="text-xl font-bold text-teal-300 mb-3 truncate pr-6">
            {game.titulo}
          </h3>

          <div className="flex justify-between items-center text-sm mb-4">
            <span className="bg-slate-700 text-slate-200 px-3 py-1 rounded-full">
              {game.plataforma}
            </span>
            <span className="font-semibold text-teal-100 bg-teal-600/30 px-3 py-1 rounded-full border border-teal-500/30">
              {game.estado}
            </span>
          </div>

          <div className="flex justify-between text-slate-400 text-sm pt-4 border-t border-slate-700/50">
            <span className="flex items-center gap-1">
              ⏱️ {game.horas_jugadas} hrs
            </span>
            <span className="flex items-center gap-1">
              ⭐ {game.puntuacion}/10
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import GameCard from "./GameCard";
import { GameCardSkeleton, ProfileHeaderSkeleton } from "./Skeletons";
import UserAvatar from "./UserAvatar";

/**
 * Perfil público de otro usuario: muestra su colección en modo solo lectura.
 * Los botones de editar y borrar están deshabilitados (`showActions={false}`)
 * para que el visitante solo pueda ver y acceder a la discusión de cada juego.
 * También usa la variable `cancelled` para no actualizar el estado si el usuario
 * navega a otra página mientras la petición sigue en curso.
 *
 * @component
 */
export default function UserPublicProfile() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await apiFetch(`${API_BASE}/api/users/${userId}/games`);

        if (res.status === 404) {
          if (!cancelled) setData({ notFound: true });
          return;
        }

        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json);
        } else if (!cancelled) {
          setData(null);
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
  }, [userId]);

  if (loading) {
    // Skeleton mientras carga
    return (
      <div aria-busy="true" aria-label="Cargando perfil">
        <ProfileHeaderSkeleton />
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (data?.notFound) {
    return (
      <div className="figma-panel mx-auto mt-6 max-w-md px-6 py-12 text-center">
        <p className="text-slate-300">Usuario no encontrado.</p>
        <Link
          to="/community"
          className="figma-btn-primary mt-6 inline-flex"
        >
          Volver a comunidad
        </Link>
      </div>
    );
  }

  if (!loading && !data) {
    return (
      <div className="figma-panel mx-auto mt-6 max-w-md px-6 py-10 text-center text-red-300">
        No se pudo cargar el perfil.
      </div>
    );
  }

  const { user, games } = data;

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          <UserAvatar
            avatarId={user.avatar_id}
            size="xl"
            title={`Avatar de ${user.nombre_usuario}`}
            className="sm:mt-1"
          />
          <div className="min-w-0">
            <div className="mb-2 h-1 w-14 rounded-full bg-gradient-to-r from-brand-accent to-brand-accent/40" />
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[2.25rem]">
              Colección de {user.nombre_usuario}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              Vista solo lectura (no puedes editar ni borrar juegos ajenos).
            </p>
          </div>
        </div>
        <Link
          to="/community"
          className="text-sm font-medium text-brand-accent transition hover:text-teal-300"
        >
          ← Comunidad
        </Link>
      </div>

      {games.length === 0 ? (
        <p className="figma-panel border-dashed border-slate-600/80 px-6 py-14 text-center text-sm text-slate-400">
          Este usuario aún no tiene juegos en su colección.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              showActions={false}
              discussionTo={`/juego/${game.id}/discussion`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import GameCard from "./GameCard";
import { GameCardSkeleton, ProfileHeaderSkeleton } from "./Skeletons";
import UserAvatar from "./UserAvatar";
import RecommendGameModal from "./RecommendGameModal";

function getStoredUserId() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}")?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Perfil público de otro usuario: colección en solo lectura, seguir y recomendar.
 */
export default function UserPublicProfile() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [recoOpen, setRecoOpen] = useState(false);
  /** Ajuste local tras Seguir / Dejar de seguir para no esperar otro GET. */
  const [followDelta, setFollowDelta] = useState(0);

  const profileId = parseInt(userId, 10);
  const myId = getStoredUserId();
  const isSelf = Number.isFinite(profileId) && profileId === myId;

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

  useEffect(() => {
    setFollowDelta(0);
  }, [userId]);

  useEffect(() => {
    if (!Number.isFinite(profileId) || isSelf) return;
    let cancelled = false;
    async function loadFollow() {
      try {
        const res = await apiFetch(
          `${API_BASE}/api/social/follow-status/${profileId}`,
        );
        if (res.ok && !cancelled) {
          const j = await res.json();
          setFollowing(Boolean(j.following));
        }
      } catch {
        /* ignorar */
      }
    }
    loadFollow();
    return () => {
      cancelled = true;
    };
  }, [profileId, isSelf]);

  const toggleFollow = async () => {
    if (followLoading || isSelf) return;
    setFollowLoading(true);
    try {
      if (following) {
        const res = await apiFetch(
          `${API_BASE}/api/social/follow/${profileId}`,
          { method: "DELETE" },
        );
        if (res.ok) setFollowing(false);
      } else {
        const res = await apiFetch(
          `${API_BASE}/api/social/follow/${profileId}`,
          { method: "POST" },
        );
        if (res.ok || res.status === 201) setFollowing(true);
      }
    } catch {
      /* ignorar */
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
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
  const followers = Math.max(0, (user.num_seguidores ?? 0) + followDelta);

  return (
    <div>
      <RecommendGameModal
        open={recoOpen}
        onClose={() => setRecoOpen(false)}
        preselectedGame={null}
        fixedRecipientId={user.id}
        fixedRecipientName={user.nombre_usuario}
      />

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
            <p className="mt-2 text-sm text-slate-500">
              {followers}{" "}
              {followers === 1 ? "seguidor" : "seguidores"}
              {" · "}
              {games.length}{" "}
              {games.length === 1 ? "juego" : "juegos"}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              Vista solo lectura (no puedes editar ni borrar juegos ajenos).
            </p>
            {!isSelf && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={followLoading}
                  onClick={toggleFollow}
                  className="figma-btn-primary !w-auto px-4 py-2 text-sm disabled:opacity-60"
                >
                  {following ? "Dejar de seguir" : "Seguir"}
                </button>
                <button
                  type="button"
                  onClick={() => setRecoOpen(true)}
                  className="figma-btn-outline !w-auto border-brand-accent/25 px-4 py-2 text-sm text-brand-accent hover:bg-brand-accent/10"
                >
                  Recomendar un juego
                </button>
              </div>
            )}
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

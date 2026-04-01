import { useEffect, useMemo, useState } from "react";
import { API_BASE, authHeaders } from "../api";
import { IconShield, IconTrash, IconUsers } from "./icons";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [gameSearch, setGameSearch] = useState("");

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: authHeaders(),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
        return;
      }

      if (res.status === 403) {
        setForbidden(true);
        setUsers([]);
        return;
      }

      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadGames = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/games`, {
        headers: authHeaders(),
      });
      if (res.status === 403 || res.status === 401) return;
      if (res.ok) {
        setGames(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadUsers();
      await loadGames();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.nombre_usuario || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  const filteredGames = useMemo(() => {
    const q = gameSearch.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        (g.titulo || "").toLowerCase().includes(q) ||
        (g.nombre_usuario || "").toLowerCase().includes(q) ||
        String(g.usuario_id || "").includes(q) ||
        (g.email || "").toLowerCase().includes(q),
    );
  }, [games, gameSearch]);

  const eliminarUsuario = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Eliminar la cuenta de "${nombre}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "No se pudo eliminar.");
        return;
      }

      loadUsers();
      loadGames();
    } catch (e) {
      alert("Error de conexión.");
    }
  };

  const eliminarJuego = async (id, titulo) => {
    if (
      !window.confirm(
        `¿Eliminar la ficha "${titulo}" (ID ${id}) de la base de datos?`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/games/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "No se pudo eliminar.");
        return;
      }
      loadGames();
    } catch {
      alert("Error de conexión.");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="figma-panel py-16 text-center text-lg font-medium text-brand-accent animate-pulse">
        Cargando administración...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="figma-panel px-6 py-10 text-sm text-slate-400">
        Esta sección solo la ven cuentas con rol administrador.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 h-1 w-14 rounded-full bg-gradient-to-r from-brand-accent to-brand-accent/40" />
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400 ring-1 ring-red-500/25">
            <IconShield className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Administración
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Gestión de usuarios y moderación de fichas de juego.
            </p>
          </div>
        </div>
      </div>

      <div className="figma-panel mb-10 p-5 sm:p-6">
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Buscar por nombre o email
          </label>
          <input
            type="search"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="figma-input max-w-md"
          />
        </div>
        <div className="figma-table-wrap -mx-5 border-x-0 border-b-0 border-t border-white/[0.06] sm:-mx-6">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-slate-900/40 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">ID / usuario</th>
                <th className="p-4">Email</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Fecha de alta</th>
                <th className="w-28 p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-white/[0.04] transition hover:bg-slate-900/35"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs ${
                          u.rol === "admin"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-brand-accent/15 text-brand-accent"
                        }`}
                      >
                        {u.rol === "admin" ? (
                          <IconShield className="h-4 w-4" />
                        ) : (
                          <IconUsers className="h-4 w-4" />
                        )}
                      </span>
                      <div>
                        <p className="font-semibold text-white">
                          {u.nombre_usuario}
                        </p>
                        <p className="text-xs text-slate-500">ID: {u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400">{u.email}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${u.rol === "admin" ? "bg-red-500/15 text-red-300" : "bg-brand-accent/10 text-brand-accent"}`}
                    >
                      {u.rol === "admin" ? "ADMIN" : "USER"}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">
                    {formatDate(u.fecha_registro)}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => eliminarUsuario(u.id, u.nombre_usuario)}
                      className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Eliminar cuenta"
                    >
                      <IconTrash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/20">
          <IconUsers className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-white">Todos los juegos</h2>
          <p className="text-sm text-slate-500">
            Borra fichas de cualquier usuario (moderación).
          </p>
        </div>
      </div>

      <div className="figma-panel p-5 sm:p-6">
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Buscar juego o propietario
          </label>
          <input
            type="search"
            value={gameSearch}
            onChange={(e) => setGameSearch(e.target.value)}
            placeholder="Título, usuario, ID…"
            className="figma-input max-w-md"
          />
        </div>
        <div className="figma-table-wrap -mx-5 border-x-0 border-b-0 border-t border-white/[0.06] sm:-mx-6">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-slate-900/40 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Juego</th>
                <th className="p-4">Usuario</th>
                <th className="p-4">Plataforma</th>
                <th className="p-4">Estado</th>
                <th className="w-24 p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((g) => (
                <tr
                  key={g.id}
                  className="border-t border-white/[0.04] transition hover:bg-slate-900/35"
                >
                  <td className="p-4 font-mono text-slate-500">{g.id}</td>
                  <td className="p-4 font-medium text-white">{g.titulo}</td>
                  <td className="p-4">
                    <p className="text-slate-200">{g.nombre_usuario}</p>
                    <p className="text-xs text-slate-500">
                      ID {g.usuario_id} · {g.email}
                    </p>
                  </td>
                  <td className="p-4 text-slate-400">{g.plataforma || "—"}</td>
                  <td className="p-4 text-slate-400">{g.estado || "—"}</td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => eliminarJuego(g.id, g.titulo)}
                      className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Eliminar ficha"
                    >
                      <IconTrash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredGames.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No hay juegos que coincidan.
          </p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import { IconShield, IconTrash, IconUsers } from "./icons";
import UserAvatar from "./UserAvatar";

/**
 * Panel de administración (solo rol `admin` en base de datos).
 *
 * Aquí se concentran acciones de moderación que afectan a cualquier usuario:
 * borrar cuentas (y en cascada sus juegos y comentarios), borrar fichas de juego
 * ajenas y revisar o eliminar publicaciones LFG (buscar grupo). Los comentarios
 * concretos se moderan en la vista de discusión de cada juego (la API permite
 * borrar si eres admin, autor o dueño de la ficha).
 *
 * Los listados se filtran en el cliente con `useMemo` para no recargar la API en cada tecla.
 *
 * @component
 */
export default function AdminUsers() {
  // --- Estado: datos de API y búsquedas locales (sin petición por tecla) ---
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [gameSearch, setGameSearch] = useState("");
  const [lfgPosts, setLfgPosts] = useState([]);
  const [lfgSearch, setLfgSearch] = useState("");
  /** Modal grave: borrar cuenta de usuario (no usar window.confirm). */
  const [userDeleteModal, setUserDeleteModal] = useState(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteModalError, setDeleteModalError] = useState("");
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // --- Carga inicial: usuarios, juegos y LFG (solo admin pasa del 403) ---
  const loadUsers = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/users`);

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
      const res = await apiFetch(`${API_BASE}/api/admin/games`);
      if (res.status === 403) return;
      if (res.ok) {
        setGames(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadLfg = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/lfg`);
      if (res.status === 403) return;
      if (res.ok) {
        setLfgPosts(await res.json());
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
      await loadLfg();
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

  const filteredLfg = useMemo(() => {
    const q = lfgSearch.trim().toLowerCase();
    if (!q) return lfgPosts;
    return lfgPosts.filter(
      (row) =>
        (row.mensaje || "").toLowerCase().includes(q) ||
        (row.nombre_usuario || "").toLowerCase().includes(q) ||
        (row.juego_titulo || "").toLowerCase().includes(q) ||
        String(row.id || "").includes(q),
    );
  }, [lfgPosts, lfgSearch]);

  const openDeleteUserConfirm = (u) => {
    setDeleteConfirmInput("");
    setDeleteModalError("");
    setUserDeleteModal({
      id: u.id,
      nombre_usuario: u.nombre_usuario,
      email: u.email,
      rol: u.rol,
    });
  };

  const closeDeleteUserModal = (force = false) => {
    if (deleteInProgress && !force) return;
    setUserDeleteModal(null);
    setDeleteConfirmInput("");
    setDeleteModalError("");
  };

  const ejecutarEliminarUsuario = async () => {
    const target = userDeleteModal;
    if (!target) return;
    if (deleteConfirmInput.trim() !== String(target.nombre_usuario).trim()) {
      setDeleteModalError(
        "Type the public display name exactly as shown above.",
      );
      return;
    }
    setDeleteInProgress(true);
    setDeleteModalError("");
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/users/${target.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteModalError(data.error || "Could not delete the account.");
        return;
      }
      closeDeleteUserModal(true);
      loadUsers();
      loadGames();
      loadLfg();
    } catch {
      setDeleteModalError("Connection error.");
    } finally {
      setDeleteInProgress(false);
    }
  };

  // --- Acciones destructivas: DELETE y recarga del bloque afectado ---
  const eliminarJuego = async (id, titulo) => {
    if (
      !window.confirm(
        `Delete entry "${titulo}" (ID ${id}) from the database?`,
      )
    ) {
      return;
    }
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/games/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not delete.");
        return;
      }
      loadGames();
      loadLfg();
    } catch {
      alert("Connection error.");
    }
  };

  const eliminarLfg = async (id) => {
    if (!window.confirm("Delete this LFG post?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/social/lfg/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not delete.");
        return;
      }
      loadLfg();
    } catch {
      alert("Connection error.");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // --- Vista: estados de carga / sin permiso / panel con tres bloques (usuarios, juegos, LFG) ---
  if (loading) {
    return (
      <div className="figma-panel py-16 text-center text-lg font-medium text-brand-accent animate-pulse">
        Loading admin panel...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="figma-panel px-6 py-10 text-sm text-slate-400">
        This section is only visible to administrator accounts.
      </div>
    );
  }

  return (
    <div>
      {userDeleteModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-delete-user-title"
          aria-describedby="admin-delete-user-desc"
          onClick={closeDeleteUserModal}
        >
          <div
            className="figma-panel max-h-[90vh] w-full max-w-lg overflow-y-auto border border-red-500/25 p-6 shadow-2xl shadow-red-950/40 ring-1 ring-red-500/15"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="admin-delete-user-title"
              className="text-xl font-bold tracking-tight text-red-100"
            >
              Permanently delete account
            </h2>
            <p
              id="admin-delete-user-desc"
              className="mt-3 text-sm leading-relaxed text-slate-300"
            >
              You are about to delete a real user account from the database.
              This cannot be undone: they will no longer exist on the platform and{" "}
              <strong className="text-white">there is no undo</strong> from this
              app.
            </p>

            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-950/35 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-300/90">
                Affected account
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {userDeleteModal.nombre_usuario}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {userDeleteModal.email} · ID {userDeleteModal.id}
              </p>
              {userDeleteModal.rol === "admin" && (
                <p className="mt-3 text-sm font-medium text-amber-200/95">
                  This account has the{" "}
                  <span className="text-amber-100">administrator</span> role. They
                  will lose access to Administration.
                </p>
              )}
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-400">
              <p className="font-medium text-slate-300">
                The following will be deleted in cascade, among other data:
              </p>
              <ul className="list-inside list-disc space-y-1.5 pl-1 leading-relaxed marker:text-red-400/80">
                <li>Their entire game collection and reviews on other entries.</li>
                <li>Discussion comments and associated votes.</li>
                <li>Follows, recommendations, and LFG posts.</li>
              </ul>
            </div>

            <label
              htmlFor="admin-delete-user-confirm-name"
              className="mt-6 block text-sm font-medium text-slate-300"
            >
              To confirm, type the exact <strong className="text-white">public display name</strong>
              (copy and paste if needed):
            </label>
            <input
              id="admin-delete-user-confirm-name"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={deleteConfirmInput}
              onChange={(e) => {
                setDeleteConfirmInput(e.target.value);
                if (deleteModalError) setDeleteModalError("");
              }}
              className="figma-input mt-2 border-red-500/20 focus:border-red-400/50 focus:ring-red-500/25"
              placeholder={userDeleteModal.nombre_usuario}
              disabled={deleteInProgress}
            />

            {deleteModalError && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {deleteModalError}
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="figma-btn-outline w-full py-3 sm:!w-auto sm:px-5"
                onClick={closeDeleteUserModal}
                disabled={deleteInProgress}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-red-500/45 bg-red-950/60 px-5 py-3 text-sm font-bold text-red-100 shadow-lg shadow-black/25 transition hover:bg-red-900/55 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                disabled={
                  deleteInProgress ||
                  deleteConfirmInput.trim() !==
                    String(userDeleteModal.nombre_usuario).trim()
                }
                onClick={() => void ejecutarEliminarUsuario()}
              >
                {deleteInProgress
                  ? "Deleting…"
                  : "Yes, delete this account permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-2 h-1 w-14 rounded-full bg-gradient-to-r from-brand-accent to-brand-accent/40" />
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400 ring-1 ring-red-500/25">
            <IconShield className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Administration
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Users, game entries, and LFG posts.
            </p>
          </div>
        </div>
      </div>

      {/* Bloque 1: listado de cuentas (eliminar usuario) */}
      <div className="figma-panel mb-10 p-5 sm:p-6">
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Search by name or email
          </label>
          <input
            type="search"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search by name or email…"
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
                <th className="p-4">Joined</th>
                <th className="w-28 p-4 text-right">Actions</th>
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
                      <span className="relative shrink-0">
                        <UserAvatar
                          avatarId={u.avatar_id}
                          size="sm"
                          title={`Avatar de ${u.nombre_usuario}`}
                        />
                        {u.rol === "admin" && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500/90 text-white ring-2 ring-[#161D2F]">
                            <IconShield className="h-2.5 w-2.5" />
                          </span>
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
                      onClick={() => openDeleteUserConfirm(u)}
                      className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Delete account (requires confirmation)"
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

      {/* Bloque 2: todas las fichas de juego (eliminar ficha ajena) */}
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/20">
          <IconUsers className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-white">Todos los juegos</h2>
          <p className="text-sm text-slate-500">
            Delete any user's game entry (moderation).
          </p>
        </div>
      </div>

      <div className="figma-panel p-5 sm:p-6">
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Search game or owner
          </label>
          <input
            type="search"
            value={gameSearch}
            onChange={(e) => setGameSearch(e.target.value)}
            placeholder="Title, user, ID…"
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
                      title="Delete entry"
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

      {/* Bloque 3: publicaciones LFG (misma regla de borrado que en Comunidad vía API) */}
      <div className="mb-4 mt-12 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-[0.65rem] font-bold tracking-tight text-amber-400 ring-1 ring-amber-500/20">
          LFG
        </span>
        <div>
          <h2 className="text-xl font-bold text-white">Find group (LFG)</h2>
          <p className="text-sm text-slate-500">
            Community posts; deletion follows the same rules as in Community
            (admin or author).
          </p>
        </div>
      </div>

      <div className="figma-panel p-5 sm:p-6">
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Search LFG
          </label>
          <input
            type="search"
            value={lfgSearch}
            onChange={(e) => setLfgSearch(e.target.value)}
            placeholder="Mensaje, usuario, juego o ID…"
            className="figma-input max-w-md"
          />
        </div>
        <div className="figma-table-wrap -mx-5 border-x-0 border-b-0 border-t border-white/[0.06] sm:-mx-6">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-slate-900/40 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Usuario</th>
                <th className="p-4">Juego</th>
                <th className="p-4">Modo</th>
                <th className="p-4">Mensaje</th>
                <th className="w-24 p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredLfg.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-white/[0.04] transition hover:bg-slate-900/35"
                >
                  <td className="p-4 whitespace-nowrap text-slate-500">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="p-4">
                    <p className="text-slate-200">{row.nombre_usuario}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/juego/${row.juego_id}/discussion`}
                      className="font-medium text-brand-accent hover:text-teal-300"
                    >
                      {row.juego_titulo || `ID ${row.juego_id}`}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-400">{row.modo || "—"}</td>
                  <td className="max-w-[220px] p-4">
                    <p className="line-clamp-2 text-slate-300">{row.mensaje}</p>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => eliminarLfg(row.id)}
                      className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Delete post"
                    >
                      <IconTrash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLfg.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No matching LFG posts.
          </p>
        )}
      </div>
    </div>
  );
}

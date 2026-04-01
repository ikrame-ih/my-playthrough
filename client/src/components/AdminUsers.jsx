import { useEffect, useMemo, useState } from "react";
import { API_BASE, authHeaders } from "../api";
import { useSearch } from "../SearchContext";
import { IconShield, IconTrash, IconUsers } from "./icons";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const { query } = useSearch();

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.nombre_usuario || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q),
    );
  }, [users, query]);

  const eliminar = async (id, nombre) => {
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
    } catch (e) {
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
        Cargando usuarios...
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
              Gestión de usuarios de la plataforma.
            </p>
          </div>
        </div>
      </div>

      <div className="figma-table-wrap">
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
            {filtered.map((u) => (
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
                    onClick={() => eliminar(u.id, u.nombre_usuario)}
                    className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                    title="Eliminar"
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
  );
}

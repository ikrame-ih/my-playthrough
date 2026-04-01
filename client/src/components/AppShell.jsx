import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSearch } from "../SearchContext";
import {
  IconCollection,
  IconController,
  IconLogout,
  IconSearch,
  IconShield,
  IconUsers,
} from "./icons";

const sideNav = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? "bg-white/[0.08] text-brand-accent shadow-inner shadow-black/20"
      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
  }`;

export default function AppShell({ user, onLogout, children }) {
  const initial =
    user?.nombre_usuario?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "?";

  const { query, setQuery } = useSearch();
  const location = useLocation();

  useEffect(() => {
    setQuery("");
  }, [location.pathname, setQuery]);

  return (
    <div className="flex min-h-screen bg-brand-bg font-sans">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-white/[0.06] bg-[#0a0f1a]">
        <div className="flex items-center gap-2.5 px-6 pb-2 pt-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-brand-accent ring-1 ring-white/[0.08]">
            <IconController className="h-5 w-5" />
          </span>
          <Link to="/" className="text-[1.05rem] font-bold tracking-tight text-white">
            My<span className="text-brand-accent">Play</span>through
          </Link>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1 px-3" aria-label="Principal">
          <NavLink to="/" end className={sideNav}>
            <IconCollection className="h-5 w-5 shrink-0 opacity-90" />
            Mi colección
          </NavLink>
          <NavLink to="/community" className={sideNav}>
            <IconUsers className="h-5 w-5 shrink-0 opacity-90" />
            Comunidad
          </NavLink>
          {user?.rol === "admin" && (
            <NavLink to="/admin" className={sideNav}>
              <IconShield className="h-5 w-5 shrink-0 opacity-90" />
              Administración
            </NavLink>
          )}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
          >
            <IconLogout className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col pl-[260px]">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/[0.06] bg-brand-bg/90 px-6 py-4 backdrop-blur-lg">
          <div className="relative mx-auto w-full max-w-xl flex-1">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar juegos, usuarios..."
              className="figma-input rounded-full py-2.5 pl-10 pr-4 text-sm"
              aria-label="Buscar en la aplicación"
            />
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-accent/50 bg-gradient-to-br from-slate-800 to-slate-900 text-sm font-bold text-white shadow-inner"
            title={user?.nombre_usuario || user?.email}
          >
            {initial}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

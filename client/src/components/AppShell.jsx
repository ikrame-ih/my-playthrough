import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSearch } from "../SearchContext";
import {
  IconCollection,
  IconController,
  IconLogout,
  IconMenu,
  IconSearch,
  IconShield,
  IconUser,
  IconUsers,
} from "./icons";
import UserAvatar from "./UserAvatar";

/**
 * Función de clases para los enlaces de navegación del sidebar.
 * React Router DOM llama a esta función con `{ isActive }` y aplica
 * estilos distintos al enlace de la página activa.
 * @param {{ isActive: boolean }} params
 * @returns {string} Clases de Tailwind CSS para el enlace.
 */
const sideNav = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
    isActive
      ? "bg-gradient-to-r from-brand-accent/[0.14] via-brand-accent/[0.06] to-transparent text-brand-accent shadow-[inset_0_0_24px_-14px_rgba(45,212,191,0.35)] ring-1 ring-brand-accent/25"
      : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 hover:ring-1 hover:ring-white/[0.08]"
  }`;

/**
 * Estructura visual principal de la aplicación una vez el usuario está logueado.
 * Contiene el menú lateral y la barra de búsqueda superior.
 * Cada vez que el usuario navega a otra página se limpia la búsqueda
 * para que el filtro anterior no interfiera con la nueva vista.
 *
 * @component
 * @param {object}          props
 * @param {object}          props.user      - Datos del usuario logueado (`id`, `nombre_usuario`, `email`, `rol`, `avatar_id`).
 * @param {Function}        props.onLogout  - Función que se llama al pulsar "Cerrar sesión".
 * @param {React.ReactNode} props.children  - Contenido de la página activa, que se renderiza en el centro.
 */
export default function AppShell({ user, onLogout, children }) {
  const name = user?.nombre_usuario?.trim() || user?.email || "?";

  const { query, setQuery } = useSearch();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setQuery("");
  }, [location.pathname, setQuery]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);

  return (
    <div className="flex min-h-screen bg-brand-bg font-sans">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-[120%] rounded-xl bg-brand-tealBtn px-4 py-2.5 text-sm font-bold text-black opacity-0 shadow-lg transition focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-accent/60"
      >
        Saltar al contenido
      </a>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden ${
          navOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label="Cerrar menú"
        onClick={closeNav}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-brand-accent/[0.12] bg-gradient-to-b from-[#0c131f] via-[#0a0f1a] to-[#070b12] transition-transform duration-200 ease-out md:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-6 pb-2 pt-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/90 text-brand-accent shadow-[0_0_20px_-6px_rgba(45,212,191,0.5)] ring-1 ring-brand-accent/25">
            <IconController className="h-5 w-5" />
          </span>
          <Link
            to="/"
            className="text-[1.05rem] font-bold tracking-tight text-white"
            onClick={closeNav}
          >
            My<span className="text-brand-accent">Play</span>through
          </Link>
        </div>

        <nav
          className="mt-8 flex flex-1 flex-col gap-1 px-3"
          aria-label="Principal"
        >
          <NavLink to="/" end className={sideNav} onClick={closeNav}>
            <IconCollection className="h-5 w-5 shrink-0 opacity-90" />
            Mi colección
          </NavLink>
          <NavLink to="/community" className={sideNav} onClick={closeNav}>
            <IconUsers className="h-5 w-5 shrink-0 opacity-90" />
            Comunidad
          </NavLink>
          {user?.rol === "admin" && (
            <NavLink to="/admin" className={sideNav} onClick={closeNav}>
              <IconShield className="h-5 w-5 shrink-0 opacity-90" />
              Administración
            </NavLink>
          )}
          <NavLink to="/settings" className={sideNav} onClick={closeNav}>
            <IconUser className="h-5 w-5 shrink-0 opacity-90" />
            Perfil
          </NavLink>
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <button
            type="button"
            onClick={() => {
              closeNav();
              onLogout();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
          >
            <IconLogout className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col pl-0 md:pl-[260px]">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/[0.08] bg-brand-bg/85 px-3 py-3 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.45),0_1px_0_0_rgba(45,212,191,0.1)] backdrop-blur-lg sm:gap-4 sm:px-6 sm:py-4">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/[0.06] hover:text-white md:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menú de navegación"
          >
            <IconMenu className="h-6 w-6" />
          </button>
          <div className="relative min-w-0 flex-1 sm:mx-auto sm:max-w-xl">
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-brand-accent/50" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar juegos, usuarios..."
              className="figma-input w-full rounded-full py-2.5 pl-10 pr-4 text-sm"
              aria-label="Buscar en la aplicación"
            />
          </div>
          <Link
            to="/settings"
            className="shrink-0 rounded-[10px] outline-none ring-brand-accent/0 transition hover:ring-2 hover:ring-brand-accent/40 focus-visible:ring-2 focus-visible:ring-brand-accent/60"
            title={user?.nombre_usuario || user?.email || "Perfil"}
            aria-label="Ir a perfil y avatar"
          >
            <UserAvatar
              avatarId={user?.avatar_id}
              size="md"
              title={`Avatar de ${name}`}
            />
          </Link>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none sm:px-8 sm:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

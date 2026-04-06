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

/**
 * Paleta de colores de fondo para los avatares de iniciales.
 * Se elige el color según el código del primer carácter del nombre de usuario,
 * así cada persona siempre tiene el mismo color de forma consistente.
 */
const AVATAR_PALETTE = [
  "from-violet-600 to-indigo-700",
  "from-rose-500   to-pink-700",
  "from-amber-500  to-orange-600",
  "from-emerald-500 to-teal-700",
  "from-sky-500    to-blue-700",
  "from-fuchsia-500 to-purple-700",
  "from-red-500    to-rose-700",
  "from-cyan-500   to-sky-700",
];

/**
 * Devuelve las clases de gradiente Tailwind asignadas al nombre de usuario.
 * El índice se calcula a partir del primer carácter para que sea estable.
 * @param {string} name - Nombre de usuario.
 * @returns {string} Clases de gradiente Tailwind.
 */
export function avatarGradient(name) {
  const code = (name || "?").trim().toUpperCase().charCodeAt(0) || 0;
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

/**
 * Función de clases para los enlaces de navegación del sidebar.
 * React Router DOM llama a esta función con `{ isActive }` y aplica
 * estilos distintos al enlace de la página activa.
 * @param {{ isActive: boolean }} params
 * @returns {string} Clases de Tailwind CSS para el enlace.
 */
const sideNav = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? "bg-white/[0.08] text-brand-accent shadow-inner shadow-black/20"
      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
  }`;

/**
 * Estructura visual principal de la aplicación una vez el usuario está logueado.
 * Contiene el menú lateral y la barra de búsqueda superior.
 * Cada vez que el usuario navega a otra página se limpia la búsqueda
 * para que el filtro anterior no interfiera con la nueva vista.
 *
 * @component
 * @param {object}          props
 * @param {object}          props.user      - Datos del usuario logueado (`id`, `nombre_usuario`, `email`, `rol`).
 * @param {Function}        props.onLogout  - Función que se llama al pulsar "Cerrar sesión".
 * @param {React.ReactNode} props.children  - Contenido de la página activa, que se renderiza en el centro.
 */
export default function AppShell({ user, onLogout, children }) {
  const name    = user?.nombre_usuario?.trim() || user?.email || "?";
  const initial = name.charAt(0).toUpperCase();
  const gradient = avatarGradient(name);

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
          <Link
            to="/"
            className="text-[1.05rem] font-bold tracking-tight text-white"
          >
            My<span className="text-brand-accent">Play</span>through
          </Link>
        </div>

        <nav
          className="mt-8 flex flex-1 flex-col gap-1 px-3"
          aria-label="Principal"
        >
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
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-md`}
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

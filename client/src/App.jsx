import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { API_BASE, authHeaders } from "./api";
import { SearchProvider } from "./SearchContext";
import AppShell from "./components/AppShell";
import AuthPage from "./components/AuthPage";
import GameForm from "./components/GameForm";
import GameList from "./components/GameList";
import Community from "./components/Community";
import UserPublicProfile from "./components/UserPublicProfile";
import AdminUsers from "./components/AdminUsers";
import GameDiscussion from "./components/GameDiscussion";
import SearchResultsPage from "./components/SearchResultsPage";
import ProfileSettings from "./components/ProfileSettings";
import RecommendationsPage from "./components/RecommendationsPage";

/**
 * @file Raíz de la aplicación React: decide si mostrar el login o la app con menú.
 * Si `localStorage` tiene `token`, se asume sesión iniciada y se renderiza el router
 * (rutas como `/`, `/community`, `/admin`, etc.) dentro de `AppShell` (barra lateral + cabecera).
 * `SearchProvider` comparte el texto de búsqueda entre cabecera y páginas que filtran listas.
 */

/**
 * Solo renderiza el panel de administración si el usuario tiene rol `admin`.
 * Evita que quien accede a `/admin` por URL, historial o sesión anterior (tras
 * cerrar sesión en esa ruta) vea siquiera la pantalla de “sin permiso”.
 */
function AdminRoute({ user }) {
  if (user?.rol !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <AdminUsers />;
}

/**
 * Página principal de la colección del usuario.
 * Muestra el encabezado con el botón "Añadir juego" y el grid de GameList.
 * Si se llega desde guardar un juego (`location.state.flashGameSaved`), muestra un
 * aviso visible arriba (la ficha de alta suele dejar el scroll abajo del formulario).
 *
 * @component
 */
function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collectionFlash, setCollectionFlash] = useState(null);
  const flashBannerRef = useRef(null);

  useEffect(() => {
    const raw = location.state?.flashGameSaved;
    const msg = typeof raw === "string" ? raw.trim() : "";
    if (!msg) return;
    setCollectionFlash(msg);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!collectionFlash) return;
    flashBannerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    const t = window.setTimeout(() => setCollectionFlash(null), 9000);
    return () => window.clearTimeout(t);
  }, [collectionFlash]);

  return (
    <>
      {collectionFlash && (
        <div
          ref={flashBannerRef}
          className="mb-8 flex scroll-mt-28 gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/45 px-4 py-3.5 text-sm text-emerald-100 shadow-[0_8px_28px_-12px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/15 sm:px-5 sm:text-[0.95rem]"
          role="status"
          aria-live="polite"
        >
          <p className="min-w-0 flex-1 leading-relaxed">{collectionFlash}</p>
          <button
            type="button"
            onClick={() => setCollectionFlash(null)}
            className="shrink-0 self-start rounded-lg px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-200/80 transition hover:bg-white/10 hover:text-emerald-50"
            aria-label="Cerrar aviso"
          >
            Cerrar
          </button>
        </div>
      )}
      <header className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Mi colección
          </h1>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-400">
            Gestiona tu biblioteca personal de videojuegos.
          </p>
        </div>
        <Link
          to="/game/new"
          className="figma-btn-primary shrink-0 self-start whitespace-nowrap"
        >
          + Añadir juego
        </Link>
      </header>
      <GameList />
    </>
  );
}

/**
 * Componente raíz de la aplicación. Gestiona el estado de autenticación global
 * y decide qué mostrar: la pantalla de login/registro o la app completa.
 *
 * Al cargar, comprueba si hay un token en localStorage y lo valida con `/api/auth/me`
 * para obtener los datos frescos del usuario (incluyendo el rol actualizado).
 * Si el token no es válido o no existe, se muestra AuthPage.
 *
 * @component
 */
function safeReadStoredUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    if (u && typeof u === "object" && u.id != null) {
      return u;
    }
  } catch {
    /* JSON corrupto o truncado: evita que React falle y deje #root en blanco */
  }
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  return null;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const saved = safeReadStoredUser();

    // Carga inmediata desde localStorage para evitar parpadeo
    if (token && saved) {
      setUser(saved);
    } else if (token && !saved) {
      localStorage.removeItem("token");
    }

    if (!token) return;

    // Verificación en servidor para obtener el rol actualizado
    fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      })
      .catch(() => {});
  }, []);

  /**
   * Cierra la sesión del usuario limpiando el token y el objeto usuario
   * del localStorage y reseteando el estado local.
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <SearchProvider>
      {!user ? (
        <AuthPage onAuthSuccess={setUser} />
      ) : (
        <BrowserRouter>
          <AppShell user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/game/new" element={<GameForm />} />
              <Route path="/edit/:id" element={<GameForm />} />
              <Route path="/community" element={<Community />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route
                path="/recommendations"
                element={<RecommendationsPage />}
              />
              <Route path="/user/:userId" element={<UserPublicProfile />} />
              <Route
                path="/settings"
                element={
                  <ProfileSettings user={user} onUserUpdate={setUser} />
                }
              />
              <Route path="/admin" element={<AdminRoute user={user} />} />
              <Route
                path="/juego/:gameId/discussion"
                element={<GameDiscussion />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      )}
    </SearchProvider>
  );
}

export default App;

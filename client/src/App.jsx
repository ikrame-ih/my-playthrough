import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  useParams,
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

// Redirect /admin unless role is admin (avoids flashing the forbidden panel).
function AdminRoute({ user }) {
  if (user?.rol !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <AdminUsers />;
}

// Collection home — flash banner when returning from game save.
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
            aria-label="Dismiss notice"
          >
            Dismiss
          </button>
        </div>
      )}
      <header className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            My collection
          </h1>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-400">
            Manage your personal video game library.
          </p>
        </div>
        <Link
          to="/game/new"
          className="figma-btn-primary shrink-0 self-start whitespace-nowrap"
        >
          + Add game
        </Link>
      </header>
      <GameList />
    </>
  );
}

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

function JuegoDiscussionRedirect() {
  const { gameId } = useParams();
  return <Navigate to={`/game/${gameId}/discussion`} replace />;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const saved = safeReadStoredUser();

    // Hydrate from localStorage first to avoid login flash
    if (token && saved) {
      setUser(saved);
    } else if (token && !saved) {
      localStorage.removeItem("token");
    }

    if (!token) return;

    // Then refresh role/profile from server
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
                path="/game/:gameId/discussion"
                element={<GameDiscussion />}
              />
              <Route
                path="/juego/:gameId/discussion"
                element={<JuegoDiscussionRedirect />}
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

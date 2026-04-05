import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, Link } from "react-router-dom";
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

function HomePage() {
  return (
    <>
      <header className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
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

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    if (!token) return;

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

  if (!user) {
    return <AuthPage onAuthSuccess={setUser} />;
  }

  return (
    <SearchProvider>
      <BrowserRouter>
        <AppShell user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/new" element={<GameForm />} />
            <Route path="/edit/:id" element={<GameForm />} />
            <Route path="/community" element={<Community />} />
            <Route path="/user/:userId" element={<UserPublicProfile />} />
            <Route path="/admin" element={<AdminUsers />} />
            <Route
              path="/juego/:gameId/discussion"
              element={<GameDiscussion />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </SearchProvider>
  );
}

export default App;

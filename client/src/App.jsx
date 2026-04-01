import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import GameForm from "./components/GameForm";
import GameList from "./components/GameList";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
        {/* Navegación principal visible en toda la app */}
        <nav className="bg-slate-800 p-4 shadow-md flex justify-between items-center border-b border-teal-500">
          <h1 className="text-2xl font-bold text-white tracking-widest">
            MY<span className="text-teal-400">PLAYTHROUGH</span>
          </h1>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-teal-400 transition-colors">
              Mis juegos
            </Link>
            <Link
              to="/add"
              className="hover:text-teal-400 transition-colors font-bold"
            >
              Añadir juego
            </Link>
          </div>
        </nav>

        {/* Zona que cambia según la ruta */}
        <main className="p-8">
          <Routes>
            {/* Inicio: listado completo de la colección */}
            <Route
              path="/"
              element={
                <div>
                  <h2 className="text-3xl font-bold mb-8 text-white border-b border-slate-700 pb-4">
                    Mi colección
                  </h2>
                  <GameList />
                </div>
              }
            />

            {/* Añadir y editar comparten componente */}
            <Route path="/add" element={<GameForm />} />
            <Route path="/edit/:id" element={<GameForm />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

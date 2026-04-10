/**
 * Arranque del cliente (Vite + React 18).
 * Monta `<App />` en `#root` dentro de StrictMode para detectar efectos duplicados
 * en desarrollo. Los estilos globales van en `index.css` (Tailwind) y `motion.css`.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./motion.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
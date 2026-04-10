/**
 * @file Punto de entrada del backend MyPlaythrough (API REST con Express).
 *
 * Flujo general:
 * 1. Carga variables de entorno (`dotenv`) y crea la app Express.
 * 2. Aplica middleware global: CORS restringido al origen del front y límite de
 *    tamaño del JSON (50 kb) para reducir superficie de abuso.
 * 3. Monta un router por ámbito funcional bajo `/api/...` (auth, juegos, usuarios,
 *    comunidad, social, admin, carátulas). Las rutas de `covers` se registran
 *    también antes que el CRUD de juegos para que `/api/games/cover-search` no
 *    se interprete como `/api/games/:id`.
 * 4. Arranca el servidor HTTP en `PORT` (3000 por defecto).
 *
 * Cada carpeta `routes/*.routes.js` documenta sus endpoints; la lógica de negocio
 * pesada suele estar en `utils/` o en consultas SQL parametrizadas.
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const gamesRoutes = require("./routes/games.routes");
const usersRoutes = require("./routes/users.routes");
const communityRoutes = require("./routes/community.routes");
const socialRoutes = require("./routes/social.routes");
const adminRoutes = require("./routes/admin.routes");
const coversRoutes = require("./routes/covers.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares globales ---

// Solo el origen configurado (Vite en dev, dominio real en prod) puede llamar a la API.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);

// Evita payloads enormes en POST/PUT (protección básica frente a abuso).
app.use(express.json({ limit: "50kb" }));

// --- Ruta de diagnóstico (solo en desarrollo) ---

app.get("/api/test-db", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found." });
  }
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Montaje de routers ---

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/covers", coversRoutes);

// cover-search va ANTES que /api/games/:id para que Express
// no confunda "cover-search" con un ID numérico
app.use("/api/games", coversRoutes);
app.use("/api/games", gamesRoutes);

// --- Manejo global de errores ---

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err);
  const isDev = process.env.NODE_ENV !== "production";
  res.status(err.status || 500).json({
    error: isDev ? err.message : "Error interno del servidor.",
    ...(isDev && err.code ? { code: err.code } : {}),
  });
});

// --- Arranque ---

app.listen(PORT, () => {
  console.log(`Servidor MyPlaythrough escuchando en el puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);
});

// index.js — Aquí arranca todo el backend de MyPlaythrough

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

// Cada router tiene las rutas de un recurso (auth, games, users...)
const authRoutes      = require("./routes/auth.routes");
const gamesRoutes     = require("./routes/games.routes");
const usersRoutes     = require("./routes/users.routes");
const communityRoutes = require("./routes/community.routes");
const adminRoutes     = require("./routes/admin.routes");
const coversRoutes    = require("./routes/covers.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares globales ---

// CORS: solo acepta peticiones de nuestro frontend
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);

// Limitamos el body a 50kb por seguridad
app.use(express.json({ limit: "50kb" }));

// --- Ruta de diagnóstico (solo en desarrollo) ---

// Ruta rápida para comprobar que la conexión con PostgreSQL funciona
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

app.use("/api/auth",      authRoutes);
app.use("/api/users",     usersRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/covers",    coversRoutes);

// cover-search va ANTES que /api/games/:id para que Express
// no confunda "cover-search" con un ID numérico
app.use("/api/games",     coversRoutes);
app.use("/api/games",     gamesRoutes);

// --- Manejo global de errores ---

// En desarrollo muestra el error real; en producción solo un mensaje genérico
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

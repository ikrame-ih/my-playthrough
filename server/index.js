/**
 * @file Arranque del servidor Express: una sola app que escucha en un puerto y enruta
 * todo lo que empieza por `/api/` hacia ficheros en `routes/`.
 *
 * Orden práctico:
 * 1. `dotenv` lee `.env` (contraseña de BD, `JWT_SECRET`, `CORS_ORIGIN`, etc.).
 * 2. CORS limita qué web puede llamar a la API desde el navegador.
 * 3. express.json con tope de 50 kb evita cuerpos enormes.
 * 4. Los routers se montan por tema (`/api/auth`, `/api/games`, …). Ojo: las rutas de
 *    carátulas van antes que `/api/games/:id` para que `cover-search` no se confunda con un id numérico.
 * 5. `listen(PORT)` deja el proceso a la escucha (3000 por defecto).
 *
 * La descripción de cada endpoint está en el JSDoc de cada `*.routes.js`; las consultas SQL
 * van con parámetros (`$1`, `$2`) para no mezclar datos del usuario en el texto de la query.
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

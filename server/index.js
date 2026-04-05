/**
 * index.js — Punto de entrada del servidor
 *
 * Este fichero es el "núcleo" de la aplicación Express. Su única
 * responsabilidad es configurar los middlewares globales, montar las rutas
 * y arrancar el servidor. Toda la lógica de negocio está en sus propios módulos.
 *
 * Arquitectura de tres capas (Three-Tier Architecture):
 *   Capa de presentación  → cliente React (carpeta /client)
 *   Capa de lógica        → este servidor Express (carpeta /server)
 *   Capa de persistencia  → PostgreSQL (accedido a través de /config/db.js)
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config(); // carga las variables de .env antes de importar nada más

const pool = require("./config/db");

// Importamos cada router. Cada uno agrupa las rutas de un recurso concreto,
// siguiendo el principio de responsabilidad única (SRP).
const authRoutes      = require("./routes/auth.routes");
const gamesRoutes     = require("./routes/games.routes");
const usersRoutes     = require("./routes/users.routes");
const communityRoutes = require("./routes/community.routes");
const adminRoutes     = require("./routes/admin.routes");
const coversRoutes    = require("./routes/covers.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Middlewares globales
// ---------------------------------------------------------------------------

// CORS: solo aceptamos peticiones del origen de nuestro frontend.
// Esto evita que webs de terceros puedan llamar a nuestra API directamente.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  }),
);

// Limitamos el tamaño del body a 50kb para dificultar ataques de payload gigante.
// Express 5 lo acepta como opción directa de express.json().
app.use(express.json({ limit: "50kb" }));

// ---------------------------------------------------------------------------
// Ruta de diagnóstico (protegida, solo en entornos no productivos)
// ---------------------------------------------------------------------------

/**
 * GET /api/test-db
 * Comprueba que el servidor puede conectarse a PostgreSQL.
 * Solo funciona cuando NODE_ENV no es "production" para no exponer
 * información interna del servidor en un despliegue real.
 */
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

// ---------------------------------------------------------------------------
// Montaje de routers
// ---------------------------------------------------------------------------

// El prefijo que se pone aquí se añade a todas las rutas del router.
// Por ejemplo: authRoutes tiene POST /register → queda en POST /api/auth/register

app.use("/api/auth",      authRoutes);
app.use("/api/users",     usersRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/covers",    coversRoutes);

// Las rutas de búsqueda de carátulas deben registrarse ANTES que /api/games/:id
// para que Express no confunda "cover-search" con un ID numérico.
// Montamos el router de covers también en /api/games para que la ruta
// /api/games/cover-search funcione correctamente.
app.use("/api/games",     coversRoutes);
app.use("/api/games",     gamesRoutes);

// ---------------------------------------------------------------------------
// Middleware global de manejo de errores
// ---------------------------------------------------------------------------

/**
 * Este middleware de 4 parámetros (err, req, res, next) intercepta cualquier
 * error que se pase con next(err) o que Express lance internamente.
 * En desarrollo devuelve el mensaje técnico para facilitar la depuración.
 * En producción solo devuelve "Error interno del servidor" para no filtrar
 * detalles de la base de datos o la estructura interna al cliente.
 * Debe ir DESPUÉS de todas las rutas para actuar como red de seguridad final.
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err);
  const isDev = process.env.NODE_ENV !== "production";
  res.status(err.status || 500).json({
    error: isDev ? err.message : "Error interno del servidor.",
    ...(isDev && err.code ? { code: err.code } : {}),
  });
});

// ---------------------------------------------------------------------------
// Arranque del servidor
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Servidor MyPlaythrough escuchando en el puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);
});

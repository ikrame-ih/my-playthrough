// Express entry: mounts /api/* routers. Cover routes must register before /api/games/:id
// so "cover-search" is not parsed as a numeric id.

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

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin:
      corsOrigins.length <= 1
        ? corsOrigins[0] || "http://localhost:5173"
        : corsOrigins,
  }),
);

app.use(express.json({ limit: "50kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

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

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/covers", coversRoutes);
app.use("/api/games", coversRoutes);
app.use("/api/games", gamesRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err);
  const isDev = process.env.NODE_ENV !== "production";
  res.status(err.status || 500).json({
    error: isDev ? err.message : "Error interno del servidor.",
    ...(isDev && err.code ? { code: err.code } : {}),
  });
});

app.listen(PORT, () => {
  console.log(`Servidor MyPlaythrough escuchando en el puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);
});

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta de diagnóstico rápida para comprobar que PostgreSQL responde.
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Por ahora devuelve todos los juegos.
// Cuando añadamos auth con JWT, aquí filtraremos por usuario_id del token.
app.get("/api/games", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM JUEGOS ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear juego con una validación básica de duplicado por título.
app.post("/api/games", async (req, res) => {
  try {
    const { titulo, estado, plataforma, puntuacion, horas_jugadas } = req.body;

    // Nota de esta fase: usuario_id fijo (1) hasta cerrar autenticación.
    const checkJuego = await pool.query(
      "SELECT * FROM JUEGOS WHERE titulo = $1",
      [titulo],
    );

    if (checkJuego.rows.length > 0) {
      // Si existe, mandamos un error 400
      return res.status(400).json({
        success: false,
        error: "Este juego ya está en tu colección.",
      });
    }

    const nuevoJuego = await pool.query(
      "INSERT INTO JUEGOS (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [1, titulo, estado, plataforma, puntuacion, horas_jugadas],
    );

    res.status(201).json({ success: true, data: nuevoJuego.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error de servidor al guardar el juego" });
  }
});

// Eliminar juego por ID.
app.delete("/api/games/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM JUEGOS WHERE id = $1", [id]);
    res.json({ success: true, message: "Juego eliminado correctamente" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al intentar eliminar el juego" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Obtener un juego concreto para el formulario de edición.
app.get("/api/games/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM JUEGOS WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar juego por ID.
app.put("/api/games/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, estado, plataforma, puntuacion, horas_jugadas } = req.body;

    const result = await pool.query(
      "UPDATE JUEGOS SET titulo = $1, estado = $2, plataforma = $3, puntuacion = $4, horas_jugadas = $5 WHERE id = $6 RETURNING *",
      [titulo, estado, plataforma, puntuacion, horas_jugadas, id],
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al actualizar el juego" });
  }
});

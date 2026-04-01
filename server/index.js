const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

app.use(cors());
app.use(express.json());

// Misma dirección aunque haya espacios o mayúsculas (Gmail y el teclado suelen meter diferencias).
const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

// Middleware para rutas privadas. El cliente debe enviar el JWT así:
//   Authorization: Bearer <token>
// "Bearer" es solo la convención HTTP: indica que lo que sigue es un token de acceso.
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Token no proporcionado o formato inválido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // req.user no existe en Express por defecto; lo rellenamos nosotros aquí.
    // Así en cada ruta protegida puedo usar req.user.id para filtrar por dueño.
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

// En la BD el CHECK permite solo 'user' y 'admin' (no 'usuario' / 'administrador').
const adminMiddleware = (req, res, next) => {
  if (req.user.rol !== "admin") {
    return res
      .status(403)
      .json({ error: "Se requieren permisos de administrador." });
  }
  next();
};

// Firmo un JWT con lo mínimo que necesito después en las rutas (id, email, rol).
// Ese payload viaja dentro del token y se recupera arriba con jwt.verify.
const createToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, rol: user.rol || "user" },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

// Ruta de diagnóstico rápida para comprobar que PostgreSQL responde.
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Registro: valida datos básicos, hashea contraseña y devuelve token ya listo.
app.post("/api/auth/register", async (req, res) => {
  try {
    const nombre_usuario = String(req.body.nombre_usuario ?? "").trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!nombre_usuario || !email || !password) {
      return res.status(400).json({
        error: "Nombre de usuario, email y contraseña son obligatorios.",
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }

    const byEmail = await pool.query(
      "SELECT id FROM usuarios WHERE LOWER(TRIM(email)) = $1",
      [email],
    );
    if (byEmail.rows.length > 0) {
      return res.status(400).json({
        error:
          "Ese email ya está registrado. Usa «Inicia sesión» con esa cuenta.",
      });
    }

    const byName = await pool.query(
      "SELECT id FROM usuarios WHERE LOWER(TRIM(nombre_usuario)) = LOWER(TRIM($1))",
      [nombre_usuario],
    );
    if (byName.rows.length > 0) {
      return res.status(400).json({
        error:
          "Ese nombre de usuario ya está en uso (por otra cuenta). Prueba otro nombre; tu email aún puede ser nuevo.",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre_usuario, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre_usuario, email, rol",
      [nombre_usuario, email, password_hash, "user"],
    );

    const token = createToken(newUser.rows[0]);
    return res.status(201).json({ success: true, token, user: newUser.rows[0] });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    // Código PostgreSQL: violación de unicidad (email o nombre duplicado a nivel de índice)
    if (error.code === "23505") {
      return res.status(400).json({
        error:
          "Ese email o nombre de usuario ya existe en la base de datos. Prueba a iniciar sesión o usa otro nombre.",
        detail: error.detail,
      });
    }
    if (error.code === "23514") {
      return res.status(400).json({
        error: "Datos no válidos para el rol de usuario.",
        detail: error.message,
      });
    }
    return res.status(500).json({
      error: "Error al registrar usuario.",
      detail: error.message || String(error),
    });
  }
});

// Login: comprueba credenciales y devuelve token + datos públicos del usuario.
app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios." });
    }

    const result = await pool.query(
      "SELECT id, nombre_usuario, email, password_hash, rol FROM usuarios WHERE LOWER(TRIM(email)) = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error:
          "No existe ninguna cuenta con ese email. Regístrate primero o revisa el correo.",
      });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    const token = createToken(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Error al iniciar sesión." });
  }
});

// Lo uso para comprobar sesión activa (útil al recargar app).
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre_usuario, email, rol FROM usuarios WHERE id = $1",
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: "Error al validar sesión." });
  }
});

// Comunidad: listado de otros miembros (RF-04 / diseño API).
// No expongo email aquí; solo datos útiles para enlazar al perfil público.
app.get("/api/users", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre_usuario,
        (SELECT COUNT(*)::int FROM juegos j WHERE j.usuario_id = u.id) AS num_juegos,
        (SELECT j.plataforma FROM juegos j WHERE j.usuario_id = u.id ORDER BY j.id DESC LIMIT 1) AS plataforma_ejemplo
      FROM usuarios u WHERE u.id <> $1 ORDER BY u.nombre_usuario ASC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Perfil ajeno: colección en solo lectura (mismo shape que juegos, sin rutas de edición en el cliente).
app.get("/api/users/:userId/games", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuario inválido." });
    }

    const userExists = await pool.query(
      "SELECT id, nombre_usuario FROM usuarios WHERE id = $1",
      [userId],
    );
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const games = await pool.query(
      "SELECT * FROM juegos WHERE usuario_id = $1 ORDER BY id DESC",
      [userId],
    );
    res.json({ user: userExists.rows[0], games: games.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RF-05: nota media por título agregando votos de toda la comunidad.
app.get("/api/community/stats", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT titulo,
             ROUND(AVG(puntuacion)::numeric, 2) AS nota_media,
             COUNT(*)::int AS num_votos
      FROM juegos
      WHERE puntuacion IS NOT NULL
      GROUP BY titulo
      ORDER BY nota_media DESC NULLS LAST, titulo ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RF-06: panel admin — listar cuentas.
app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre_usuario, email, rol, fecha_registro FROM usuarios ORDER BY id ASC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RF-06: eliminar cuenta (moderación). No permito borrarme a mí mismo por accidente.
app.delete(
  "/api/admin/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);
      if (Number.isNaN(targetId)) {
        return res.status(400).json({ error: "ID inválido." });
      }
      if (targetId === req.user.id) {
        return res
          .status(400)
          .json({ error: "No puedes eliminar tu propia cuenta desde el panel." });
      }

      const deleted = await pool.query(
        "DELETE FROM usuarios WHERE id = $1 RETURNING id",
        [targetId],
      );
      if (deleted.rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado." });
      }
      res.json({ success: true, message: "Usuario eliminado." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Solo devuelve juegos del usuario logueado (evita mezclar colecciones).
app.get("/api/games", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM juegos WHERE usuario_id = $1 ORDER BY id DESC",
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Añadir juego con control de título duplicado por usuario.
app.post("/api/games", authMiddleware, async (req, res) => {
  try {
    const {
      titulo,
      estado,
      plataforma,
      puntuacion,
      horas_jugadas,
      url_imagen,
    } = req.body;

    const checkJuego = await pool.query(
      "SELECT id FROM juegos WHERE titulo = $1 AND usuario_id = $2",
      [titulo, req.user.id],
    );

    if (checkJuego.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Este juego ya está en tu colección.",
      });
    }

    const url =
      typeof url_imagen === "string" && url_imagen.trim() !== ""
        ? url_imagen.trim()
        : null;

    const nuevoJuego = await pool.query(
      "INSERT INTO juegos (usuario_id, titulo, estado, plataforma, puntuacion, horas_jugadas, url_imagen) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [req.user.id, titulo, estado, plataforma, puntuacion, horas_jugadas, url],
    );

    res.status(201).json({ success: true, data: nuevoJuego.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error de servidor al guardar el juego" });
  }
});

// Borrado seguro: solo puede borrar sus propios juegos.
app.delete("/api/games/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM juegos WHERE id = $1 AND usuario_id = $2 RETURNING id",
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }

    res.json({ success: true, message: "Juego eliminado correctamente" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al intentar eliminar el juego" });
  }
});

// Carga de detalle para edición (también filtrado por dueño).
app.get("/api/games/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM juegos WHERE id = $1 AND usuario_id = $2",
      [id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualización con control de duplicados y ownership.
app.put("/api/games/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      estado,
      plataforma,
      puntuacion,
      horas_jugadas,
      url_imagen,
    } = req.body;

    const duplicatedTitle = await pool.query(
      "SELECT id FROM juegos WHERE titulo = $1 AND usuario_id = $2 AND id <> $3",
      [titulo, req.user.id, id],
    );

    if (duplicatedTitle.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Ya tienes un juego con ese mismo título." });
    }

    const url =
      typeof url_imagen === "string" && url_imagen.trim() !== ""
        ? url_imagen.trim()
        : null;

    const result = await pool.query(
      "UPDATE juegos SET titulo = $1, estado = $2, plataforma = $3, puntuacion = $4, horas_jugadas = $5, url_imagen = $6 WHERE id = $7 AND usuario_id = $8 RETURNING *",
      [
        titulo,
        estado,
        plataforma,
        puntuacion,
        horas_jugadas,
        url,
        id,
        req.user.id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Juego no encontrado." });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al actualizar el juego" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

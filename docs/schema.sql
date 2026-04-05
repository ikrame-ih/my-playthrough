-- =============================================================================
-- MyPlaythrough – Esquema completo de la base de datos
-- =============================================================================
-- Este script crea todas las tablas desde cero en el orden correcto.
-- Es el fichero que Docker ejecuta automáticamente la primera vez que
-- levanta el contenedor de PostgreSQL (montado en /docker-entrypoint-initdb.d/).
-- Si la base de datos ya existe y tiene datos, este script NO se vuelve a ejecutar.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabla de usuarios
-- ---------------------------------------------------------------------------
-- Almacena las cuentas de usuario. El campo 'rol' decide si el usuario tiene
-- acceso al panel de administración ('admin') o solo a su colección ('user').
-- La constraintrol_check impide insertar roles no reconocidos.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre_usuario VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  rol            VARCHAR(50)  NOT NULL DEFAULT 'user'
                   CHECK (rol IN ('user', 'admin')),
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. Catálogo global de juegos
-- ---------------------------------------------------------------------------
-- Tabla de referencia compartida por todos los usuarios, al estilo de la
-- base de datos pública de RAWG o Steam. Cuando un usuario añade un juego
-- desde el buscador, se inserta (o reutiliza) una fila aquí y su ficha
-- personal apunta a ella mediante catalogo_id.
-- Así, título y carátula oficial son consistentes para todos los usuarios.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogo_juegos (
  id           SERIAL PRIMARY KEY,
  titulo       VARCHAR(512) NOT NULL,
  url_imagen   TEXT,
  rawg_id      INTEGER UNIQUE,
  steam_app_id BIGINT  UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. Colección personal de juegos
-- ---------------------------------------------------------------------------
-- Cada fila es "una ficha de juego para un usuario concreto".
-- - usuario_id → quién la posee (ON DELETE CASCADE: si se borra el usuario,
--   se borran sus fichas).
-- - catalogo_id → juego oficial del catálogo compartido (puede ser NULL
--   si el usuario añadió el juego manualmente sin buscarlo).
-- - El índice único idx_juegos_uq_usuario_catalogo evita que el mismo usuario
--   tenga dos fichas del mismo juego oficial.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS juegos (
  id            SERIAL PRIMARY KEY,
  usuario_id    INTEGER       REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo        VARCHAR(255)  NOT NULL,
  estado        VARCHAR(50)   NOT NULL,
  plataforma    VARCHAR(100),
  puntuacion    INTEGER,
  horas_jugadas INTEGER       DEFAULT 0,
  comentario    VARCHAR(1000),
  url_imagen    TEXT,
  catalogo_id   INTEGER       REFERENCES catalogo_juegos(id) ON DELETE SET NULL
);

-- Un usuario no puede tener dos fichas del mismo juego del catálogo oficial.
CREATE UNIQUE INDEX IF NOT EXISTS idx_juegos_uq_usuario_catalogo
  ON juegos (usuario_id, catalogo_id)
  WHERE catalogo_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Comentarios de juegos (hilos / reviews)
-- ---------------------------------------------------------------------------
-- Permite a los usuarios dejar reseñas y respuestas encadenadas (parent_id)
-- en la página pública de un juego. ON DELETE CASCADE garantiza que si se
-- borra la ficha o el usuario, los comentarios desaparecen también.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS juego_comentarios (
  id             SERIAL PRIMARY KEY,
  juego_id       INTEGER NOT NULL REFERENCES juegos(id)           ON DELETE CASCADE,
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id)         ON DELETE CASCADE,
  parent_id      INTEGER          REFERENCES juego_comentarios(id) ON DELETE CASCADE,
  cuerpo         TEXT    NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cuerpo_no_vacio CHECK (char_length(trim(cuerpo)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_juego_comentarios_juego
  ON juego_comentarios (juego_id);

CREATE INDEX IF NOT EXISTS idx_juego_comentarios_parent
  ON juego_comentarios (parent_id);

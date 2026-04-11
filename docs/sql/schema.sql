-- MyPlaythrough — Esquema completo de la BD
-- Docker lo ejecuta la primera vez que levanta el contenedor de PostgreSQL.

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre_usuario VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  rol            VARCHAR(50)  NOT NULL DEFAULT 'user'
                   CHECK (rol IN ('user', 'admin')),
  avatar_id              VARCHAR(32)  NOT NULL DEFAULT 'robot-0',
  fecha_registro         TIMESTAMP DEFAULT NOW(),
  notificaciones_sonido  BOOLEAN NOT NULL DEFAULT TRUE
);

-- Nombre público irrepetible (misma grafía en minúsculas / sin espacios extremos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_nombre_lower
  ON usuarios (LOWER(TRIM(nombre_usuario)));

-- Catálogo global (datos compartidos de RAWG/Steam para que todos usen el mismo título/imagen)
CREATE TABLE IF NOT EXISTS catalogo_juegos (
  id           SERIAL PRIMARY KEY,
  titulo       VARCHAR(512) NOT NULL,
  url_imagen   TEXT,
  rawg_id      INTEGER UNIQUE,
  steam_app_id BIGINT  UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Colección personal de juegos (una ficha por juego por usuario)
-- CASCADE: si se borra el usuario, se borran sus fichas
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

-- No dejar que un usuario tenga dos fichas del mismo juego del catálogo
CREATE UNIQUE INDEX IF NOT EXISTS idx_juegos_uq_usuario_catalogo
  ON juegos (usuario_id, catalogo_id)
  WHERE catalogo_id IS NOT NULL;

-- Comentarios (hilos de reseñas, con respuestas encadenadas vía parent_id)
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

-- Votos en reseñas de primer nivel (pulgar arriba / abajo, estilo Steam)
CREATE TABLE IF NOT EXISTS juego_comentario_votos (
  comentario_id INTEGER NOT NULL REFERENCES juego_comentarios(id) ON DELETE CASCADE,
  usuario_id    INTEGER NOT NULL REFERENCES usuarios(id)         ON DELETE CASCADE,
  valor         SMALLINT NOT NULL CHECK (valor IN (-1, 1)),
  PRIMARY KEY (comentario_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_comentario_votos_comentario
  ON juego_comentario_votos (comentario_id);

-- Seguimientos entre usuarios (feed y prerequisito para enviar recomendaciones)
CREATE TABLE IF NOT EXISTS usuario_seguimientos (
  id           SERIAL PRIMARY KEY,
  seguidor_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  seguido_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (seguidor_id, seguido_id),
  CONSTRAINT chk_seguimiento_distinto CHECK (seguidor_id <> seguido_id)
);

CREATE INDEX IF NOT EXISTS idx_seguimientos_seguidor ON usuario_seguimientos (seguidor_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_seguido ON usuario_seguimientos (seguido_id);

-- Recomendación de un juego de la biblioteca del remitente hacia otro usuario
CREATE TABLE IF NOT EXISTS juego_recomendaciones (
  id               SERIAL PRIMARY KEY,
  remitente_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  destinatario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  juego_id         INTEGER NOT NULL REFERENCES juegos(id) ON DELETE CASCADE,
  mensaje          TEXT,
  leida            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_reco_distintos CHECK (remitente_id <> destinatario_id),
  CONSTRAINT chk_reco_mensaje_len CHECK (
    mensaje IS NULL OR (char_length(trim(mensaje)) > 0 AND char_length(mensaje) <= 500)
  )
);

CREATE INDEX IF NOT EXISTS idx_reco_dest_leida ON juego_recomendaciones (destinatario_id, leida);
CREATE INDEX IF NOT EXISTS idx_reco_dest_creado ON juego_recomendaciones (destinatario_id, created_at DESC);

-- Buscar compañeros (LFG): publicación ligada a una ficha propia del usuario
CREATE TABLE IF NOT EXISTS lfg_publicaciones (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  juego_id    INTEGER NOT NULL REFERENCES juegos(id) ON DELETE CASCADE,
  modo        VARCHAR(32) NOT NULL CHECK (modo IN ('online', 'coop_local', 'otro')),
  mensaje     TEXT NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_lfg_mensaje CHECK (
    char_length(trim(mensaje)) > 0 AND char_length(mensaje) <= 500
  )
);

CREATE INDEX IF NOT EXISTS idx_lfg_activo_creado ON lfg_publicaciones (activo, created_at DESC);

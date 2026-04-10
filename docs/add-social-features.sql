-- MyPlaythrough — Funcionalidades sociales ampliadas (seguimientos, recomendaciones, LFG, preferencia de sonido)
-- Ejecutar una vez sobre una BD existente (después de schema.sql y migraciones previas).

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS notificaciones_sonido BOOLEAN NOT NULL DEFAULT TRUE;

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

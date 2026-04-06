-- Tabla de comentarios (hilos de reseñas por juego)

CREATE TABLE IF NOT EXISTS juego_comentarios (
  id SERIAL PRIMARY KEY,
  juego_id INTEGER NOT NULL REFERENCES juegos (id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES juego_comentarios (id) ON DELETE CASCADE,
  cuerpo TEXT NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cuerpo_no_vacio CHECK (char_length(trim(cuerpo)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_juego_comentarios_juego ON juego_comentarios (juego_id);
CREATE INDEX IF NOT EXISTS idx_juego_comentarios_parent ON juego_comentarios (parent_id);

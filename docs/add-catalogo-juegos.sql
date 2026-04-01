-- Catálogo global (una fila por juego oficial RAWG/Steam), estilo "categoría" Twitch.
-- Cada usuario enlaza su ficha con catalogo_id; título y carátula salen del catálogo.

CREATE TABLE IF NOT EXISTS catalogo_juegos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(512) NOT NULL,
  url_imagen TEXT,
  rawg_id INTEGER UNIQUE,
  steam_app_id BIGINT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE juegos ADD COLUMN IF NOT EXISTS catalogo_id INTEGER
  REFERENCES catalogo_juegos (id) ON DELETE SET NULL;

-- Un usuario no puede tener dos fichas del mismo juego del catálogo.
CREATE UNIQUE INDEX IF NOT EXISTS idx_juegos_uq_usuario_catalogo
  ON juegos (usuario_id, catalogo_id)
  WHERE catalogo_id IS NOT NULL;

-- Votos útiles / no útiles en reseñas de primer nivel (estilo Steam).
-- Ejecutar tras schema.sql o en BD existente: cd server && npm run migrate:votes

CREATE TABLE IF NOT EXISTS juego_comentario_votos (
  comentario_id INTEGER NOT NULL REFERENCES juego_comentarios(id) ON DELETE CASCADE,
  usuario_id    INTEGER NOT NULL REFERENCES usuarios(id)         ON DELETE CASCADE,
  valor         SMALLINT NOT NULL CHECK (valor IN (-1, 1)),
  PRIMARY KEY (comentario_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_comentario_votos_comentario
  ON juego_comentario_votos (comentario_id);

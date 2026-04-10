-- Quita restricciones UNIQUE que molestan al renombrar fichas (ej. DLC → juego base).
-- La app ya controla duplicados por código, así que estas constraints sobran.

ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_titulo_key;
ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_titulo_unique;
ALTER TABLE juegos DROP CONSTRAINT IF EXISTS titulo_unico;

-- También por si tenías UNIQUE(usuario_id, titulo):

ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_usuario_id_titulo_key;
ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_usuario_id_titulo_unique;

-- Some schemas define UNIQUE on juegos.titulo alone (global) or block the same title per user
-- when you only need one row per catalog game. That prevents turning a DLC row into the base
-- game if another row already uses the canonical title from the catalog.
--
-- 1) Inspect constraints (optional):
--    SELECT conname, pg_get_constraintdef(oid)
--    FROM pg_constraint WHERE conrelid = 'juegos'::regclass AND contype = 'u';
--
-- 2) Drop common auto-generated names (safe IF EXISTS):

ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_titulo_key;
ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_titulo_unique;

-- If you had UNIQUE (usuario_id, titulo) and need to allow replacing one row with another
-- (same canonical title from catalog), drop that too — the app already prevents duplicates
-- by normalized title and catalogo_id where applicable:

ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_usuario_id_titulo_key;
ALTER TABLE juegos DROP CONSTRAINT IF EXISTS juegos_usuario_id_titulo_unique;

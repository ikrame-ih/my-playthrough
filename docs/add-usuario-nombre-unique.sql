-- Un solo nombre de usuario visible por variante en minúsculas (irrepetible).
-- Ejecutar en BD existente: cd server && npm run migrate:username-unique
--
-- Si falla por duplicados, localízalos con:
--   SELECT LOWER(TRIM(nombre_usuario)) k, COUNT(*) FROM usuarios GROUP BY 1 HAVING COUNT(*) > 1;
-- Renombra o fusiona filas hasta que no queden duplicados y vuelve a ejecutar.

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_nombre_lower
  ON usuarios (LOWER(TRIM(nombre_usuario)));

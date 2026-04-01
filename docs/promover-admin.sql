-- En la tabla usuarios el CHECK solo permite rol 'user' o 'admin'.
-- Para probar el panel de administración, ejecuta esto en PostgreSQL
-- (pgAdmin o psql) cambiando el email por el tuyo:

UPDATE usuarios
SET rol = 'admin'
WHERE email = 'tu_email@ejemplo.com';

-- Tras esto, cierra sesión en la app y vuelve a entrar
-- (o recarga la página) para que el JWT traiga el rol actualizado.

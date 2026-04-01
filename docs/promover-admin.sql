-- En la tabla usuarios el CHECK solo permite rol 'user' o 'admin'.
-- Para probar el panel de administración, ejecuta esto en PostgreSQL
-- (pgAdmin o psql) cambiando el email por el tuyo:

UPDATE usuarios
SET rol = 'admin'
WHERE email = 'tu_email@ejemplo.com';

-- El servidor comprueba el rol en la base de datos en rutas de admin,
-- así que suele bastar con recargar la página. Si algo falla, cierra sesión
-- y vuelve a entrar para alinear también el objeto `user` del cliente.

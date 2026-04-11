-- Para probar el panel de admin, cambia tu email y ejecuta esto en pgAdmin/psql:

UPDATE usuarios
SET rol = 'admin'
WHERE email = 'tu_email@ejemplo.com';

-- Después recarga la página (o cierra sesión y vuelve a entrar).

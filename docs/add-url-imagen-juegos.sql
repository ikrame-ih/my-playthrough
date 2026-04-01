-- Ejecutar una vez en PostgreSQL 11+ (columna opcional para portadas en tarjetas).
ALTER TABLE juegos ADD COLUMN IF NOT EXISTS url_imagen TEXT;

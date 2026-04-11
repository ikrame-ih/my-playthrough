-- Añade la columna de imagen a la tabla de juegos (ejecutar una vez)
ALTER TABLE juegos ADD COLUMN IF NOT EXISTS url_imagen TEXT;

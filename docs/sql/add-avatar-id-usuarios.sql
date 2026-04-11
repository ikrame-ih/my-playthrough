-- Añade avatar de perfil predefinido a usuarios existentes (ejecutar una vez en BD ya creada).
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS avatar_id VARCHAR(32) NOT NULL DEFAULT 'robot-0';

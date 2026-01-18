-- Hacer opcionales username y password_hash en profiles
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN password_hash DROP NOT NULL;

-- Manejar la restricción UNIQUE de username para permitir múltiples NULLs
-- Postgres estándar permite múltiples NULLs en restricciones UNIQUE, pero es mejor ser explícito o usar un índice parcial si hay problemas.
-- Primero verificamos si existe la restricción y la eliminamos si es necesario para reemplazarla con un índice más flexible si fuera el caso,
-- pero en Postgres, UNIQUE permite múltiples NULLs por defecto.
-- Sin embargo, para asegurarnos de que no haya conflictos con strings vacíos vs NULLs:

-- Aseguramos que los usernames vacíos sean NULL (limpieza de datos si aplica, aunque es tabla nueva)
UPDATE profiles SET username = NULL WHERE username = '';

-- Si la restricción es un índice UNIQUE normal, ya soporta múltiples NULLs.
-- Pero si queremos ser muy seguros, podemos crear un índice parcial.
-- Asumimos que la restricción se llama 'profiles_username_key' (nombre por defecto).

-- No necesitamos borrar la constraint si funciona estándar (que lo hace).
-- Solo aseguramos que la columna acepte NULLs (hecho arriba).

-- Script para resetear completamente la base de datos
-- Funciona en Neon, Render, Fly Postgres y cualquier PostgreSQL cloud (no requiere DROP DATABASE)
--
-- Uso:
--   psql $DATABASE_URL -f database/reset-database.sql
--   psql $DATABASE_URL -f database/create-tables.sql
--   psql $DATABASE_URL -f database/load-sample-data.sql   (opcional)
--
-- ADVERTENCIA: destruye TODOS los datos, tablas, índices y triggers del schema public.

-- Eliminar y recrear el schema public (equivalente a DROP DATABASE sin desconectarse)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restaurar permisos estándar
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Script para resetear completamente la base de datos
-- Ejecutar en pgAdmin o con: psql -U postgres -f reset-database.sql

-- Terminar conexiones activas
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'nailsandco'
  AND pid <> pg_backend_pid();

-- Eliminar base de datos si existe
DROP DATABASE IF EXISTS nailsandco;

-- Crear base de datos nueva (usando configuración por defecto)
CREATE DATABASE nailsandco
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8';
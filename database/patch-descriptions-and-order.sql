-- ============================================================
-- PATCH: Update Removals descriptions + Addon display order
-- Run once against the live database to apply these fixes.
-- ============================================================

-- -------------------------------------------------------
-- 1. Fix displayOrder for Acrylic With Tips M/L
--    (should appear right after Additional Gel Polish = 10,
--     before French Design = 20)
-- -------------------------------------------------------
UPDATE addons SET "displayOrder" = 11 WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a424';  -- Acrylic With Tips M
UPDATE addons SET "displayOrder" = 12 WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a425';  -- Acrylic With Tips L

-- -------------------------------------------------------
-- 2. Fix displayOrder for +3 / +4 Weeks Refill
--    (should appear right after Additional Gel Polish = 10,
--     before French Design = 20)
-- -------------------------------------------------------
UPDATE addons SET "displayOrder" = 13 WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426';  -- +3 Weeks Refill
UPDATE addons SET "displayOrder" = 14 WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427';  -- +4 Weeks Refill

-- -------------------------------------------------------
-- 3. Update Removal service descriptions (EN + ES)
--    Table: services (primary EN description)
--    Table: services_lang (multilingual title + description)
-- -------------------------------------------------------

-- Gel Removal - Mani (No Service)
UPDATE services SET description = 'Gentle and safe gel polish removal when no other service is booked. Leaves nails clean and ready to breathe. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'
WHERE id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a001';

UPDATE services_lang SET title = 'Gel Removal - Mani (No Service)', description = 'Gentle and safe gel polish removal when no other service is booked. Leaves nails clean and ready to breathe. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'
WHERE service_id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a001' AND language_id = '00000000-0000-0000-0000-000000000001';

UPDATE services_lang SET title = 'Retiro de Gel - Mani (sin servicio)', description = 'Retiro suave y seguro de esmalte en gel para cuando no se reserva otro servicio. Deja las uñas limpias y listas para descansar. ¿Vas a reservar una mani o pedi? Seleccione el servicio principal y agregue el retiro como complemento.'
WHERE service_id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a001' AND language_id = '00000000-0000-0000-0000-000000000002';

-- Gel Removal - Pedi (No Service)
UPDATE services SET description = 'Gentle and safe gel polish removal when no other service is booked. Leaves nails clean and ready to breathe. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'
WHERE id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a002';

UPDATE services_lang SET title = 'Gel Removal - Pedi (No Service)', description = 'Gentle and safe gel polish removal when no other service is booked. Leaves nails clean and ready to breathe. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'
WHERE service_id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a002' AND language_id = '00000000-0000-0000-0000-000000000001';

UPDATE services_lang SET title = 'Retiro de Gel - Pedi (sin servicio)', description = 'Retiro suave y seguro de esmalte en gel para cuando no se reserva otro servicio. Deja las uñas limpias y listas para descansar. ¿Vas a reservar una mani o pedi? Seleccione el servicio principal y agregue el retiro como complemento.'
WHERE service_id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a002' AND language_id = '00000000-0000-0000-0000-000000000002';

-- Extensions or Acrylics Removal
UPDATE services SET description = 'Gentle and safe hard gel, extensions or acrylic removal when no other service is booked. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'
WHERE id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a003';

UPDATE services_lang SET title = 'Extensions or Acrylics Removal', description = 'Gentle and safe hard gel, extensions or acrylic removal when no other service is booked. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'
WHERE service_id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a003' AND language_id = '00000000-0000-0000-0000-000000000001';

UPDATE services_lang SET title = 'Retiro de Extensiones o Acrílicos', description = 'Retiro suave y seguro de acrílico o extensiones para cuando no se reserva otro servicio. ¿Vas a reservar una mani o pedi? Seleccione el servicio principal y agregue el retiro como complemento.'
WHERE service_id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a003' AND language_id = '00000000-0000-0000-0000-000000000002';

-- Builder Gel / BIAB Removal - Mani (No Service)
UPDATE services SET description = 'Gentle and safe Builder Gel / BIAB removal when no other service is booked. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'
WHERE id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a004';

UPDATE services_lang SET title = 'Builder Gel / BIAB Removal - Mani (No Service)', description = 'Gentle and safe Builder Gel / BIAB removal when no other service is booked. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'
WHERE service_id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a004' AND language_id = '00000000-0000-0000-0000-000000000001';

UPDATE services_lang SET title = 'Retiro de Builder Gel / BIAB - Mani (sin servicio)', description = 'Retiro suave y seguro de extensiones Builder Gel / BIAB para cuando no se reserva otro servicio. ¿Vas a reservar una mani o pedi? Seleccione el servicio principal y agregue el retiro como complemento.'
WHERE service_id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a004' AND language_id = '00000000-0000-0000-0000-000000000002';

-- Builder Gel / BIAB Removal - Pedi (No Service)
UPDATE services SET description = 'Gentle and safe Builder Gel / BIAB removal when no other service is booked. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'
WHERE id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a005';

UPDATE services_lang SET title = 'Builder Gel / BIAB Removal - Pedi (No Service)', description = 'Gentle and safe Builder Gel / BIAB removal when no other service is booked. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'
WHERE service_id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a005' AND language_id = '00000000-0000-0000-0000-000000000001';

UPDATE services_lang SET title = 'Retiro de Builder Gel / BIAB - Pedi (sin servicio)', description = 'Retiro suave y seguro de extensiones Builder Gel / BIAB para cuando no se reserva otro servicio. ¿Vas a reservar una mani o pedi? Seleccione el servicio principal y agregue el retiro como complemento.'
WHERE service_id = 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a005' AND language_id = '00000000-0000-0000-0000-000000000002';

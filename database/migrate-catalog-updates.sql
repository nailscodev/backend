-- =====================================================
-- NAILS & CO. - Catalog Migration Script
-- Version: 2025-01 — Add-on ordering, names, new services & zone-based removals
-- =====================================================
-- Run with: flyctl postgres connect -a nailsco-db -d nailsandco
-- Then: \i migrate-catalog-updates.sql
-- =====================================================

SET client_encoding = 'UTF8';

BEGIN;

-- =====================================================
-- STEP 1: Ensure new Removal SERVICES exist
-- (Builder Gel / BIAB Removal - Mani and Pedi as bookable standalone services)
-- =====================================================

INSERT INTO services (
  id, name, description, category, category_id, parent_category_id,
  price, duration, "bufferTime", "isActive", "isPopular", "displayOrder", combo
)
VALUES
(
  'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a004',
  'Builder Gel / BIAB Removal - Mani (No Service)',
  'Safe removal of builder gel or BIAB **when no other service is booked**. Leaves nails clean and ready to breathe. Booking a new mani? Please select the main service and add removal as an add-on instead.',
  'ADDON',
  'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
  'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  15, 15, 10, true, false, 31, false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  "isActive" = EXCLUDED."isActive";

INSERT INTO services (
  id, name, description, category, category_id, parent_category_id,
  price, duration, "bufferTime", "isActive", "isPopular", "displayOrder", combo
)
VALUES
(
  'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a005',
  'Builder Gel / BIAB Removal - Pedi (No Service)',
  'Safe removal of builder gel or BIAB **when no other service is booked**. Leaves nails clean and ready to breathe. Booking a new pedi? Please select the main service and add removal as an add-on instead.',
  'ADDON',
  'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  15, 15, 10, true, false, 32, false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  "isActive" = EXCLUDED."isActive";

-- =====================================================
-- STEP 2: Ensure new ADD-ONS exist (Cat Eye/Chrome Pedi combos + BIAB Removal add-ons)
-- =====================================================

INSERT INTO addons (id, name, description, price, "additionalTime", "isActive", "displayOrder", removal)
VALUES
-- Cat Eye & Chrome combo variants (Pedi)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430', 'Cat Eye Finish - Mani',
  'Unique magnetic gel polish creates a "cat eye" effect for a stunning, reflective finish.',
  25, 20, true, 24, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a431', 'Cat Eye Finish - Pedi',
  'Unique magnetic gel polish creates a "cat eye" effect for a stunning, reflective finish.',
  25, 20, true, 25, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432', 'Chrome Finish - Mani',
  'A mirror-like chrome layer for a reflective, metallic look - inspired by the Glazed Donut manicure trend.',
  10, 20, true, 27, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a433', 'Chrome Finish - Pedi',
  'A mirror-like chrome layer for a reflective, metallic look - inspired by the Glazed Donut manicure trend.',
  10, 20, true, 28, false),
-- Builder Gel / BIAB Removal add-ons
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434', 'Builder Gel / BIAB Removal - Mani',
  'Safe removal of builder gel or BIAB for manicure. Leaves nails clean and ready.',
  15, 15, true, 63, true),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435', 'Builder Gel / BIAB Removal - Pedi',
  'Safe removal of builder gel or BIAB for pedicure. Leaves nails clean and ready.',
  15, 15, true, 64, true)
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  "displayOrder" = EXCLUDED."displayOrder",
  removal    = EXCLUDED.removal,
  price      = EXCLUDED.price;

-- =====================================================
-- STEP 3: Fix add-on names — update "(Mani)/(Pedi)" → "- Mani / - Pedi" format
-- =====================================================

UPDATE addons SET name = 'French Design - Mani'
  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a411'
    AND name <> 'French Design - Mani';

UPDATE addons SET name = 'French Design - Pedi'
  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a412'
    AND name <> 'French Design - Pedi';

UPDATE addons SET name = 'Nail Art (10 M) - Mani'
  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a413'
    AND name <> 'Nail Art (10 M) - Mani';

UPDATE addons SET name = 'Nail Art (10 M) - Pedi'
  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a414'
    AND name <> 'Nail Art (10 M) - Pedi';

UPDATE addons SET name = 'Nail Art (15 M) - Mani'
  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a415'
    AND name <> 'Nail Art (15 M) - Mani';

UPDATE addons SET name = 'Nail Art (15 M) - Pedi'
  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a416'
    AND name <> 'Nail Art (15 M) - Pedi';

UPDATE addons SET name = 'Nail Art (20 M) - Mani'
  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a417'
    AND name <> 'Nail Art (20 M) - Mani';

UPDATE addons SET name = 'Nail Art (20 M) - Pedi'
  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a418'
    AND name <> 'Nail Art (20 M) - Pedi';

UPDATE addons SET name = 'Extended Massage - Mani'
  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a419'
    AND name <> 'Extended Massage - Mani';

UPDATE addons SET name = 'Extended Massage - Pedi'
  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a420'
    AND name <> 'Extended Massage - Pedi';

-- =====================================================
-- STEP 4: Renumber displayOrders
-- New scheme groups by type: Gel Polish(10) → Tips/Refills(11-16) →
--   French(20-22) → Cat Eye(23-25) → Chrome(26-28) →
--   Nail Art(30-38) → Extended Massage(40-42) →
--   Fix Nail(50-51) → Removals(60-64)
-- =====================================================

UPDATE addons SET "displayOrder" = 10  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a401'; -- Additional Gel Polish
UPDATE addons SET "displayOrder" = 11  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a424'; -- Acrylic With Tips M
UPDATE addons SET "displayOrder" = 12  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a425'; -- Acrylic With Tips L
UPDATE addons SET "displayOrder" = 13  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426'; -- +3 Weeks Refill
UPDATE addons SET "displayOrder" = 14  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427'; -- +4 Weeks Refill
UPDATE addons SET "displayOrder" = 15  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a428'; -- Polygel With Tips M
UPDATE addons SET "displayOrder" = 16  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a429'; -- Polygel With Tips L
UPDATE addons SET "displayOrder" = 20  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'; -- French Design (generic)
UPDATE addons SET "displayOrder" = 21  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a411'; -- French Design - Mani
UPDATE addons SET "displayOrder" = 22  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a412'; -- French Design - Pedi
UPDATE addons SET "displayOrder" = 23  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'; -- Cat Eye Finish (generic)
UPDATE addons SET "displayOrder" = 24  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430'; -- Cat Eye Finish - Mani
UPDATE addons SET "displayOrder" = 25  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a431'; -- Cat Eye Finish - Pedi
UPDATE addons SET "displayOrder" = 26  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'; -- Chrome Finish (generic)
UPDATE addons SET "displayOrder" = 27  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432'; -- Chrome Finish - Mani
UPDATE addons SET "displayOrder" = 28  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a433'; -- Chrome Finish - Pedi
UPDATE addons SET "displayOrder" = 30  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'; -- Nail Art (10 M) generic
UPDATE addons SET "displayOrder" = 31  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a413'; -- Nail Art (10 M) - Mani
UPDATE addons SET "displayOrder" = 32  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a414'; -- Nail Art (10 M) - Pedi
UPDATE addons SET "displayOrder" = 33  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'; -- Nail Art (15 M) generic
UPDATE addons SET "displayOrder" = 34  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a415'; -- Nail Art (15 M) - Mani
UPDATE addons SET "displayOrder" = 35  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a416'; -- Nail Art (15 M) - Pedi
UPDATE addons SET "displayOrder" = 36  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'; -- Nail Art (20 M) generic
UPDATE addons SET "displayOrder" = 37  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a417'; -- Nail Art (20 M) - Mani
UPDATE addons SET "displayOrder" = 38  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a418'; -- Nail Art (20 M) - Pedi
UPDATE addons SET "displayOrder" = 40  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'; -- Extended Massage (generic)
UPDATE addons SET "displayOrder" = 41  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a419'; -- Extended Massage - Mani
UPDATE addons SET "displayOrder" = 42  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a420'; -- Extended Massage - Pedi
UPDATE addons SET "displayOrder" = 50  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409'; -- Fix Nail
UPDATE addons SET "displayOrder" = 51  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410'; -- Fix Nail Extension
UPDATE addons SET "displayOrder" = 60  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'; -- Gel Removal - Mani
UPDATE addons SET "displayOrder" = 61  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'; -- Gel Removal - Pedi
UPDATE addons SET "displayOrder" = 62  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'; -- Extensions or Acrylics Removal
UPDATE addons SET "displayOrder" = 63  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'; -- Builder Gel/BIAB Removal - Mani
UPDATE addons SET "displayOrder" = 64  WHERE id = '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'; -- Builder Gel/BIAB Removal - Pedi

-- =====================================================
-- STEP 5: Ensure service_addons links for new add-ons
-- (idempotent — ON CONFLICT DO NOTHING)
-- =====================================================

-- Cat Eye & Chrome (Mani combos) for PERFECT PAIR & GEL GLAM
INSERT INTO service_addons (service_id, addon_id) VALUES
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430'),  -- Perfect Pair → Cat Eye - Mani
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432'),  -- Perfect Pair → Chrome - Mani
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430'),  -- Gel Glam → Cat Eye - Mani
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a431'),  -- Gel Glam → Cat Eye - Pedi
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432'),  -- Gel Glam → Chrome - Mani
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a433')   -- Gel Glam → Chrome - Pedi
ON CONFLICT DO NOTHING;

-- Fix Nail for PERFECT PAIR & GEL GLAM combos
INSERT INTO service_addons (service_id, addon_id) VALUES
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409'),  -- Perfect Pair → Fix Nail
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409')   -- Gel Glam → Fix Nail
ON CONFLICT DO NOTHING;

-- Builder Gel / BIAB Removal add-on for all MANICURE services
INSERT INTO service_addons (service_id, addon_id) VALUES
  ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Basic Mani
  ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Gel Basic Mani
  ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Premium Mani
  ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Premium Gel Mani
  ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Builder Gel / BIAB
  ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Express Mani - Polish
  ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434')   -- Express Mani - Gel
ON CONFLICT DO NOTHING;

-- Builder Gel / BIAB Removal add-on for all NAIL ENHANCEMENT services
INSERT INTO service_addons (service_id, addon_id) VALUES
  ('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Aprés Gel-X With Gel
  ('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Aprés Gel-X Without Gel
  ('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Full Set Acrylic
  ('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Refill Acrylic
  ('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Polygel Full Set
  ('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434')   -- Polygel Refill
ON CONFLICT DO NOTHING;

-- Builder Gel / BIAB Removal add-on for all PEDICURE services
INSERT INTO service_addons (service_id, addon_id) VALUES
  ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Basic Spa Pedi
  ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Gel Basic Pedi
  ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Premium Spa Pedi
  ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Premium Spa Gel Pedi
  ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Glam Pedi Box
  ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Glam Pedi Box Gel
  ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d707', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Express Pedi - Polish
  ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435')   -- Express Pedi - Gel
ON CONFLICT DO NOTHING;

-- Builder Gel / BIAB Removal for COMBO services (both Mani and Pedi variants)
INSERT INTO service_addons (service_id, addon_id) VALUES
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Regular Pack → BIAB - Mani
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Regular Pack → BIAB - Pedi
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Perfect Pair → BIAB - Mani
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Perfect Pair → BIAB - Pedi
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Gel Glam → BIAB - Mani
  ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435')   -- Gel Glam → BIAB - Pedi
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 6: Ensure addon_incompatibilities for new BIAB Removal add-ons
-- MANI zone: Gel Removal Mani, Extensions Removal, BIAB Removal Mani (exclusive within zone)
-- PEDI zone: Gel Removal Pedi, BIAB Removal Pedi (exclusive within zone)
-- =====================================================

INSERT INTO addon_incompatibilities (addon_id, incompatible_addon_id) VALUES
  -- Gel Removal Mani ↔ Extensions Removal
  ('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),
  ('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),
  -- Gel Removal Mani ↔ BIAB Removal Mani
  ('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),
  ('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),
  -- Extensions Removal ↔ BIAB Removal Mani
  ('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),
  ('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),
  -- Gel Removal Pedi ↔ BIAB Removal Pedi
  ('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),
  ('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 7: Verify — print summary counts
-- =====================================================

DO $$
DECLARE
  addon_count INT;
  service_count INT;
  sa_count INT;
BEGIN
  SELECT COUNT(*) INTO addon_count FROM addons;
  SELECT COUNT(*) INTO service_count FROM services;
  SELECT COUNT(*) INTO sa_count FROM service_addons;
  RAISE NOTICE 'Migration complete: % addons, % services, % service_addon links', addon_count, service_count, sa_count;
END;
$$;

COMMIT;

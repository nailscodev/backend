-- =====================================================
-- NAILS & CO. - Complete Sample Data Loading Script
-- =====================================================
-- Execute AFTER create-tables.sql
-- Command: psql -U postgres -d nailsandco -f load-sample-data.sql
-- =====================================================

-- Set client encoding to UTF8 for proper character support
SET client_encoding = 'UTF8';

-- Clear ALL existing data
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE addons CASCADE;
TRUNCATE TABLE staff CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE service_incompatibilities CASCADE;
TRUNCATE TABLE addon_incompatibilities CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE combo_eligible CASCADE;
TRUNCATE TABLE manual_adjustments CASCADE;
TRUNCATE TABLE screen_roles CASCADE;

-- =====================================================
-- INSERT CATEGORIES - Fixed UUIDs
-- =====================================================

INSERT INTO categories (id, name, "displayOrder", "isActive") VALUES
('c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Manicure', 1, TRUE),
('c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Nail Enhancements', 2, TRUE),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Pedicure', 3, TRUE),
('c4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'Kids', 4, FALSE),
('c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'Combos', 5, TRUE),
('c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'Removals', 6, TRUE);

-- =====================================================
-- INSERT SERVICES - 29 services across 6 categories
-- =====================================================

INSERT INTO services (id, name, description, category, category_id, parent_category_id, price, duration, "bufferTime", "isActive", "isPopular", "displayOrder", combo) VALUES

-- ============== CATEGORY: MANICURE (7 services) - combo=true ==============
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', 'Basic Manicure', 'Nail cutting and shaping, cuticle care, and moisturizing, finished with regular polish of your choice from our color collection.', 'NAILS', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL, 25, 30, 15, true, true, 1, true),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', 'Gel Basic Manicure', 'Nail cutting and shaping, cuticle care, and moisturizing, finished with a long-lasting gel polish of your choice from our color collection.', 'NAILS', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL, 40, 30, 15, true, true, 2, true),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', 'Premium N&Co. Manicure', 'Indulge in the ultimate manicure experience. Includes everything from our Regular Manicure, plus a gentle hand exfoliation with nourishing oils and warm towels for smooth, hydrated, and rejuvenated skin.', 'NAILS', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL, 40, 40, 15, true, true, 3, true),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', 'Premium N&Co. Gel Manicure', 'Indulge in the ultimate manicure experience. Includes everything from our Gel Manicure, plus a gentle hand exfoliation with nourishing oils and warm towels for smooth, hydrated, and rejuvenated skin.', 'NAILS', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL, 50, 40, 15, true, true, 4, true),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', 'Builder Gel / BIAB', 'A strengthening gel layer applied to the natural nail to protect and prevent breakage. Ideal for thin or weak nails needing extra support. Includes gel polish of your choice.', 'NAILS', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL, 65, 80, 15, true, false, 5, true),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506', 'Express Mani - Polish', 'Our express manicure includes a color change with your favorite shade from our collection.', 'NAILS', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL, 15, 20, 10, true, false, 6, true),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507', 'Express Mani - Gel', 'Our express gel manicure includes a long-lasting gel polish color change with your choice from our collection.', 'NAILS', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', NULL, 30, 30, 10, true, false, 7, true),

-- ============== CATEGORY: NAIL ENHANCEMENTS (6 services) - combo=false ==============
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', 'Aprés Gel-X With Gel Polish', 'Add natural-looking length to your nails in less time with pre-formed Gel-X tips — lightweight, strong, and safe for your natural nails. Includes buffing, cuticle care, moisturizing, and nail extensions, finished with a gel polish of your choice from our color collection.', 'NAILS', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL, 80, 75, 20, true, true, 8, false),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602', 'Aprés Gel-X Without Gel Polish', 'Add natural-looking length to your nails in less time with pre-formed Gel-X tips — lightweight, strong, and safe for your natural nails. Includes buffing, cuticle care, moisturizing, and nail extensions, ideal for clients who prefer to keep their nails natural.', 'NAILS', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL, 70, 75, 20, false, true, 9, false),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', 'Full Set Acrylic', 'Enhance your nails with durable short acrylic extensions. Includes prep, tip application, and acrylic build. *Price does not include gel polish — please add it separately if desired. Medium and long lengths available at an additional cost.', 'NAILS', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL, 60, 90, 20, true, true, 10, false),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', 'Refill Acrylic', 'Revitalize your nails with an acrylic refill to maintain a flawless, polished look. Includes nail reshaping, cuticle care, and acrylic rebalance. *Default price applies to 2-week refills. For 3- or 4-week sets, please select the corresponding add-on below. Gel polish is not included; add it separately if desired.', 'NAILS', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL, 40, 60, 15, true, true, 11, false),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', 'Polygel Full Set', 'Lightweight yet strong nail extensions that combine the flexibility of gel with the durability of acrylic. Includes shaping, buffing, cuticle care, and extensions sculpted to a natural length. *Price does not include gel polish — please add it separately if desired. Medium and long lengths available at an additional cost.', 'NAILS', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL, 70, 90, 20, false, true, 12, false),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', 'Polygel Refill', 'Refresh your Polygel extensions with a precise refill. Includes nail reshaping, cuticle care, and polygel rebalance. Default price applies to 2-week refills. For 3- or 4-week sets, please select the corresponding add-on below. Gel polish is not included; add it separately if desired.', 'NAILS', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', NULL, 55, 90, 15, false, true, 13, false),

-- ============== CATEGORY: PEDICURE (8 services) - combo=true ==============
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', 'Basic Spa Pedicure', 'Nail shaping and buffing, cuticle care, and a relaxing foot massage with lotion, finished with a polish of your choice from our color collection.', 'NAILS', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, 35, 45, 15, true, true, 14, true),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', 'Gel Basic Pedicure', 'Nail shaping and buffing, cuticle care, and a relaxing foot massage with lotion, finished with a long-lasting gel polish of your choice from our color collection.', 'NAILS', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, 50, 45, 15, true, true, 15, true),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', 'Premium N&Co. Spa Pedicure', 'A rejuvenating pedicure that includes expert nail shaping, cuticle care, natural exfoliation, gentle callus removal, a relaxing oil massage, and warm towels, finished with your choice of regular polish for soft, renewed feet.', 'NAILS', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, 45, 60, 15, true, true, 16, true),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', 'Premium N&Co. Spa Gel Pedicure', 'A rejuvenating pedicure that includes expert nail shaping, cuticle care, natural exfoliation, gentle callus removal, a relaxing oil massage, and warm towels, finished with your choice of long-lasting gel polish for soft, renewed feet.', 'NAILS', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, 60, 60, 15, true, true, 17, true),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', 'Glam Pedi in a Box Pedicure', 'Treat your feet with our four-step treatment, designed to deeply hydrate and restore. Includes a relaxing salt soak, sugar scrub exfoliation, mud masque, and butter massage. Finished with your choice of regular polish.', 'NAILS', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, 55, 60, 15, true, true, 18, true),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', 'Glam Pedi in a Box Gel Pedicure', 'Treat your feet with our four-step treatment, designed to deeply hydrate and restore. Includes a relaxing salt soak, sugar scrub exfoliation, mud masque, and butter massage. Finished with your choice of long-lasting gel polish.', 'NAILS', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, 70, 60, 15, true, true, 19, true),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d707', 'Express Pedi - Polish', 'Our express pedicure includes a color change with your favorite shade from our collection.', 'NAILS', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, 20, 20, 10, true, false, 20, true),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', 'Express Pedi - Gel', 'Our express gel pedicure includes a long-lasting gel polish color change with your choice from our collection.', 'NAILS', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', NULL, 30, 30, 10, true, false, 21, true),

-- ============== CATEGORY: KIDS (Ages 3-13) (3 services) - combo=false ==============

('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', 'Basic Manicure (Kids)', 'Includes gentle nail shaping, cuticle care, and polish of their choice. Specially designed for kids ages 3-13.', 'NAILS', 'c4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', NULL, 13, 30, 10, true, false, 22, false),
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', 'Gel Manicure (Kids)', 'Includes gentle nail shaping, cuticle care, and long-lasting gel polish. Specially designed for kids ages 3-13.', 'NAILS', 'c4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', NULL, 20, 30, 10, true, false, 23, false),
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e803', 'Basic Pedicure (Kids)', 'Includes nail shaping, cuticle care, light massage, and polish of their choice.', 'NAILS', 'c4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', NULL, 20, 30, 10, true, false, 24, false),

-- ============== CATEGORY: COMBOS (3 services) - combo=false ==============
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', 'REGULAR PACK', 'Basic Manicure + Basic Spa Pedicure', 'NAILS', 'c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', NULL, 55, 75, 20, true, true, 25, false),
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', 'PERFECT PAIR', 'Gel Basic Manicure + Basic Spa Pedicure', 'NAILS', 'c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', NULL, 70, 75, 20, true, true, 26, false),
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', 'GEL GLAM', 'Gel Basic Manicure + Gel Basic Pedicure', 'NAILS', 'c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', NULL, 90, 75, 20, true, true, 27, false),

-- ============== CATEGORY: REMOVALS (3 services) - combo=false ==============
-- Note: These removal services have parent_category_id set to link them to their target categories
-- Gel Removal - Mani → parent: Manicure
-- Gel Removal - Pedi → parent: Pedicure
-- Extensions Removal → parent: Manicure
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a001', 'Gel Removal - Mani (No Service)', 'Gentle gel polish removal **when no other service is booked**. Leaves nails clean and ready to breathe. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.', 'ADDON', 'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 20, 15, 10, true, false, 28, false),
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a002', 'Gel Removal - Pedi (No Service)', 'Gentle gel polish removal **when no other service is booked**. Leaves nails clean and ready to breathe. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.', 'ADDON', 'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 20, 15, 10, true, false, 29, false),
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a003', 'Extensions or Acrylics Removal', 'Safe removal of acrylics or nail extensions **when no other service is booked**. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.', 'ADDON', 'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 20, 25, 10, true, false, 30, false),
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a004', 'Builder Gel / BIAB Removal - Mani (No Service)', 'Safe removal of builder gel or BIAB **when no other service is booked**. Leaves nails clean and ready to breathe. Booking a new mani? Please select the main service and add removal as an add-on instead.', 'ADDON', 'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 15, 15, 10, true, false, 31, false),
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a005', 'Builder Gel / BIAB Removal - Pedi (No Service)', 'Safe removal of builder gel or BIAB **when no other service is booked**. Leaves nails clean and ready to breathe. Booking a new pedi? Please select the main service and add removal as an add-on instead.', 'ADDON', 'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 15, 15, 10, true, false, 32, false);

-- =====================================================
-- UPDATE COMBO SERVICES - Set associatedServiceIds
-- These define which individual services compose each combo package
-- =====================================================

-- REGULAR PACK: Basic Manicure + Basic Spa Pedicure
UPDATE services SET "associatedServiceIds" = ARRAY[
    'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501'::uuid,  -- Basic Manicure
    'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701'::uuid   -- Basic Spa Pedicure
] WHERE id = 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901';

-- PERFECT PAIR: Gel Basic Manicure + Basic Spa Pedicure
UPDATE services SET "associatedServiceIds" = ARRAY[
    'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502'::uuid,  -- Gel Basic Manicure
    'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701'::uuid   -- Basic Spa Pedicure
] WHERE id = 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902';

-- GEL GLAM: Gel Basic Manicure + Gel Basic Pedicure
UPDATE services SET "associatedServiceIds" = ARRAY[
    'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502'::uuid,  -- Gel Basic Manicure
    'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702'::uuid   -- Gel Basic Pedicure
] WHERE id = 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903';

-- =====================================================
-- INSERT COMBO_ELIGIBLE - Rules for VIP Combo step activation
-- These define which service combinations in cart trigger the VIP Combo step
-- =====================================================

INSERT INTO combo_eligible (id, name, description, "serviceIds", "extraPrice", "suggestedComboId", "isActive") VALUES
-- Rule 1: Basic Manicure + Basic Spa Pedicure → suggests REGULAR PACK
('ce000001-0000-0000-0000-000000000001', 'Basic Mani + Pedi Combo', 'When user selects Basic Manicure and Basic Spa Pedicure separately',
    ARRAY['a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501'::uuid, 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701'::uuid],
    -500, 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', true),

-- Rule 2: Gel Basic Manicure + Basic Spa Pedicure → suggests PERFECT PAIR  
('ce000001-0000-0000-0000-000000000002', 'Gel Mani + Basic Pedi Combo', 'When user selects Gel Basic Manicure and Basic Spa Pedicure separately',
    ARRAY['a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502'::uuid, 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701'::uuid],
    -500, 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', true),

-- Rule 3: Gel Basic Manicure + Gel Basic Pedicure → suggests GEL GLAM
('ce000001-0000-0000-0000-000000000003', 'Gel Mani + Gel Pedi Combo', 'When user selects Gel Basic Manicure and Gel Basic Pedicure separately',
    ARRAY['a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502'::uuid, 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702'::uuid],
    0, 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', true);

-- =====================================================
-- INSERT ADD-ONS - Regular add-ons (20) + Removal add-ons (3)
-- =====================================================

INSERT INTO addons (id, name, description, price, "additionalTime", "isActive", "displayOrder", removal) VALUES
-- Regular add-ons (removal = false)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a401', 'Additional Gel Polish Service', 'Long-lasting gel polish of your choice from our color collection.', 20, 30, true, 1, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402', 'French Design', 'Elevate your look with a classic French tip.', 10, 15, true, 2, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403', 'Cat Eye Finish', 'Unique magnetic gel polish creates a cat eye effect for a stunning, reflective finish.', 25, 20, true, 3, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404', 'Chrome Finish', 'A mirror-like chrome layer for a reflective, metallic look - inspired by the Glazed Donut manicure trend.', 10, 20, true, 4, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405', 'Nail Art (10 M)', 'Simple design for a quick, elegant look.', 10, 10, true, 5, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406', 'Nail Art (15 M)', 'Medium complexity design with added detail.', 15, 15, true, 6, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407', 'Nail Art (20 M)', 'Elaborate design with extra detail.', 25, 20, true, 7, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408', 'Extended Massage', 'Extend your treatment with 10 more minutes of relaxing massage.', 15, 10, true, 8, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409', 'Fix Nail', 'Repair one damaged or broken nail using the same overlay system (gel, capping).', 5, 15, true, 9, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410', 'Fix Nail Extension', 'Rebuild one broken or lifted nail using matching material and finish (Acrylic, Polygel, Gel-X).', 10, 20, true, 10, false),
-- Add-ons específicos para combos (Mani/Pedi separados)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a411', 'French Design - Mani', 'Elevate your look with a classic French tip.', 10, 15, true, 11, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a412', 'French Design - Pedi', 'Elevate your look with a classic French tip.', 10, 15, true, 12, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a413', 'Nail Art (10 M) - Mani', 'Simple design for a quick, elegant look.', 10, 10, true, 13, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a414', 'Nail Art (10 M) - Pedi', 'Simple design for a quick, elegant look.', 10, 10, true, 14, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a415', 'Nail Art (15 M) - Mani', 'Medium complexity design with added detail.', 15, 15, true, 15, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a416', 'Nail Art (15 M) - Pedi', 'Medium complexity design with added detail.', 15, 15, true, 16, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a417', 'Nail Art (20 M) - Mani', 'Elaborate design with extra detail.', 25, 20, true, 17, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a418', 'Nail Art (20 M) - Pedi', 'Elaborate design with extra detail.', 25, 20, true, 18, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a419', 'Extended Massage - Mani', 'Extend your treatment with 10 more minutes of relaxing massage.', 15, 10, true, 19, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a420', 'Extended Massage - Pedi', 'Extend your treatment with 10 more minutes of relaxing massage.', 15, 10, true, 20, false),
-- Removal add-ons (removal = true) - Converted from services
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421', 'Gel Removal - Mani', 'Gentle gel polish removal for manicure. Leaves nails clean and ready.', 10, 15, true, 21, true),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422', 'Gel Removal - Pedi', 'Gentle gel polish removal for pedicure. Leaves nails clean and ready.', 10, 15, true, 22, true),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423', 'Extensions or Acrylics Removal', 'Safe removal of acrylics or nail extensions.', 20, 25, true, 23, true),
-- New add-ons for Nail Enhancements
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a424', 'Acrylic With Tips M', 'Medium-length acrylic extension upgrade.', 10, 10, true, 24, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a425', 'Acrylic With Tips L', 'Long-length acrylic extension upgrade.', 20, 10, true, 25, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426', '+3 Weeks Refill', 'For moderate regrowth.', 10, 0, true, 26, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427', '+4 Weeks Refill', 'For extended regrowth.', 20, 0, true, 27, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a428', 'Polygel With Tips M', 'Medium-length Polygel extension upgrade.', 10, 20, true, 28, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a429', 'Polygel With Tips L', 'Long-length Polygel extension upgrade.', 20, 20, true, 29, false),
-- Combo-specific Cat Eye and Chrome (Mani/Pedi variants)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430', 'Cat Eye Finish - Mani', 'Unique magnetic gel polish creates a "cat eye" effect for a stunning, reflective finish.', 25, 20, true, 30, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a431', 'Cat Eye Finish - Pedi', 'Unique magnetic gel polish creates a "cat eye" effect for a stunning, reflective finish.', 25, 20, true, 31, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432', 'Chrome Finish - Mani', 'A mirror-like chrome layer for a reflective, metallic look - inspired by the Glazed Donut manicure trend.', 10, 20, true, 32, false),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a433', 'Chrome Finish - Pedi', 'A mirror-like chrome layer for a reflective, metallic look - inspired by the Glazed Donut manicure trend.', 10, 20, true, 33, false),
-- Builder Gel / BIAB Removal add-ons
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434', 'Builder Gel / BIAB Removal - Mani', 'Safe removal of builder gel or BIAB for manicure. Leaves nails clean and ready.', 15, 15, true, 34, true),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435', 'Builder Gel / BIAB Removal - Pedi', 'Safe removal of builder gel or BIAB for pedicure. Leaves nails clean and ready.', 15, 15, true, 35, true);

-- =====================================================
-- INSERT STAFF - 5 technicians
-- workingDays: Mon, Tue, Wed, Thu, Fri, Sat, Sun
-- =====================================================

INSERT INTO staff (id, "firstName", "lastName", email, phone, role, status, "isBookable", "workingDays", shifts) VALUES
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', 'Isabella', 'Martinez', 'isabella.martinez@nailsandco.com', '+1-555-0101', 'TECHNICIAN', 'ACTIVE', true, ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], '[{"shiftStart": "09:00", "shiftEnd": "12:00"}, {"shiftStart": "13:00", "shiftEnd": "19:00"}]'),
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'Camila', 'Rodriguez', 'camila.rodriguez@nailsandco.com', '+1-555-0102', 'TECHNICIAN', 'ACTIVE', true, ARRAY['Tue', 'Wed', 'Thu', 'Fri', 'Sat'], '[{"shiftStart": "09:00", "shiftEnd": "12:00"}, {"shiftStart": "13:00", "shiftEnd": "19:00"}]'),
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', 'Sofia', 'Hernandez', 'sofia.hernandez@nailsandco.com', '+1-555-0103', 'TECHNICIAN', 'ACTIVE', true, ARRAY['Mon', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], '[{"shiftStart": "09:00", "shiftEnd": "12:00"}, {"shiftStart": "13:00", "shiftEnd": "19:00"}]'),
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', 'Valentina', 'Garcia', 'valentina.garcia@nailsandco.com', '+1-555-0104', 'TECHNICIAN', 'ACTIVE', true, ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], '[{"shiftStart": "10:00", "shiftEnd": "18:00"}]'),
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'Luna', 'Torres', 'luna.torres@nailsandco.com', '+1-555-0105', 'TECHNICIAN', 'ACTIVE', true, ARRAY['Wed', 'Thu', 'Fri', 'Sat', 'Sun'], '[{"shiftStart": "09:00", "shiftEnd": "13:00"}, {"shiftStart": "14:00", "shiftEnd": "19:00"}]');

-- =====================================================
-- INSERT USERS - Admin and staff users
-- =====================================================
-- Passwords: admin123, manager123, recep123, staff123

INSERT INTO users (id, username, email, password, role, name) VALUES
('30c1d2e3-f4a5-48b6-c7d8-e9f0a1b2c300', 'admin', 'admin@nailsandco.com', '$2b$12$HeieMgObokMTJ33uxz/F5OMqQyaMWgvjN64xSdh0/SBR3aMSd.D76', 'admin', 'Admin User'),
('30c1d2e3-f4a5-48b6-c7d8-e9f0a1b2c301', 'isabella.martinez', 'isabella.martinez@nailsandco.com', '$2b$12$al6WI4zyoKg2IPGivG6yBu90ww0OVCNktW7a7g6Vx.LQJezT/GfQO', 'staff', 'Isabella Martinez'),
('30c1d2e3-f4a5-48b6-c7d8-e9f0a1b2c302', 'camila.rodriguez', 'camila.rodriguez@nailsandco.com', '$2b$12$al6WI4zyoKg2IPGivG6yBu90ww0OVCNktW7a7g6Vx.LQJezT/GfQO', 'staff', 'Camila Rodriguez'),
('30c1d2e3-f4a5-48b6-c7d8-e9f0a1b2c303', 'sofia.hernandez', 'sofia.hernandez@nailsandco.com', '$2b$12$al6WI4zyoKg2IPGivG6yBu90ww0OVCNktW7a7g6Vx.LQJezT/GfQO', 'staff', 'Sofia Hernandez'),
('30c1d2e3-f4a5-48b6-c7d8-e9f0a1b2c304', 'valentina.garcia', 'valentina.garcia@nailsandco.com', '$2b$12$al6WI4zyoKg2IPGivG6yBu90ww0OVCNktW7a7g6Vx.LQJezT/GfQO', 'staff', 'Valentina Garcia'),
('30c1d2e3-f4a5-48b6-c7d8-e9f0a1b2c305', 'luna.torres', 'luna.torres@nailsandco.com', '$2b$12$al6WI4zyoKg2IPGivG6yBu90ww0OVCNktW7a7g6Vx.LQJezT/GfQO', 'staff', 'Luna Torres');

-- =====================================================
-- INSERT SERVICE_ADDONS - Relations between services and add-ons
-- =====================================================

INSERT INTO service_addons (service_id, addon_id) VALUES

-- ============== MANICURE CATEGORY ==============

-- 1. BASIC MANICURE (a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501)
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- 2. GEL BASIC MANICURE (a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502)
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409'),  -- Fix Nail

-- 3. PREMIUM N&CO BASIC MANICURE (a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503)
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- 4. PREMIUM N&CO GEL MANICURE (a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504)
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409'),  -- Fix Nail

-- 5. RUBBER BASE / CAPPING (a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505)
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409'),  -- Fix Nail

-- 6. REGULAR POLISH CHANGE (MANI) (a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506) - Extended Massage ONLY
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- 7. GEL POLISH CHANGE (MANI) (a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507) - Extended Massage ONLY
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- ============== NAIL ENHANCEMENTS CATEGORY ==============

-- 1. APRES GEL-X WITH GEL POLISH (b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601)
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410'),  -- Fix Nail Extension

-- 2. APRES GEL-X WITHOUT GEL POLISH (b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602) - Extended Massage + Fix Nail Extension ONLY
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410'),  -- Fix Nail Extension

-- 3. ACRYLIC FULL SET (b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603)
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a401'),  -- Additional Gel Polish
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410'),  -- Fix Nail Extension
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a424'),  -- Acrylic With Tips M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a425'),  -- Acrylic With Tips L

-- 4. ACRYLIC REFILL (b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604)
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a401'),  -- Additional Gel Polish
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410'),  -- Fix Nail Extension
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426'),  -- +3 Weeks Refill
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427'),  -- +4 Weeks Refill

-- 5. POLYGEL FULL SET (b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605)
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a401'),  -- Additional Gel Polish
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410'),  -- Fix Nail Extension
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a428'),  -- Polygel With Tips M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a429'),  -- Polygel With Tips L

-- 6. POLYGEL REFILL (b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606)
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a401'),  -- Additional Gel Polish
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410'),  -- Fix Nail Extension
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426'),  -- +3 Weeks Refill
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427'),  -- +4 Weeks Refill

-- ============== PEDICURE CATEGORY ==============
-- Main services: French Design + Nail Art 10M/15M/20M (mutually exclusive) + Extended Massage
-- Polish changes: Extended Massage ONLY

-- 1. BASIC SPA PEDICURE (c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- 2. GEL BASIC PEDICURE (c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye Finish
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome Finish

-- 3. PREMIUM N&CO SPA PEDICURE (c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- 4. PREMIUM N&CO SPA GEL PEDICURE (c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye Finish
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome Finish

-- 5. GLAM PEDI IN A BOX PEDICURE (c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- 6. GLAM PEDI IN A BOX GEL PEDICURE (c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706)
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art 10M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art 15M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art 20M
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye Finish
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome Finish

-- 7. REGULAR POLISH CHANGE (PEDI) (c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d707) - Extended Massage ONLY
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d707', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- 8. GEL POLISH CHANGE (PEDI) (c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708) - Extended Massage ONLY
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- ============== KIDS CATEGORY ==============
-- 1. BASIC MANICURE KIDS (d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art (10 M)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art (15 M)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art (20 M)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- 2. GEL MANICURE KIDS (d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403'),  -- Cat Eye Finish
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404'),  -- Chrome Finish
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art (10 M)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art (15 M)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art (20 M)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- 3. BASIC PEDICURE KIDS (d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e803)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e803', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402'),  -- French Design
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e803', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405'),  -- Nail Art (10 M)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e803', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406'),  -- Nail Art (15 M)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e803', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407'),  -- Nail Art (20 M)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e803', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408'),  -- Extended Massage

-- ============== COMBOS CATEGORY ==============
-- Combos include Mani+Pedi services, so add-ons are separated with (Mani)/(Pedi) suffixes
-- Nail Arts with same suffix are mutually exclusive (handled in frontend)

-- 1. REGULAR PACK (e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901) - Basic Mani + Basic Spa Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a411'),  -- French Design (Mani)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a412'),  -- French Design (Pedi)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a413'),  -- Nail Art (10 M) - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a414'),  -- Nail Art (10 M) - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a415'),  -- Nail Art (15 M) - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a416'),  -- Nail Art (15 M) - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a417'),  -- Nail Art (20 M) - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a418'),  -- Nail Art (20 M) - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a419'),  -- Extended Massage (Mani)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a420'),  -- Extended Massage (Pedi)

-- 2. PERFECT PAIR (e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902) - Gel Basic Mani + Basic Spa Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a411'),  -- French Design (Mani)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a412'),  -- French Design (Pedi)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430'),  -- Cat Eye Finish - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432'),  -- Chrome Finish - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a413'),  -- Nail Art (10 M) - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a414'),  -- Nail Art (10 M) - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a415'),  -- Nail Art (15 M) - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a416'),  -- Nail Art (15 M) - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a417'),  -- Nail Art (20 M) - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a418'),  -- Nail Art (20 M) - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a419'),  -- Extended Massage (Mani)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a420'),  -- Extended Massage (Pedi)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409'),  -- Fix Nail

-- 3. GEL GLAM (e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903) - Gel Basic Mani + Gel Basic Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a411'),  -- French Design (Mani)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a412'),  -- French Design (Pedi)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430'),  -- Cat Eye Finish - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a431'),  -- Cat Eye Finish - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432'),  -- Chrome Finish - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a433'),  -- Chrome Finish - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a413'),  -- Nail Art (10 M) - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a414'),  -- Nail Art (10 M) - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a415'),  -- Nail Art (15 M) - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a416'),  -- Nail Art (15 M) - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a417'),  -- Nail Art (20 M) - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a418'),  -- Nail Art (20 M) - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a419'),  -- Extended Massage (Mani)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a420'),  -- Extended Massage (Pedi)
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409');  -- Fix Nail

-- =====================================================
-- INSERT REMOVAL ADD-ONS - Assign removal add-ons to all Manicure and Pedicure services
-- =====================================================

-- MANICURE SERVICES - Add Gel Removal Mani + Extensions Removal
INSERT INTO service_addons (service_id, addon_id) VALUES
-- All Manicure services get these removal add-ons
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Basic Manicure → Gel Removal Mani
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Basic Manicure → Extensions Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Basic Manicure → Builder Gel/BIAB Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Gel Basic Manicure → Gel Removal Mani
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Gel Basic Manicure → Extensions Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Gel Basic Manicure → Builder Gel/BIAB Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Premium N&Co Basic Manicure → Gel Removal Mani
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Premium N&Co Basic Manicure → Extensions Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Premium N&Co Basic Manicure → Builder Gel/BIAB Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Premium N&Co Gel Manicure → Gel Removal Mani
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Premium N&Co Gel Manicure → Extensions Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Premium N&Co Gel Manicure → Builder Gel/BIAB Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Builder Gel/BIAB → Gel Removal Mani
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Builder Gel/BIAB → Extensions Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Builder Gel/BIAB → Builder Gel/BIAB Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Express Mani - Polish → Gel Removal Mani
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Express Mani - Polish → Extensions Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Express Mani - Polish → Builder Gel/BIAB Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Express Mani - Gel → Gel Removal Mani
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Express Mani - Gel → Extensions Removal
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434');  -- Express Mani - Gel → Builder Gel/BIAB Removal

-- PEDICURE SERVICES - Add Gel Removal Pedi ONLY (Extensions Removal is Manicure-only)
INSERT INTO service_addons (service_id, addon_id) VALUES
-- All Pedicure services get Gel Removal Pedi only
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Basic Spa Pedicure → Gel Removal Pedi
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Basic Spa Pedicure → Builder Gel/BIAB Removal
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Gel Basic Pedicure → Gel Removal Pedi
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Gel Basic Pedicure → Builder Gel/BIAB Removal
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Premium N&Co Spa Pedicure → Gel Removal Pedi
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Premium N&Co Spa Pedicure → Builder Gel/BIAB Removal
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Premium N&Co Spa Gel Pedicure → Gel Removal Pedi
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Premium N&Co Spa Gel Pedicure → Builder Gel/BIAB Removal
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Glam Pedi Box Pedicure → Gel Removal Pedi
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Glam Pedi Box Pedicure → Builder Gel/BIAB Removal
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Glam Pedi Box Gel Pedicure → Gel Removal Pedi
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Glam Pedi Box Gel Pedicure → Builder Gel/BIAB Removal
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d707', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Express Pedi - Polish → Gel Removal Pedi
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d707', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Express Pedi - Polish → Builder Gel/BIAB Removal
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Express Pedi - Gel → Gel Removal Pedi
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435');  -- Express Pedi - Gel → Builder Gel/BIAB Removal

-- NAIL ENHANCEMENT SERVICES - Add Gel Removal Mani + Extensions Removal
INSERT INTO service_addons (service_id, addon_id) VALUES
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Aprés Gel-X With Gel Polish → Gel Removal Mani
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Aprés Gel-X With Gel Polish → Extensions Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Aprés Gel-X With Gel Polish → Builder Gel/BIAB Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Aprés Gel-X Without Gel Polish → Gel Removal Mani
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Aprés Gel-X Without Gel Polish → Extensions Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Aprés Gel-X Without Gel Polish → Builder Gel/BIAB Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Full Set Acrylic → Gel Removal Mani
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Full Set Acrylic → Extensions Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Full Set Acrylic → Builder Gel/BIAB Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Refill Acrylic → Gel Removal Mani
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Refill Acrylic → Extensions Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Refill Acrylic → Builder Gel/BIAB Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Polygel Full Set → Gel Removal Mani
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Polygel Full Set → Extensions Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Polygel Full Set → Builder Gel/BIAB Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Polygel Refill → Gel Removal Mani
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Polygel Refill → Extensions Removal
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434');  -- Polygel Refill → Builder Gel/BIAB Removal

-- COMBO SERVICES - Add Gel Removal Mani + Gel Removal Pedi + Extensions Removal
INSERT INTO service_addons (service_id, addon_id) VALUES
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Regular Pack → Gel Removal Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Regular Pack → Gel Removal Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Regular Pack → Extensions Removal
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Regular Pack → Builder Gel/BIAB Removal - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Regular Pack → Builder Gel/BIAB Removal - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Perfect Pair → Gel Removal Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Perfect Pair → Gel Removal Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Perfect Pair → Extensions Removal
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Perfect Pair → Builder Gel/BIAB Removal - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435'),  -- Perfect Pair → Builder Gel/BIAB Removal - Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),  -- Gel Glam → Gel Removal Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),  -- Gel Glam → Gel Removal Pedi
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),  -- Gel Glam → Extensions Removal
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),  -- Gel Glam → Builder Gel/BIAB Removal - Mani
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435');  -- Gel Glam → Builder Gel/BIAB Removal - Pedi

-- =====================================================
-- INSERT SERVICE INCOMPATIBILITIES
-- Based on matrix: X = cannot be selected together
-- Manicure ↔ Nail Enhancements, Combo, Removals
-- Nail Enhancements ↔ Manicure, Combo, Removals
-- Pedicure ↔ Combo, Removals
-- Combo ↔ Manicure, Nail Enhancements, Pedicure, Removals
-- Removals ↔ Manicure, Nail Enhancements, Pedicure, Combo
-- Kids: no cross-category incompatibilities
-- NOTE: Manicure+Pedicure ARE compatible (hands+feet OK)
-- NOTE: Nail Enhancements+Pedicure ARE compatible (nails+feet OK)
-- =====================================================
INSERT INTO service_incompatibilities (category_id, incompatible_category_id) VALUES
-- Manicure row
('c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'), -- Manicure → Nail Enhancements
('c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b'), -- Manicure → Combos
('c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c'), -- Manicure → Removals
-- Nail Enhancements row
('c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'), -- Nail Enhancements → Manicure
('c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b'), -- Nail Enhancements → Combos
('c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c'), -- Nail Enhancements → Removals
-- Pedicure row
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b'), -- Pedicure → Combos
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c'), -- Pedicure → Removals
-- Combos row
('c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'), -- Combos → Manicure
('c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'), -- Combos → Nail Enhancements
('c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'), -- Combos → Pedicure
('c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c'), -- Combos → Removals
-- Removals row
('c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'), -- Removals → Manicure
('c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'), -- Removals → Nail Enhancements
('c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'), -- Removals → Pedicure
('c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b'); -- Removals → Combos

-- =====================================================
-- INSERT REMOVAL_STEP - Categorías que requieren paso de removal
-- =====================================================
-- Categorías que necesitan mostrar el paso de removal

INSERT INTO removal_step (category_id) VALUES
('c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),  -- Manicure
('c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'),  -- Nail Enhancements
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'),  -- Pedicure
('c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b');  -- Combos

-- =====================================================
-- INSERT ADDON_INCOMPATIBILITIES - Add-ons incompatibles entre sí
-- =====================================================
-- SOLO Gel Removal - Mani es incompatible con Extensions/Rubber/Acrylic Removal
-- Las incompatibilidades son bidireccionales (necesitamos ambas direcciones)

INSERT INTO addon_incompatibilities (addon_id, incompatible_addon_id) VALUES
-- Gel Removal (Mani) ↔ Extensions / Rubber / Acrylic Removal (bidirectional)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),
-- Acrylic With Tips M ↔ Acrylic With Tips L (bidirectional)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a424', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a425'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a425', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a424'),
-- +3 Weeks Refill ↔ +4 Weeks Refill (bidirectional)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426'),
-- Polygel With Tips M ↔ Polygel With Tips L (bidirectional)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a428', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a429'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a429', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a428'),
-- Builder Gel/BIAB Removal - Mani ↔ Gel Removal - Mani (bidirectional)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),
-- Builder Gel/BIAB Removal - Mani ↔ Extensions or Acrylics Removal (bidirectional)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434'),
-- Builder Gel/BIAB Removal - Pedi ↔ Gel Removal - Pedi (bidirectional)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422', '10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435');

-- =====================================================
-- INSERT CUSTOMERS - Sample customers
-- =====================================================

INSERT INTO customers (id, tenant_id, "firstName", "lastName", email, phone, "birthDate", notes) VALUES
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'nailsandco', 'Emma', 'Johnson', 'emma.johnson@email.com', '+1-555-1001', '1990-03-15', 'Prefers gel manicures'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'nailsandco', 'Olivia', 'Williams', 'olivia.williams@email.com', '+1-555-1002', '1985-07-22', 'Regular customer'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'nailsandco', 'Ava', 'Brown', 'ava.brown@email.com', '+1-555-1003', '1992-11-08', 'Loves nail art'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'nailsandco', 'Sophia', 'Davis', 'sophia.davis@email.com', '+1-555-1004', '1988-05-30', 'Prefers Camila'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'nailsandco', 'Mia', 'Miller', 'mia.miller@email.com', '+1-555-1005', '1995-09-12', 'Sensitive skin'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'nailsandco', 'Charlotte', 'Wilson', 'charlotte.wilson@email.com', '+1-555-1006', '1987-02-18', 'VIP client'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'nailsandco', 'Amelia', 'Moore', 'amelia.moore@email.com', '+1-555-1007', '1993-06-25', 'Prefers morning appointments'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'nailsandco', 'Harper', 'Taylor', 'harper.taylor@email.com', '+1-555-1008', '1991-12-03', 'Likes pedicures'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'nailsandco', 'Evelyn', 'Anderson', 'evelyn.anderson@email.com', '+1-555-1009', '1989-04-17', 'Regular customer'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'nailsandco', 'Abigail', 'Thomas', 'abigail.thomas@email.com', '+1-555-1010', '1994-08-20', 'Prefers acrylic'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'nailsandco', 'Emily', 'Jackson', 'emily.jackson@email.com', '+1-555-1011', '1986-10-14', 'Nail art enthusiast'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'nailsandco', 'Elizabeth', 'White', 'elizabeth.white@email.com', '+1-555-1012', '1990-01-28', 'Combo packages'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'nailsandco', 'Ella', 'Harris', 'ella.harris@email.com', '+1-555-1013', '1992-03-09', 'Gel-X extensions'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'nailsandco', 'Scarlett', 'Martin', 'scarlett.martin@email.com', '+1-555-1014', '1988-07-11', 'Prefers Luna'),
('40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'nailsandco', 'Grace', 'Thompson', 'grace.thompson@email.com', '+1-555-1015', '1996-05-05', 'New customer');

-- =====================================================
-- INSERT BOOKINGS - Sample Data (Baseline: January 11, 2026 = TODAY)
-- =====================================================
-- Test data for booking system validation
-- PAST bookings (Dec 28, 2025 - Jan 10, 2026): status='completed' with payment methods
-- FUTURE bookings (Jan 12-25, 2026): status='pending' or 'in_progress'
-- Staff IDs:
-- Isabella Martinez: 20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301 (Manicure specialist, Works: Mon-Sat)
-- Camila Rodriguez: 20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302 (Extensions, Works: Tue-Sat)
-- Sofia Hernandez:   20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303 (Pedicure specialist, Works: Mon,Wed-Sun)
-- Valentina Garcia:  20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304 (Kids specialist, Works: Mon-Fri)
-- Luna Torres:       20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305 (All-around, Works: Wed-Sun)


-- ============ PAST BOOKINGS (COMPLETED) ============

-- ========== DAY -14: December 28, 2025 (Saturday) - 2 weeks ago ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 9am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a401', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-28', '2025-12-28 09:00:00-05', '2025-12-28 09:45:00-05', 'completed', 'CARD', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-28', '2025-12-28 09:00:00-05', '2025-12-28 10:15:00-05', 'completed', 'CASH', 60, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-28', '2025-12-28 09:00:00-05', '2025-12-28 10:35:00-05', 'completed', 'CARD', 80, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-28', '2025-12-28 09:00:00-05', '2025-12-28 09:55:00-05', 'completed', 'CASH', 50, NULL, false),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a548', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-28', '2025-12-28 09:00:00-05', '2025-12-28 09:40:00-05', 'completed', 'CARD', 13, NULL, true),
-- 11am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a550', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-28', '2025-12-28 11:00:00-05', '2025-12-28 11:55:00-05', 'completed', 'CASH', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a551', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-28', '2025-12-28 11:00:00-05', '2025-12-28 12:45:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a552', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-28', '2025-12-28 11:00:00-05', '2025-12-28 12:00:00-05', 'completed', 'CASH', 50, NULL, false),
-- 2pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a553', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-28', '2025-12-28 14:00:00-05', '2025-12-28 15:35:00-05', 'completed', 'CARD', 55, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a554', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-28', '2025-12-28 14:00:00-05', '2025-12-28 14:55:00-05', 'completed', 'CASH', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a555', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-28', '2025-12-28 14:00:00-05', '2025-12-28 15:15:00-05', 'completed', 'CARD', 70, NULL, true),
-- 4pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a556', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-28', '2025-12-28 16:00:00-05', '2025-12-28 16:40:00-05', 'completed', 'CASH', 20, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a557', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-28', '2025-12-28 16:00:00-05', '2025-12-28 17:45:00-05', 'completed', 'CARD', 50, NULL, true);

-- ========== DAY -13: December 29, 2025 (Sunday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 10am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-29', '2025-12-29 10:00:00-05', '2025-12-29 11:00:00-05', 'completed', 'CARD', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-29', '2025-12-29 10:00:00-05', '2025-12-29 10:45:00-05', 'completed', 'CASH', 40, NULL, true),
-- 12pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a560', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-29', '2025-12-29 12:00:00-05', '2025-12-29 13:35:00-05', 'completed', 'CARD', 80, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a561', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-29', '2025-12-29 12:00:00-05', '2025-12-29 12:55:00-05', 'completed', 'CASH', 50, NULL, true),
-- 3pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a562', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-29', '2025-12-29 15:00:00-05', '2025-12-29 15:40:00-05', 'completed', 'CARD', 13, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a563', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-29', '2025-12-29 15:00:00-05', '2025-12-29 16:15:00-05', 'completed', 'CASH', 60, NULL, false);

-- ========== DAY -12: December 30, 2025 (Monday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 9am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-30', '2025-12-30 09:00:00-05', '2025-12-30 09:55:00-05', 'completed', 'CARD', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-30', '2025-12-30 09:00:00-05', '2025-12-30 10:15:00-05', 'completed', 'CASH', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-30', '2025-12-30 09:00:00-05', '2025-12-30 09:40:00-05', 'completed', 'CARD', 13, NULL, false),
-- 11am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a570', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-30', '2025-12-30 11:00:00-05', '2025-12-30 12:45:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a571', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-30', '2025-12-30 11:00:00-05', '2025-12-30 11:45:00-05', 'completed', 'CASH', 40, NULL, true),
-- 2pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a572', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-30', '2025-12-30 14:00:00-05', '2025-12-30 15:35:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a573', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-30', '2025-12-30 14:00:00-05', '2025-12-30 15:00:00-05', 'completed', 'CASH', 50, NULL, false),
-- 5pm slot
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a574', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-30', '2025-12-30 17:00:00-05', '2025-12-30 17:55:00-05', 'completed', 'CARD', 40, NULL, true);

-- ========== DAY -11: December 31, 2025 (Tuesday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-31', '2025-12-31 09:00:00-05', '2025-12-31 09:45:00-05', 'completed', 'CASH', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a411', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-31', '2025-12-31 09:00:00-05', '2025-12-31 10:45:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a412', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-31', '2025-12-31 09:00:00-05', '2025-12-31 10:00:00-05', 'completed', 'CASH', 50, 'New Year prep', true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-31', '2025-12-31 09:00:00-05', '2025-12-31 09:40:00-05', 'completed', 'CARD', 20, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a564', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-31', '2025-12-31 10:00:00-05', '2025-12-31 10:55:00-05', 'completed', 'CASH', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a565', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-31', '2025-12-31 11:00:00-05', '2025-12-31 12:15:00-05', 'completed', 'CARD', 60, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a566', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-31', '2025-12-31 11:00:00-05', '2025-12-31 12:35:00-05', 'completed', 'CASH', 90, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a567', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-31', '2025-12-31 12:00:00-05', '2025-12-31 13:35:00-05', 'completed', 'CARD', 80, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a568', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-31', '2025-12-31 13:00:00-05', '2025-12-31 13:45:00-05', 'completed', 'CASH', 40, NULL, true);

-- ========== DAY -10: January 1, 2026 (Wednesday) - New Year's Day ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a413', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-01', '2026-01-01 11:00:00-05', '2026-01-01 11:55:00-05', 'completed', 'CARD', 40, 'Holiday booking', true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a569', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-01', '2026-01-01 11:00:00-05', '2026-01-01 12:00:00-05', 'completed', 'CASH', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a622', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-01', '2026-01-01 13:00:00-05', '2026-01-01 14:45:00-05', 'completed', 'CARD', 50, NULL, true),
('f96eaa9c-6e4c-4ed1-b1b7-49126ac55d17', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-01', '2026-01-01 13:00:00-05', '2026-01-01 13:45:00-05', 'completed', 'CASH', 40, NULL, true),
('3810fb78-321c-4467-81c8-bb3da5a0fb51', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-01', '2026-01-01 14:00:00-05', '2026-01-01 14:40:00-05', 'completed', 'CARD', 13, NULL, true),
('491c8a00-319e-4d92-8615-c8133f78ed1b', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-01', '2026-01-01 15:00:00-05', '2026-01-01 16:15:00-05', 'completed', 'CASH', 70, NULL, true);

-- ========== DAY -9: January 2, 2026 (Thursday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 10am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a414', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-02', '2026-01-02 10:00:00-05', '2026-01-02 10:45:00-05', 'completed', 'CASH', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a415', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-02', '2026-01-02 10:00:00-05', '2026-01-02 11:45:00-05', 'completed', 'CARD', 50, 'Acrylic refill', true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a416', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-02', '2026-01-02 10:00:00-05', '2026-01-02 11:15:00-05', 'completed', 'CASH', 60, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a417', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-02', '2026-01-02 10:00:00-05', '2026-01-02 10:40:00-05', 'completed', 'CARD', 20, NULL, true),
-- 1pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a575', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-02', '2026-01-02 13:00:00-05', '2026-01-02 13:55:00-05', 'completed', 'CASH', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a576', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-02', '2026-01-02 13:00:00-05', '2026-01-02 14:35:00-05', 'completed', 'CARD', 70, NULL, true),
-- 4pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a577', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-02', '2026-01-02 16:00:00-05', '2026-01-02 17:00:00-05', 'completed', 'CASH', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a578', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-02', '2026-01-02 16:00:00-05', '2026-01-02 17:45:00-05', 'completed', 'CARD', 70, NULL, true);

-- ========== DAY -8: January 3, 2026 (Friday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 9am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a418', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-03', '2026-01-03 09:00:00-05', '2026-01-03 09:55:00-05', 'completed', 'CASH', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a419', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-03', '2026-01-03 09:00:00-05', '2026-01-03 10:35:00-05', 'completed', 'CARD', 80, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a420', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-03', '2026-01-03 09:00:00-05', '2026-01-03 10:15:00-05', 'completed', 'CASH', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-03', '2026-01-03 09:00:00-05', '2026-01-03 09:40:00-05', 'completed', 'CARD', 13, NULL, false),
-- 11:30am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a579', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-03', '2026-01-03 11:30:00-05', '2026-01-03 12:15:00-05', 'completed', 'CASH', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a580', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-03', '2026-01-03 11:30:00-05', '2026-01-03 12:45:00-05', 'completed', 'CARD', 60, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a581', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-03', '2026-01-03 11:30:00-05', '2026-01-03 13:05:00-05', 'completed', 'CASH', 90, NULL, true),
-- 3pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a582', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-03', '2026-01-03 15:00:00-05', '2026-01-03 16:45:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a583', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-03', '2026-01-03 15:00:00-05', '2026-01-03 15:55:00-05', 'completed', 'CASH', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a584', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-03', '2026-01-03 15:00:00-05', '2026-01-03 16:00:00-05', 'completed', 'CARD', 50, NULL, true);

-- ========== DAY -7: January 4, 2026 (Saturday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 9am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-04', '2026-01-04 09:00:00-05', '2026-01-04 09:45:00-05', 'completed', 'CASH', 40, NULL, false),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3-a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-04', '2026-01-04 09:00:00-05', '2026-01-04 10:45:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a424', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-04', '2026-01-04 09:00:00-05', '2026-01-04 10:00:00-05', 'completed', 'CASH', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a425', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-04', '2026-01-04 09:00:00-05', '2026-01-04 10:35:00-05', 'completed', 'CARD', 55, 'Regular Pack combo', false),
-- 11am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a607', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-04', '2026-01-04 11:00:00-05', '2026-01-04 11:55:00-05', 'completed', 'CASH', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a608', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-04', '2026-01-04 11:00:00-05', '2026-01-04 12:15:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a609', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-04', '2026-01-04 11:00:00-05', '2026-01-04 11:40:00-05', 'completed', 'CASH', 13, NULL, true),
-- 2pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a610', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-04', '2026-01-04 14:00:00-05', '2026-01-04 15:45:00-05', 'completed', 'CARD', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a611', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-04', '2026-01-04 14:00:00-05', '2026-01-04 15:35:00-05', 'completed', 'CASH', 90, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a612', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-04', '2026-01-04 14:00:00-05', '2026-01-04 14:55:00-05', 'completed', 'CARD', 50, NULL, true),
-- 5pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a613', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-04', '2026-01-04 17:00:00-05', '2026-01-04 18:00:00-05', 'completed', 'CASH', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a614', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-04', '2026-01-04 17:00:00-05', '2026-01-04 18:35:00-05', 'completed', 'CARD', 80, NULL, true);

-- ========== DAY -6: January 5, 2026 (Sunday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 10am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-05', '2026-01-05 10:00:00-05', '2026-01-05 11:15:00-05', 'completed', 'CASH', 60, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-05', '2026-01-05 10:00:00-05', '2026-01-05 10:45:00-05', 'completed', 'CARD', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a585', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-05', '2026-01-05 10:00:00-05', '2026-01-05 11:35:00-05', 'completed', 'CASH', 80, NULL, true),
-- 1pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a586', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-05', '2026-01-05 13:00:00-05', '2026-01-05 14:35:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a587', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-05', '2026-01-05 13:00:00-05', '2026-01-05 13:55:00-05', 'completed', 'CASH', 50, NULL, true),
-- 4pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a588', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-05', '2026-01-05 16:00:00-05', '2026-01-05 17:00:00-05', 'completed', 'CARD', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a589', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-05', '2026-01-05 16:00:00-05', '2026-01-05 16:40:00-05', 'completed', 'CASH', 13, NULL, true);

-- ========== DAY -5: January 6, 2026 (Monday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 9am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a428', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-06', '2026-01-06 09:00:00-05', '2026-01-06 09:55:00-05', 'completed', 'CASH', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a429', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-06', '2026-01-06 09:00:00-05', '2026-01-06 10:00:00-05', 'completed', 'CARD', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-06', '2026-01-06 09:00:00-05', '2026-01-06 09:40:00-05', 'completed', 'CASH', 13, NULL, false),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a590', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-06', '2026-01-06 09:00:00-05', '2026-01-06 10:45:00-05', 'completed', 'CARD', 70, NULL, true),
-- 12pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a591', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-06', '2026-01-06 12:00:00-05', '2026-01-06 12:45:00-05', 'completed', 'CASH', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a592', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-06', '2026-01-06 12:00:00-05', '2026-01-06 13:15:00-05', 'completed', 'CARD', 60, NULL, true),
-- 3pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a593', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-06', '2026-01-06 15:00:00-05', '2026-01-06 16:35:00-05', 'completed', 'CASH', 55, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a594', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-06', '2026-01-06 15:00:00-05', '2026-01-06 16:45:00-05', 'completed', 'CARD', 50, NULL, true);

-- ========== DAY -4: January 7, 2026 (Tuesday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 9am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a431', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-07', '2026-01-07 09:00:00-05', '2026-01-07 09:45:00-05', 'completed', 'CARD', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-07', '2026-01-07 09:00:00-05', '2026-01-07 10:45:00-05', 'completed', 'CASH', 55, 'Polygel refill', true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a433', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-07', '2026-01-07 09:00:00-05', '2026-01-07 10:15:00-05', 'completed', 'CARD', 70, NULL, true),
-- 12pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a595', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-07', '2026-01-07 12:00:00-05', '2026-01-07 12:40:00-05', 'completed', 'CASH', 20, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a596', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-07', '2026-01-07 12:00:00-05', '2026-01-07 12:55:00-05', 'completed', 'CARD', 40, NULL, true),
-- 4pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a597', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-07', '2026-01-07 16:00:00-05', '2026-01-07 17:35:00-05', 'completed', 'CASH', 90, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a598', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-07', '2026-01-07 16:00:00-05', '2026-01-07 17:00:00-05', 'completed', 'CARD', 50, NULL, true);

-- ========== DAY -3: January 8, 2026 (Wednesday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 9am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-08', '2026-01-08 09:00:00-05', '2026-01-08 09:55:00-05', 'completed', 'CASH', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-08', '2026-01-08 09:00:00-05', '2026-01-08 10:00:00-05', 'completed', 'CARD', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a436', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-08', '2026-01-08 09:00:00-05', '2026-01-08 10:35:00-05', 'completed', 'CASH', 80, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a599', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-08', '2026-01-08 09:00:00-05', '2026-01-08 09:40:00-05', 'completed', 'CARD', 13, NULL, true),
-- 1pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a600', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-08', '2026-01-08 13:00:00-05', '2026-01-08 13:55:00-05', 'completed', 'CASH', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a601', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-08', '2026-01-08 13:00:00-05', '2026-01-08 14:15:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a602', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-08', '2026-01-08 13:00:00-05', '2026-01-08 14:35:00-05', 'completed', 'CASH', 55, NULL, true);

-- ========== DAY -2: January 9, 2026 (Thursday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
-- 9am slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a437', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-09', '2026-01-09 09:00:00-05', '2026-01-09 09:45:00-05', 'completed', 'CARD', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a438', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-09', '2026-01-09 09:00:00-05', '2026-01-09 10:15:00-05', 'completed', 'CASH', 60, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a439', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-09', '2026-01-09 09:00:00-05', '2026-01-09 10:45:00-05', 'completed', 'CARD', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a440', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-09', '2026-01-09 09:00:00-05', '2026-01-09 09:40:00-05', 'completed', 'CASH', 20, NULL, true),
-- 12pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a603', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-09', '2026-01-09 12:00:00-05', '2026-01-09 12:55:00-05', 'completed', 'CARD', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a604', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-09', '2026-01-09 12:00:00-05', '2026-01-09 13:35:00-05', 'completed', 'CASH', 70, NULL, true),
-- 4pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a605', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-09', '2026-01-09 16:00:00-05', '2026-01-09 17:00:00-05', 'completed', 'CARD', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a606', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-09', '2026-01-09 16:00:00-05', '2026-01-09 17:45:00-05', 'completed', 'CASH', 70, NULL, true);

-- ========== DAY -1: January 10, 2026 (Friday) - Yesterday ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a441', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-10', '2026-01-10 09:00:00-05', '2026-01-10 09:55:00-05', 'completed', 'CARD', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a442', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-10', '2026-01-10 09:00:00-05', '2026-01-10 10:35:00-05', 'completed', 'CASH', 80, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a443', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-10', '2026-01-10 09:00:00-05', '2026-01-10 10:15:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a444', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-10', '2026-01-10 09:00:00-05', '2026-01-10 09:40:00-05', 'completed', 'CASH', 13, NULL, false),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a445', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-10', '2026-01-10 09:00:00-05', '2026-01-10 10:35:00-05', 'completed', 'CARD', 90, 'Gel Glam combo', true),
-- 12pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a615', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-10', '2026-01-10 12:00:00-05', '2026-01-10 12:45:00-05', 'completed', 'CASH', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a616', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-10', '2026-01-10 12:00:00-05', '2026-01-10 13:00:00-05', 'completed', 'CARD', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a617', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-10', '2026-01-10 12:00:00-05', '2026-01-10 13:45:00-05', 'completed', 'CASH', 55, NULL, true),
-- 3:30pm slots
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a618', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-10', '2026-01-10 15:30:00-05', '2026-01-10 17:05:00-05', 'completed', 'CARD', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a619', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-10', '2026-01-10 15:30:00-05', '2026-01-10 16:45:00-05', 'completed', 'CASH', 60, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a620', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-10', '2026-01-10 15:30:00-05', '2026-01-10 16:25:00-05', 'completed', 'CARD', 40, NULL, true);

-- ============ OLD DECEMBER DATA (ARCHIVE) ============
-- December 17, 2025 (Tuesday) - Mix of completed and pending
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-17', '2025-12-17 13:00:00-05', '2025-12-17 13:40:00-05', 'in_progress', NULL, 20, 'Not yet completed', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-17', '2025-12-17 14:30:00-05', '2025-12-17 16:15:00-05', 'completed', 'CASH', 60, NULL, false);

-- December 18, 2025 (Wednesday) - Completed bookings
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-18', '2025-12-18 09:30:00-05', '2025-12-18 10:25:00-05', 'completed', 'CARD', 50, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a411', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-18', '2025-12-18 11:00:00-05', '2025-12-18 12:00:00-05', 'completed', 'CASH', 35, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a412', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-18', '2025-12-18 13:00:00-05', '2025-12-18 14:35:00-05', 'completed', 'CARD', 80, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a413', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-18', '2025-12-18 15:00:00-05', '2025-12-18 15:45:00-05', 'completed', 'CASH', 40, NULL, true);

-- December 19, 2025 (Thursday) - Mix of statuses
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a414', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-19', '2025-12-19 09:00:00-05', '2025-12-19 10:00:00-05', 'completed', 'CARD', 50, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a415', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-19', '2025-12-19 11:00:00-05', '2025-12-19 12:45:00-05', 'completed', 'CASH', 70, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a416', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-19', '2025-12-19 14:00:00-05', '2025-12-19 14:55:00-05', 'in_progress', NULL, 40, 'Confirmed, not completed yet', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a417', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-19', '2025-12-19 15:30:00-05', '2025-12-19 16:10:00-05', 'completed', 'CARD', 13, NULL, true);

-- December 20, 2025 (Friday) - Completed bookings
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a418', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-20', '2025-12-20 09:00:00-05', '2025-12-20 09:45:00-05', 'completed', 'CASH', 40, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a419', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-20', '2025-12-20 10:30:00-05', '2025-12-20 11:45:00-05', 'completed', 'CARD', 70, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a420', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-20', '2025-12-20 13:00:00-05', '2025-12-20 14:45:00-05', 'completed', 'CASH', 50, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-20', '2025-12-20 15:00:00-05', '2025-12-20 15:55:00-05', 'completed', 'CARD', 50, NULL, true);

-- December 21, 2025 (Saturday) - Busy day with more bookings
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-21', '2025-12-21 09:00:00-05', '2025-12-21 10:35:00-05', 'completed', 'CARD', 55, 'Combo service', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-21', '2025-12-21 10:00:00-05', '2025-12-21 11:35:00-05', 'completed', 'CASH', 80, NULL, false),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a424', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-21', '2025-12-21 11:00:00-05', '2025-12-21 12:15:00-05', 'completed', 'CARD', 60, NULL, false),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a425', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-21', '2025-12-21 13:00:00-05', '2025-12-21 13:45:00-05', 'completed', 'CASH', 40, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-21', '2025-12-21 14:00:00-05', '2025-12-21 15:45:00-05', 'completed', 'CARD', 70, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-21', '2025-12-21 15:00:00-05', '2025-12-21 15:55:00-05', 'in_progress', NULL, 40, 'Confirmed for today', false);

-- December 22, 2025 (Sunday) - Today: Mix of pending, confirmed, and a few completed
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a428', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-22', '2025-12-22 09:00:00-05', '2025-12-22 09:45:00-05', 'completed', 'CASH', 40, 'Early morning booking', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a429', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-22', '2025-12-22 10:00:00-05', '2025-12-22 11:00:00-05', 'in_progress', NULL, 50, 'Happening now', false),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-22', '2025-12-22 12:00:00-05', '2025-12-22 13:45:00-05', 'pending', NULL, 60, 'Awaiting confirmation', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a431', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-22', '2025-12-22 14:00:00-05', '2025-12-22 14:55:00-05', 'in_progress', NULL, 50, 'Afternoon booking', true);

-- December 23, 2025 (Monday) - Future bookings with more completed services
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-23', '2025-12-23 09:00:00-05', '2025-12-23 10:35:00-05', 'completed', 'CARD', 80, 'Gel-X extensions', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a433', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-23', '2025-12-23 10:00:00-05', '2025-12-23 11:15:00-05', 'completed', 'CASH', 60, 'Premium gel pedicure', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-23', '2025-12-23 11:30:00-05', '2025-12-23 12:25:00-05', 'completed', 'CARD', 50, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-23', '2025-12-23 13:00:00-05', '2025-12-23 14:35:00-05', 'completed', 'CARD', 90, 'Gel Glam combo', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a436', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-23', '2025-12-23 14:30:00-05', '2025-12-23 16:15:00-05', 'completed', 'CASH', 70, 'Polygel full set', false),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a437', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-23', '2025-12-23 15:00:00-05', '2025-12-23 15:45:00-05', 'completed', 'CARD', 40, NULL, true);

-- December 24, 2025 (Tuesday) - Christmas Eve with good business
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a438', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-24', '2025-12-24 09:00:00-05', '2025-12-24 10:15:00-05', 'completed', 'CARD', 70, 'Holiday glamour', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a439', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-24', '2025-12-24 10:00:00-05', '2025-12-24 11:35:00-05', 'completed', 'CASH', 80, 'Christmas prep', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a440', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-24', '2025-12-24 11:00:00-05', '2025-12-24 11:55:00-05', 'completed', 'CARD', 50, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a441', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-24', '2025-12-24 12:00:00-05', '2025-12-24 13:35:00-05', 'completed', 'CARD', 70, 'Perfect Pair combo', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a442', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-24', '2025-12-24 13:00:00-05', '2025-12-24 14:00:00-05', 'completed', 'CASH', 50, NULL, true);

-- December 25, 2025 (Wednesday) - Christmas Day: Closed / Confirmed only
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a443', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-25', '2025-12-25 14:00:00-05', '2025-12-25 14:45:00-05', 'pending', NULL, 40, 'Christmas day - special booking', true);

-- December 26, 2025 (Thursday) - Boxing Day busy
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a444', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-26', '2025-12-26 09:00:00-05', '2025-12-26 10:45:00-05', 'completed', 'CARD', 50, 'Acrylic refill', true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a445', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-26', '2025-12-26 10:00:00-05', '2025-12-26 11:15:00-05', 'completed', 'CASH', 60, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a446', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-26', '2025-12-26 11:30:00-05', '2025-12-26 12:15:00-05', 'completed', 'CARD', 40, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a447', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-26', '2025-12-26 13:00:00-05', '2025-12-26 14:35:00-05', 'completed', 'CARD', 80, NULL, true),
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a448', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-26', '2025-12-26 14:30:00-05', '2025-12-26 15:25:00-05', 'completed', 'CASH', 50, NULL, true);

-- December 27, 2025 (Friday) - Weekend prep rush
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('70a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a449', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-27', '2025-12-27 09:00:00-05', '2025-12-27 10:35:00-05', 'completed', 'CARD', 90, 'Gel Glam combo', true);
-- January 12, 2026 (Monday) - Day +1 from today
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a501', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-12', '2026-01-12 09:00:00-05', '2026-01-12 09:45:00-05', 'in_progress', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a502', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-12', '2026-01-12 09:00:00-05', '2026-01-12 10:35:00-05', 'pending', NULL, 80, 'Extension appointment', true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a503', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-12', '2026-01-12 09:00:00-05', '2026-01-12 10:00:00-05', 'in_progress', NULL, 50, NULL, false),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a504', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-12', '2026-01-12 09:00:00-05', '2026-01-12 09:40:00-05', 'in_progress', NULL, 13, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a541', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-12', '2026-01-12 09:00:00-05', '2026-01-12 09:45:00-05', 'in_progress', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a542', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-12', '2026-01-12 14:00:00-05', '2026-01-12 15:15:00-05', 'pending', NULL, 60, NULL, true);

-- January 13, 2026 (Tuesday) - Day +2
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a505', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-13', '2026-01-13 10:00:00-05', '2026-01-13 10:55:00-05', 'pending', NULL, 50, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a506', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-13', '2026-01-13 10:00:00-05', '2026-01-13 11:45:00-05', 'in_progress', NULL, 70, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a507', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-13', '2026-01-13 10:00:00-05', '2026-01-13 11:15:00-05', 'in_progress', NULL, 60, NULL, false),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a543', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-13', '2026-01-13 10:00:00-05', '2026-01-13 10:45:00-05', 'pending', NULL, 40, NULL, true);

-- January 14, 2026 (Wednesday) - Day +3
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a508', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-14', '2026-01-14 13:00:00-05', '2026-01-14 13:45:00-05', 'in_progress', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a509', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-14', '2026-01-14 13:00:00-05', '2026-01-14 14:00:00-05', 'pending', NULL, 50, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a510', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-14', '2026-01-14 13:00:00-05', '2026-01-14 14:35:00-05', 'in_progress', NULL, 80, NULL, false),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a511', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-14', '2026-01-14 13:00:00-05', '2026-01-14 13:45:00-05', 'in_progress', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a544', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-14', '2026-01-14 13:00:00-05', '2026-01-14 13:40:00-05', 'pending', NULL, 20, NULL, true);

-- January 15, 2026 (Thursday) - Day +4
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a512', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-15', '2026-01-15 10:00:00-05', '2026-01-15 10:55:00-05', 'pending', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a513', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-15', '2026-01-15 09:00:00-05', '2026-01-15 10:15:00-05', 'in_progress', NULL, 60, NULL, false),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a514', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-15', '2026-01-15 11:00:00-05', '2026-01-15 11:40:00-05', 'in_progress', NULL, 20, NULL, true);

-- January 16, 2026 (Friday) - Day +5
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a515', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-16', '2026-01-16 14:00:00-05', '2026-01-16 14:45:00-05', 'in_progress', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a516', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-16', '2026-01-16 14:00:00-05', '2026-01-16 15:45:00-05', 'pending', NULL, 55, 'Polygel refill', true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a517', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-16', '2026-01-16 14:00:00-05', '2026-01-16 15:00:00-05', 'in_progress', NULL, 50, NULL, false),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a518', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-16', '2026-01-16 14:00:00-05', '2026-01-16 14:40:00-05', 'in_progress', NULL, 13, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a545', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-16', '2026-01-16 14:00:00-05', '2026-01-16 14:55:00-05', 'pending', NULL, 40, NULL, true);

-- January 17, 2026 (Saturday) - Day +6
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a519', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-17', '2026-01-17 10:00:00-05', '2026-01-17 10:55:00-05', 'in_progress', NULL, 50, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a520', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-17', '2026-01-17 09:00:00-05', '2026-01-17 10:35:00-05', 'pending', NULL, 80, 'Weekend booking', true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a521', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-17', '2026-01-17 09:00:00-05', '2026-01-17 10:15:00-05', 'in_progress', NULL, 70, NULL, false);

-- January 19, 2026 (Monday) - Day +8
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a522', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-19', '2026-01-19 09:00:00-05', '2026-01-19 09:45:00-05', 'in_progress', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a523', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-19', '2026-01-19 10:00:00-05', '2026-01-19 11:35:00-05', 'pending', NULL, 55, 'Regular Pack combo', true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a524', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-19', '2026-01-19 14:00:00-05', '2026-01-19 15:00:00-05', 'in_progress', NULL, 50, NULL, false);

-- January 20, 2026 (Tuesday) - Day +9
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a525', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-20', '2026-01-20 11:00:00-05', '2026-01-20 11:45:00-05', 'in_progress', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a526', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-20', '2026-01-20 11:00:00-05', '2026-01-20 12:45:00-05', 'pending', NULL, 70, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a527', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-20', '2026-01-20 11:00:00-05', '2026-01-20 12:15:00-05', 'in_progress', NULL, 60, NULL, false),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a546', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-20', '2026-01-20 11:00:00-05', '2026-01-20 12:55:00-05', 'in_progress', NULL, 65, 'Perfect Pair combo', true);

-- January 21, 2026 (Wednesday) - Day +10
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a528', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-21', '2026-01-21 09:00:00-05', '2026-01-21 09:55:00-05', 'in_progress', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a529', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-21', '2026-01-21 10:00:00-05', '2026-01-21 11:35:00-05', 'pending', NULL, 80, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a530', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-21', '2026-01-21 11:00:00-05', '2026-01-21 12:00:00-05', 'in_progress', NULL, 50, NULL, false),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a531', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2026-01-21', '2026-01-21 09:00:00-05', '2026-01-21 09:45:00-05', 'in_progress', NULL, 40, NULL, true);

-- January 22, 2026 (Thursday) - Day +11
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a532', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-22', '2026-01-22 10:00:00-05', '2026-01-22 10:55:00-05', 'pending', NULL, 50, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a533', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-22', '2026-01-22 14:00:00-05', '2026-01-22 15:15:00-05', 'in_progress', NULL, 70, NULL, false),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a534', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-22', '2026-01-22 11:00:00-05', '2026-01-22 11:40:00-05', 'in_progress', NULL, 20, NULL, true);

-- January 23, 2026 (Friday) - Day +12
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a535', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-23', '2026-01-23 15:00:00-05', '2026-01-23 15:45:00-05', 'in_progress', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a536', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-23', '2026-01-23 15:00:00-05', '2026-01-23 16:45:00-05', 'pending', NULL, 55, 'Refill needed', true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a537', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-23', '2026-01-23 15:00:00-05', '2026-01-23 16:00:00-05', 'in_progress', NULL, 50, NULL, false),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a547', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2026-01-23', '2026-01-23 15:00:00-05', '2026-01-23 15:40:00-05', 'pending', NULL, 20, NULL, true);

-- January 24, 2026 (Saturday) - Day +13
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "paymentMethod", "totalPrice", notes, web) VALUES
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a538', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2026-01-24', '2026-01-24 10:00:00-05', '2026-01-24 10:55:00-05', 'in_progress', NULL, 40, NULL, true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a539', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2026-01-24', '2026-01-24 09:00:00-05', '2026-01-24 10:35:00-05', 'pending', NULL, 80, 'Weekend rush', true),
('80a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a540', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2026-01-24', '2026-01-24 09:00:00-05', '2026-01-24 10:15:00-05', 'in_progress', NULL, 60, NULL, false);

-- ========== DAY 1: December 2, 2025 (Monday) - Historical data ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
-- Isabella (Mani) - 09:00-09:45, 11:00-11:55, 14:00-14:45
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a623', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-02', '2025-12-02 09:00:00-05', '2025-12-02 09:45:00-05', 'in_progress', 40, 'Multi-service test customer', true),
('41a89db6-1160-4933-89ef-5d4b6415c95f', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-02', '2025-12-02 11:00:00-05', '2025-12-02 11:55:00-05', 'in_progress', 50, NULL, true),
('32884fa3-4e66-4333-9e04-debdccff922c', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-02', '2025-12-02 14:00:00-05', '2025-12-02 14:45:00-05', 'in_progress', 40, NULL, true),
-- Camila (Extensions) - 10:00-11:35, 13:00-13:45, 15:00-16:45
('9edf3628-3b47-4aff-a026-b8163d8ed44f', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-02', '2025-12-02 10:00:00-05', '2025-12-02 11:35:00-05', 'in_progress', 80, NULL, true),
('fac85646-89fd-450c-b64a-df78e44d627f', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-02', '2025-12-02 13:00:00-05', '2025-12-02 13:45:00-05', 'in_progress', 40, NULL, true),
('d74cfec3-81b6-455e-b93b-9739c5bc95bb', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-02', '2025-12-02 15:00:00-05', '2025-12-02 16:45:00-05', 'in_progress', 70, NULL, true),
-- Sofia (Pedi) - 09:00-10:00 (SAME TIME AS ISABELLA for multi-service), 12:00-13:15
('41e0847b-ef91-49f1-95f5-7b1747f5b7da', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-02', '2025-12-02 09:00:00-05', '2025-12-02 10:00:00-05', 'in_progress', 50, 'MULTI: Pedi while Isabella does Mani', true),
('fd8267c2-8b8a-4c64-b535-06d2529fe403', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-02', '2025-12-02 12:00:00-05', '2025-12-02 13:15:00-05', 'in_progress', 60, NULL, false),
-- Valentina (Kids) - 10:00-10:40, 14:00-14:40
('4aed6f52-4c3a-4a17-a2b1-ef9204cd92f6', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-02', '2025-12-02 10:00:00-05', '2025-12-02 10:40:00-05', 'in_progress', 13, NULL, false),
('8ae00c14-7e9b-4178-9a98-1ec580c1bf24', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-02', '2025-12-02 14:00:00-05', '2025-12-02 14:40:00-05', 'in_progress', 20, NULL, true),
-- Luna (All-around) - 09:00-09:45, 11:00-12:00, 13:30-14:15
('e0e25e62-c1c8-42b3-8416-08474369397c', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-02', '2025-12-02 09:00:00-05', '2025-12-02 09:45:00-05', 'in_progress', 40, NULL, true),
('80ad7c4a-40de-473d-bcf8-fe397460792f', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-02', '2025-12-02 11:00:00-05', '2025-12-02 12:00:00-05', 'in_progress', 35, NULL, true),
('9a209767-ddc1-4c6a-9cd8-50b9489ed4b2', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-02', '2025-12-02 13:30:00-05', '2025-12-02 14:15:00-05', 'in_progress', 40, NULL, true);

-- ========== DAY 2: December 3, 2025 (Tuesday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
-- Isabella - 10:00-10:55, 13:00-13:45, 15:00-15:45
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a624', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-03', '2025-12-03 10:00:00-05', '2025-12-03 10:55:00-05', 'in_progress', 40, NULL, true),
('a6f6063d-b157-416d-a0ea-79edc8cd7b4c', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-03', '2025-12-03 13:00:00-05', '2025-12-03 13:45:00-05', 'in_progress', 40, NULL, true),
('a0032cb0-7721-44cc-821b-7126a32305dd', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-03', '2025-12-03 15:00:00-05', '2025-12-03 15:40:00-05', 'in_progress', 30, NULL, true),
-- Camila - 09:30-11:15, 14:00-14:45
('ee7dcfd8-a501-46e8-880d-cdb4423343a6', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-03', '2025-12-03 09:30:00-05', '2025-12-03 11:15:00-05', 'in_progress', 70, NULL, true),
('e078b464-d93c-4d16-af82-48f73bc3187f', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-03', '2025-12-03 14:00:00-05', '2025-12-03 14:45:00-05', 'in_progress', 40, NULL, true),
-- Sofia - 10:00-11:15, 13:30-14:10
('c40b3070-1818-4030-bc47-282f5192bf98', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-03', '2025-12-03 10:00:00-05', '2025-12-03 11:15:00-05', 'in_progress', 70, NULL, true),
('dc1012c0-d913-47df-932e-e7d48a1f90f7', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-03', '2025-12-03 13:30:00-05', '2025-12-03 14:10:00-05', 'in_progress', 30, NULL, true),
-- Valentina - 11:00-11:40
('435f5a6f-e700-4708-92a0-2bda07a3c556', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-03', '2025-12-03 11:00:00-05', '2025-12-03 11:40:00-05', 'in_progress', 20, NULL, true),
-- Luna - 09:00-10:00, 12:00-12:45
('bfaf2896-6376-4f50-89f7-eb367dd1a96c', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-03', '2025-12-03 09:00:00-05', '2025-12-03 10:00:00-05', 'in_progress', 50, NULL, true),
('20aef5fc-c353-4425-85c2-23241f87d86b', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-03', '2025-12-03 12:00:00-05', '2025-12-03 12:45:00-05', 'in_progress', 40, NULL, true);

-- ========== DAY 3: December 4, 2025 (Wednesday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
-- Isabella - 09:30-10:25, 12:00-12:45
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a625', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-04', '2025-12-04 09:30:00-05', '2025-12-04 10:25:00-05', 'in_progress', 50, NULL, true),
('680d28e0-ab32-4b6f-a06c-8f8dedfb5945', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-04', '2025-12-04 12:00:00-05', '2025-12-04 12:45:00-05', 'in_progress', 40, NULL, true),
-- Camila - 10:00-11:35 (MULTI with Isabella at 09:30), 13:30-14:15
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-04', '2025-12-04 10:00:00-05', '2025-12-04 11:35:00-05', 'in_progress', 80, 'MULTI: Extensions while Isabella finishes Mani', true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-04', '2025-12-04 13:30:00-05', '2025-12-04 14:15:00-05', 'in_progress', 40, NULL, true),
-- Sofia - 09:00-10:15, 11:30-12:30, 14:00-15:00
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-04', '2025-12-04 09:00:00-05', '2025-12-04 10:15:00-05', 'in_progress', 60, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-04', '2025-12-04 11:30:00-05', '2025-12-04 12:30:00-05', 'in_progress', 35, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-04', '2025-12-04 14:00:00-05', '2025-12-04 15:00:00-05', 'in_progress', 50, NULL, true),
-- Valentina - 10:00-10:40
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-04', '2025-12-04 10:00:00-05', '2025-12-04 10:40:00-05', 'in_progress', 13, NULL, true),
-- Luna - 09:00-09:45, 11:00-12:00
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-04', '2025-12-04 09:00:00-05', '2025-12-04 09:45:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-04', '2025-12-04 11:00:00-05', '2025-12-04 12:00:00-05', 'in_progress', 35, NULL, true);

-- ========== DAY 4: December 5, 2025 (Thursday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a626', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-05', '2025-12-05 10:00:00-05', '2025-12-05 10:45:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-05', '2025-12-05 13:00:00-05', '2025-12-05 13:55:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-05', '2025-12-05 09:00:00-05', '2025-12-05 10:45:00-05', 'in_progress', 55, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-05', '2025-12-05 10:30:00-05', '2025-12-05 11:45:00-05', 'in_progress', 45, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a001', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-05', '2025-12-05 11:00:00-05', '2025-12-05 11:40:00-05', 'in_progress', 20, NULL, true);

-- ========== DAY 5: December 6, 2025 (Friday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a501', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-06', '2025-12-06 09:00:00-05', '2025-12-06 09:55:00-05', 'in_progress', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a502', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-06', '2025-12-06 11:00:00-05', '2025-12-06 11:45:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a503', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-06', '2025-12-06 10:00:00-05', '2025-12-06 11:35:00-05', 'in_progress', 80, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a504', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-06', '2025-12-06 09:30:00-05', '2025-12-06 10:45:00-05', 'in_progress', 70, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a505', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-06', '2025-12-06 10:00:00-05', '2025-12-06 10:40:00-05', 'in_progress', 13, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a506', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-06', '2025-12-06 09:00:00-05', '2025-12-06 09:45:00-05', 'in_progress', 40, NULL, true);

-- ========== DAY 6: December 7, 2025 (Saturday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a507', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-07', '2025-12-07 10:00:00-05', '2025-12-07 10:45:00-05', 'in_progress', 40, NULL, false),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a508', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-07', '2025-12-07 09:00:00-05', '2025-12-07 10:45:00-05', 'in_progress', 70, NULL, false),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a509', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-07', '2025-12-07 09:00:00-05', '2025-12-07 10:15:00-05', 'in_progress', 60, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a510', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-07', '2025-12-07 10:00:00-05', '2025-12-07 10:40:00-05', 'in_progress', 20, NULL, true);

-- ========== DAY 7: December 8, 2025 (Sunday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a511', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-08', '2025-12-08 10:00:00-05', '2025-12-08 10:55:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a512', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-08', '2025-12-08 12:00:00-05', '2025-12-08 12:45:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a513', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-08', '2025-12-08 11:30:00-05', '2025-12-08 12:30:00-05', 'in_progress', 50, NULL, true);

-- ========== DAY 8: December 9, 2025 (Monday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a514', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-09', '2025-12-09 09:30:00-05', '2025-12-09 10:25:00-05', 'in_progress', 50, NULL, false),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a515', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-09', '2025-12-09 10:00:00-05', '2025-12-09 11:35:00-05', 'in_progress', 80, 'MULTI: Extensions started at 10am', true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a516', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-09', '2025-12-09 09:00:00-05', '2025-12-09 10:15:00-05', 'in_progress', 60, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a517', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-09', '2025-12-09 09:00:00-05', '2025-12-09 09:45:00-05', 'in_progress', 40, NULL, true);

-- ========== DAY 9: December 10, 2025 (Tuesday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a518', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-10', '2025-12-10 10:00:00-05', '2025-12-10 10:45:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a519', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-10', '2025-12-10 09:00:00-05', '2025-12-10 10:45:00-05', 'in_progress', 55, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a520', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-10', '2025-12-10 14:00:00-05', '2025-12-10 15:00:00-05', 'in_progress', 50, NULL, true);

-- ========== DAY 10: December 11, 2025 (Wednesday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a521', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-11', '2025-12-11 09:00:00-05', '2025-12-11 09:55:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a522', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-11', '2025-12-11 13:00:00-05', '2025-12-11 13:45:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a523', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-11', '2025-12-11 13:30:00-05', '2025-12-11 14:10:00-05', 'in_progress', 30, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a524', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-11', '2025-12-11 15:00:00-05', '2025-12-11 15:40:00-05', 'in_progress', 13, NULL, true);

-- ========== DAY 11: December 12, 2025 (Thursday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a525', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-12', '2025-12-12 11:00:00-05', '2025-12-12 11:45:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a526', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-12', '2025-12-12 14:30:00-05', '2025-12-12 16:05:00-05', 'in_progress', 80, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a527', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-12', '2025-12-12 14:00:00-05', '2025-12-12 15:00:00-05', 'in_progress', 50, NULL, true);

-- ========== DAY 12: December 13, 2025 (Friday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a528', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-13', '2025-12-13 15:00:00-05', '2025-12-13 15:45:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a529', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-13', '2025-12-13 15:00:00-05', '2025-12-13 16:45:00-05', 'in_progress', 70, NULL, false),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a530', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-13', '2025-12-13 16:00:00-05', '2025-12-13 17:00:00-05', 'in_progress', 50, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a531', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-12-13', '2025-12-13 13:00:00-05', '2025-12-13 13:40:00-05', 'in_progress', 20, NULL, true);

-- ========== DAY 13: December 14, 2025 (Saturday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a532', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-14', '2025-12-14 16:00:00-05', '2025-12-14 16:55:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a533', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-12-14', '2025-12-14 16:00:00-05', '2025-12-14 17:45:00-05', 'in_progress', 55, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a534', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-12-14', '2025-12-14 14:00:00-05', '2025-12-14 14:40:00-05', 'in_progress', 30, NULL, true);

-- ========== DAY 14: December 15, 2025 (Sunday) ==========
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a535', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-12-15', '2025-12-15 16:00:00-05', '2025-12-15 16:45:00-05', 'in_progress', 40, NULL, true),
('60a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a536', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-12-15', '2025-12-15 15:30:00-05', '2025-12-15 16:30:00-05', 'in_progress', 35, NULL, true);

-- ========== DAY 1: November 24, 2025 (Monday) - Continued ==========

-- Sofia Hernandez - Additional bookings
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e317', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-25', '2025-11-25 10:00:00-05', '2025-11-25 11:15:00-05', 'in_progress', 70, 'Glam pedi with gel', true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e318', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-25', '2025-11-25 13:30:00-05', '2025-11-25 14:10:00-05', 'in_progress', 30, NULL, true);

-- Valentina Garcia
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e319', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-25', '2025-11-25 11:00:00-05', '2025-11-25 11:40:00-05', 'in_progress', 20, 'Kids gel mani', true);

-- Luna Torres
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e320', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-25', '2025-11-25 09:00:00-05', '2025-11-25 10:00:00-05', 'in_progress', 50, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e321', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-25', '2025-11-25 12:00:00-05', '2025-11-25 12:45:00-05', 'in_progress', 40, NULL, true);

-- ========== DAY 3: November 26, 2025 (Wednesday) ==========

-- Isabella Martinez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e322', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-26', '2025-11-26 09:30:00-05', '2025-11-26 10:25:00-05', 'in_progress', 50, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e323', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-26', '2025-11-26 12:00:00-05', '2025-11-26 12:45:00-05', 'in_progress', 40, NULL, true);

-- Camila Rodriguez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e324', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-26', '2025-11-26 10:00:00-05', '2025-11-26 11:35:00-05', 'in_progress', 80, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e325', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-26', '2025-11-26 13:30:00-05', '2025-11-26 14:15:00-05', 'in_progress', 40, NULL, true);

-- Sofia Hernandez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e326', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-26', '2025-11-26 09:00:00-05', '2025-11-26 10:15:00-05', 'in_progress', 60, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e327', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-26', '2025-11-26 11:30:00-05', '2025-11-26 12:30:00-05', 'in_progress', 35, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e328', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-26', '2025-11-26 14:00:00-05', '2025-11-26 15:00:00-05', 'in_progress', 50, NULL, true);

-- Valentina Garcia
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e329', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-26', '2025-11-26 10:00:00-05', '2025-11-26 10:40:00-05', 'in_progress', 13, NULL, true);

-- Luna Torres
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e330', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-26', '2025-11-26 09:00:00-05', '2025-11-26 09:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e331', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-26', '2025-11-26 11:00:00-05', '2025-11-26 12:00:00-05', 'in_progress', 35, NULL, true);

-- ========== DAY 4: November 27, 2025 (Thursday) ==========

-- Isabella Martinez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e332', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-27', '2025-11-27 10:00:00-05', '2025-11-27 10:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e333', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-27', '2025-11-27 13:00:00-05', '2025-11-27 13:55:00-05', 'in_progress', 40, NULL, true);

-- Camila Rodriguez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e334', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-27', '2025-11-27 09:00:00-05', '2025-11-27 10:45:00-05', 'in_progress', 55, 'Polygel refill', true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e335', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-27', '2025-11-27 12:00:00-05', '2025-11-27 12:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e336', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-27', '2025-11-27 14:30:00-05', '2025-11-27 16:05:00-05', 'in_progress', 80, NULL, true);

-- Sofia Hernandez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e337', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-27', '2025-11-27 10:30:00-05', '2025-11-27 11:45:00-05', 'in_progress', 45, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e338', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-27', '2025-11-27 14:00:00-05', '2025-11-27 15:00:00-05', 'in_progress', 50, NULL, true);

-- Valentina Garcia
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e339', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-27', '2025-11-27 11:00:00-05', '2025-11-27 11:40:00-05', 'in_progress', 20, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e340', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-27', '2025-11-27 15:00:00-05', '2025-11-27 15:40:00-05', 'in_progress', 13, NULL, true);

-- Luna Torres
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e341', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-27', '2025-11-27 09:00:00-05', '2025-11-27 09:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e342', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-27', '2025-11-27 11:00:00-05', '2025-11-27 12:00:00-05', 'in_progress', 35, NULL, true);

-- ========== DAY 5: November 28, 2025 (Friday) ==========

-- Isabella Martinez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e343', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-28', '2025-11-28 09:00:00-05', '2025-11-28 09:55:00-05', 'in_progress', 50, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e344', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-28', '2025-11-28 11:00:00-05', '2025-11-28 11:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e345', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-28', '2025-11-28 14:00:00-05', '2025-11-28 14:45:00-05', 'in_progress', 25, NULL, true);

-- Camila Rodriguez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e346', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-28', '2025-11-28 10:00:00-05', '2025-11-28 11:35:00-05', 'in_progress', 80, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e347', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-28', '2025-11-28 13:00:00-05', '2025-11-28 13:45:00-05', 'in_progress', 40, NULL, true);

-- Sofia Hernandez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e348', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-28', '2025-11-28 09:30:00-05', '2025-11-28 10:45:00-05', 'in_progress', 70, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e349', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-28', '2025-11-28 12:00:00-05', '2025-11-28 13:00:00-05', 'in_progress', 50, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e350', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-28', '2025-11-28 14:30:00-05', '2025-11-28 15:45:00-05', 'in_progress', 60, NULL, true);

-- Valentina Garcia
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e351', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-28', '2025-11-28 10:00:00-05', '2025-11-28 10:40:00-05', 'in_progress', 13, NULL, true);

-- Luna Torres
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e352', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-28', '2025-11-28 09:00:00-05', '2025-11-28 09:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e353', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-28', '2025-11-28 11:00:00-05', '2025-11-28 12:00:00-05', 'in_progress', 35, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e354', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-28', '2025-11-28 13:30:00-05', '2025-11-28 14:15:00-05', 'in_progress', 40, NULL, true);

-- ========== DAY 6: November 29, 2025 (Saturday) ==========

-- Isabella Martinez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e355', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-29', '2025-11-29 10:00:00-05', '2025-11-29 10:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e356', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-29', '2025-11-29 13:00:00-05', '2025-11-29 13:55:00-05', 'in_progress', 40, NULL, true);

-- Camila Rodriguez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e357', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-29', '2025-11-29 09:00:00-05', '2025-11-29 10:45:00-05', 'in_progress', 70, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e358', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-29', '2025-11-29 12:00:00-05', '2025-11-29 12:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e359', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-29', '2025-11-29 14:00:00-05', '2025-11-29 15:35:00-05', 'in_progress', 80, NULL, true);

-- Sofia Hernandez
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e360', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-29', '2025-11-29 09:00:00-05', '2025-11-29 10:15:00-05', 'in_progress', 60, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e361', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-29', '2025-11-29 11:30:00-05', '2025-11-29 12:30:00-05', 'in_progress', 50, NULL, true);

-- Valentina Garcia
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e362', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-29', '2025-11-29 10:00:00-05', '2025-11-29 10:40:00-05', 'in_progress', 20, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e363', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-29', '2025-11-29 13:00:00-05', '2025-11-29 13:40:00-05', 'in_progress', 13, NULL, true);

-- Luna Torres
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e364', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-29', '2025-11-29 09:00:00-05', '2025-11-29 09:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e365', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-29', '2025-11-29 11:00:00-05', '2025-11-29 12:00:00-05', 'in_progress', 35, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e366', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-29', '2025-11-29 14:00:00-05', '2025-11-29 14:45:00-05', 'in_progress', 40, NULL, true);

-- =====================================================
-- ADDITIONAL BOOKINGS - Filling more time slots (Nov 24-29)
-- =====================================================

-- More bookings for November 24
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e401', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-24', '2025-11-24 15:30:00-05', '2025-11-24 16:15:00-05', 'in_progress', 40, 'Late afternoon', true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e402', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-24', '2025-11-24 15:00:00-05', '2025-11-24 16:45:00-05', 'in_progress', 55, 'Polygel refill', true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e403', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-24', '2025-11-24 15:00:00-05', '2025-11-24 16:00:00-05', 'in_progress', 35, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e404', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-24', '2025-11-24 15:00:00-05', '2025-11-24 15:45:00-05', 'in_progress', 40, NULL, true);

-- More bookings for November 25
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e405', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-25', '2025-11-25 09:00:00-05', '2025-11-25 09:45:00-05', 'in_progress', 25, 'Early morning', true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e406', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-25', '2025-11-25 12:00:00-05', '2025-11-25 13:35:00-05', 'in_progress', 70, 'No polish', true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e407', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-25', '2025-11-25 15:00:00-05', '2025-11-25 16:15:00-05', 'in_progress', 60, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e408', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-25', '2025-11-25 15:00:00-05', '2025-11-25 15:40:00-05', 'in_progress', 13, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e409', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-25', '2025-11-25 14:30:00-05', '2025-11-25 15:15:00-05', 'in_progress', 40, NULL, true);

-- More bookings for November 26
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e410', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-26', '2025-11-26 14:00:00-05', '2025-11-26 14:55:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e411', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-26', '2025-11-26 16:00:00-05', '2025-11-26 17:35:00-05', 'in_progress', 80, 'Late appointment', true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e412', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d303', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-26', '2025-11-26 13:00:00-05', '2025-11-26 13:40:00-05', 'in_progress', 20, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e413', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d304', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-26', '2025-11-26 14:00:00-05', '2025-11-26 15:00:00-05', 'in_progress', 50, NULL, true);

-- More bookings for November 27
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e414', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-27', '2025-11-27 15:00:00-05', '2025-11-27 15:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e415', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d306', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-27', '2025-11-27 16:00:00-05', '2025-11-27 17:00:00-05', 'in_progress', 50, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e416', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d307', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-27', '2025-11-27 15:00:00-05', '2025-11-27 15:45:00-05', 'in_progress', 40, NULL, true);

-- More bookings for November 28
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e417', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d308', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-28', '2025-11-28 16:00:00-05', '2025-11-28 16:55:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e418', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d309', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-28', '2025-11-28 15:00:00-05', '2025-11-28 16:45:00-05', 'in_progress', 70, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e419', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d310', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-28', '2025-11-28 13:00:00-05', '2025-11-28 13:40:00-05', 'in_progress', 20, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e420', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d311', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-28', '2025-11-28 15:30:00-05', '2025-11-28 16:30:00-05', 'in_progress', 35, NULL, true);

-- More bookings for November 29
INSERT INTO bookings (id, "customerId", "serviceId", "staffId", "appointmentDate", "startTime", "endTime", status, "totalPrice", notes, web) VALUES
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e421', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d312', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', '2025-11-29', '2025-11-29 15:00:00-05', '2025-11-29 15:45:00-05', 'in_progress', 40, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e422', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d313', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', '2025-11-29', '2025-11-29 16:00:00-05', '2025-11-29 17:45:00-05', 'in_progress', 55, 'Refill', true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e423', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d314', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', '2025-11-29', '2025-11-29 14:00:00-05', '2025-11-29 14:40:00-05', 'in_progress', 30, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e424', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d315', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', '2025-11-29', '2025-11-29 15:00:00-05', '2025-11-29 15:40:00-05', 'in_progress', 13, NULL, true),
('50e1f2a3-b4c5-49d6-e7f8-a9b0c1d2e425', '40d1e2f3-a4b5-48c6-d7e8-f9a0b1c2d301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', '2025-11-29', '2025-11-29 16:00:00-05', '2025-11-29 16:45:00-05', 'in_progress', 40, 'Weekend rush', true);

-- =====================================================
-- INSERT STAFF_SERVICES - Maps which staff members can perform which services
-- =====================================================
-- Staff IDs:
-- Isabella Martinez: 20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301 (Manicures + Mani Removals) Mon-Sat
-- Camila Rodriguez:  20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302 (Manicures + Nail Enhancements) Tue-Sat
-- Sofia Hernandez:   20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303 (Pedicures + Pedi Removals) Mon,Wed-Sun
-- Valentina Garcia:  20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304 (Kids only) Mon-Fri
-- Luna Torres:       20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305 (Manicures + Pedicures, all-around) Wed-Sun

-- Isabella Martinez - Manicures + Gel Removal (Mani)
INSERT INTO staff_services (staff_id, service_id) VALUES
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501'),  -- Basic Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502'),  -- Gel Basic Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503'),  -- Premium N&Co. Basic Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504'),  -- Premium N&Co. Gel Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505'),  -- Rubber Base / Capping
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506'),  -- Regular Polish Change (Mani)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507'),  -- Gel Polish Change (Mani)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301', 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a001');  -- Gel Removal (without service)

-- Camila Rodriguez - Manicures + Nail Enhancements + Extensions Removal
INSERT INTO staff_services (staff_id, service_id) VALUES
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501'),  -- Basic Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502'),  -- Gel Basic Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503'),  -- Premium N&Co. Basic Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504'),  -- Premium N&Co. Gel Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505'),  -- Rubber Base / Capping
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506'),  -- Regular Polish Change (Mani)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507'),  -- Gel Polish Change (Mani)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601'),  -- Apres Gel-X With Gel Polish
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602'),  -- Apres Gel-X Without Gel Polish
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603'),  -- Acrylic Full Set
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604'),  -- Acrylic Refill
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605'),  -- Polygel Full Set
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606'),  -- Polygel Refill
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a001'),  -- Gel Removal (without service)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302', 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a003');  -- Extensions / Rubber / Acrylic Removal

-- Sofia Hernandez - Pedicures + Gel Removal (Pedi)
INSERT INTO staff_services (staff_id, service_id) VALUES
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701'),  -- Basic Spa Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702'),  -- Gel Basic Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703'),  -- Premium N&Co. Spa Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704'),  -- Premium N&Co. Spa Gel Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705'),  -- Glam Pedi in a Box Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706'),  -- Glam Pedi in a Box Gel Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d707'),  -- Regular Polish Change (Pedi)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708'),  -- Gel Polish Change (Pedi)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303', 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a002');  -- Gel Removal - Pedi (Without Service)

-- Valentina Garcia - Kids services ONLY
INSERT INTO staff_services (staff_id, service_id) VALUES
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801'),  -- Basic Manicure (Kids)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802'),  -- Gel Manicure (Kids)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b304', 'd4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e803');  -- Basic Pedicure (Kids)

-- Luna Torres - All-around (Manicures + Pedicures)
INSERT INTO staff_services (staff_id, service_id) VALUES
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501'),  -- Basic Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502'),  -- Gel Basic Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503'),  -- Premium N&Co. Basic Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504'),  -- Premium N&Co. Gel Manicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505'),  -- Rubber Base / Capping
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506'),  -- Regular Polish Change (Mani)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507'),  -- Gel Polish Change (Mani)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701'),  -- Basic Spa Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702'),  -- Gel Basic Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703'),  -- Premium N&Co. Spa Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704'),  -- Premium N&Co. Spa Gel Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705'),  -- Glam Pedi in a Box Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706'),  -- Glam Pedi in a Box Gel Pedicure
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d707'),  -- Regular Polish Change (Pedi)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708'),  -- Gel Polish Change (Pedi)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a001'),  -- Gel Removal (without service)
('20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b305', 'f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a002');  -- Gel Removal - Pedi (Without Service)

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

SELECT 'Categories: ' || COUNT(*) as resultado FROM categories
UNION ALL SELECT 'Services: ' || COUNT(*) FROM services
UNION ALL SELECT 'Add-ons: ' || COUNT(*) FROM addons
UNION ALL SELECT 'Service-AddOns Relations: ' || COUNT(*) FROM service_addons
UNION ALL SELECT 'Service Incompatibilities: ' || COUNT(*) FROM service_incompatibilities
UNION ALL SELECT 'Removal Step Categories: ' || COUNT(*) FROM removal_step
UNION ALL SELECT 'Staff: ' || COUNT(*) FROM staff
UNION ALL SELECT 'Users: ' || COUNT(*) FROM users;

-- Category distribution
SELECT c.name as category, COUNT(s.id) as count 
FROM categories c 
LEFT JOIN services s ON c.id = s.category_id 
GROUP BY c.name, c."displayOrder"
ORDER BY c."displayOrder";

-- Get all categories with their IDs
SELECT name, id FROM categories ORDER BY "displayOrder";

-- Verify service count by category
SELECT c.name as category, COUNT(s.id) as service_count 
FROM categories c 
LEFT JOIN services s ON c.id = s.category_id 
GROUP BY c.name, c."displayOrder"
ORDER BY c."displayOrder";

-- =====================================================
-- VERIFICATION QUERIES - Bookings December 2-15, 2025
-- =====================================================

-- Query 1: Bookings grouped by date
SELECT 
    "appointmentDate"::date as booking_date,
    COUNT(*) as total_bookings
FROM bookings
WHERE "appointmentDate" >= '2025-12-01' AND "appointmentDate" < '2025-12-16'
GROUP BY "appointmentDate"::date
ORDER BY "appointmentDate"::date;

-- Query 2: Detailed booking information with customer and staff names
SELECT 
    b."appointmentDate"::date as date,
    b."startTime"::time as start_time,
    c."firstName" || ' ' || c."lastName" as customer_name,
    s.name as service_name,
    st."firstName" || ' ' || st."lastName" as staff_name,
    b.status,
    b."totalPrice",
    b.notes
FROM bookings b
JOIN customers c ON b."customerId" = c.id
JOIN services s ON b."serviceId" = s.id
JOIN staff st ON b."staffId" = st.id
WHERE b."appointmentDate" >= '2025-12-01' AND b."appointmentDate" < '2025-12-16'
ORDER BY b."appointmentDate", b."startTime";

-- =====================================================
-- SUMMARY QUERIES - Bookings Analysis
-- =====================================================

-- Query 1: Comprehensive summary with date, time slots, and booking counts
SELECT 
    "appointmentDate"::date as booking_date,
    TO_CHAR("appointmentDate", 'Day') as day_name,
    COUNT(*) as total_bookings,
    MIN("startTime"::time) as earliest_booking,
    MAX("startTime"::time) as latest_booking,
    SUM("totalPrice") as total_revenue,
    STRING_AGG(DISTINCT CASE WHEN notes LIKE '%MULTI%' THEN notes ELSE NULL END, '; ') as multi_service_notes
FROM bookings
WHERE "appointmentDate" >= '2025-12-01' AND "appointmentDate" < '2025-12-16'
GROUP BY "appointmentDate"::date
ORDER BY "appointmentDate"::date;

-- Query 2: Total bookings count
SELECT 
    'Total December 2-15 Bookings: ' || COUNT(*) as summary,
    'Date Range: ' || MIN("appointmentDate"::date) || ' to ' || MAX("appointmentDate"::date) as date_range,
    'Total Revenue: $' || SUM("totalPrice")/100.0 as revenue
FROM bookings
WHERE "appointmentDate" >= '2025-12-01' AND "appointmentDate" < '2025-12-16';

-- Query 3: Multi-service bookings (overlapping times for same customer)
SELECT 
    b1."appointmentDate"::date as date,
    b1."startTime"::time as time,
    c."firstName" || ' ' || c."lastName" as customer,
    s1.name as service_1,
    st1."firstName" || ' ' || st1."lastName" as staff_1,
    s2.name as service_2,
    st2."firstName" || ' ' || st2."lastName" as staff_2,
    b1.notes
FROM bookings b1
JOIN bookings b2 ON b1."customerId" = b2."customerId" 
    AND b1."appointmentDate" = b2."appointmentDate"
    AND b1.id < b2.id
    AND b1."startTime" = b2."startTime"
JOIN customers c ON b1."customerId" = c.id
JOIN services s1 ON b1."serviceId" = s1.id
JOIN staff st1 ON b1."staffId" = st1.id
JOIN services s2 ON b2."serviceId" = s2.id
JOIN staff st2 ON b2."staffId" = st2.id
WHERE b1."appointmentDate" >= '2025-12-01' AND b1."appointmentDate" < '2025-12-16'
ORDER BY b1."appointmentDate", b1."startTime";

-- =====================================================
-- INSERT LANGUAGES - Idiomas soportados
-- =====================================================

INSERT INTO languages (id, code, name, "isActive") VALUES
('00000000-0000-0000-0000-000000000001', 'EN', 'English', true),
('00000000-0000-0000-0000-000000000002', 'ES', 'Español', true);

-- =====================================================
-- INSERT CATEGORIES_LANG - Traducciones de categorías
-- =====================================================

INSERT INTO categories_lang (category_id, language_id, title, description) VALUES
-- Manicure
('c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '00000000-0000-0000-0000-000000000001', 'Manicure', 'Professional manicure services including basic care, gel polish, and premium treatments with exfoliation and massage.'),
('c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '00000000-0000-0000-0000-000000000002', 'Manicura', 'Servicios profesionales de manicura incluyendo cuidado básico, esmalte gel y tratamientos premium con exfoliación y masaje.'),

-- Nail Enhancements
('c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', '00000000-0000-0000-0000-000000000001', 'Nail Enhancements', 'Nail extension services including Gel-X, acrylics, and polygel for beautiful, long-lasting results.'),
('c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', '00000000-0000-0000-0000-000000000002', 'Extensiones de Uñas', 'Servicios de extensión de uñas incluyendo Gel-X, acrílicas y polygel para resultados hermosos y duraderos.'),

-- Pedicure
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', '00000000-0000-0000-0000-000000000001', 'Pedicure', 'Relaxing pedicure services including basic spa treatments, gel polish, and luxury pedi packages with massage.'),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', '00000000-0000-0000-0000-000000000002', 'Pedicura', 'Servicios relajantes de pedicura incluyendo tratamientos spa básicos, esmalte gel y paquetes de lujo con masaje.'),

-- Kids
('c4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', '00000000-0000-0000-0000-000000000001', 'Kids', 'Gentle nail care services specially designed for children ages 3-13, including manicures and pedicures.'),
('c4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', '00000000-0000-0000-0000-000000000002', 'Niños', 'Servicios de cuidado de uñas especialmente diseñados para niños de 3 a 13 años, incluyendo manicuras y pedicuras.'),

-- Combos
('c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', '00000000-0000-0000-0000-000000000001', 'Combos', 'Value packages combining manicure and pedicure services for a complete nail care experience.'),
('c5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', '00000000-0000-0000-0000-000000000002', 'Combos', 'Paquetes que combinan servicios de manicura y pedicura para una experiencia completa de cuidado de uñas.'),

-- Removals
('c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', '00000000-0000-0000-0000-000000000001', 'Removals', 'Safe and gentle removal services for gel polish, acrylics, and other nail enhancements.'),
('c6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', '00000000-0000-0000-0000-000000000002', 'Remociones', 'Servicios seguros y suaves de remoción de esmalte gel, acrílicas y otras extensiones de uñas.');

-- =====================================================
-- INSERT SERVICES_LANG - Traducciones de servicios (ALL 30 services × 2 languages = 60 rows)
-- =====================================================

INSERT INTO services_lang (service_id, language_id, title, description) VALUES
-- ===== MANICURE =====
-- Basic Manicure
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '00000000-0000-0000-0000-000000000001', 'Basic Manicure', 'Nail cutting and shaping, cuticle care, and moisturizing, finished with regular polish of your choice from our color collection.'),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501', '00000000-0000-0000-0000-000000000002', 'Manicura Básica', 'Corte y limado de uñas, cuidado de cutículas e hidratación, finalizando con el esmalte de tu preferencia de nuestra colección de colores.'),
-- Gel Basic Manicure
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '00000000-0000-0000-0000-000000000001', 'Gel Basic Manicure', 'Nail cutting and shaping, cuticle care, and moisturizing, finished with a long-lasting gel polish of your choice from our color collection.'),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502', '00000000-0000-0000-0000-000000000002', 'Manicura Básica en Gel', 'Corte y limado de uñas, cuidado de cutículas e hidratación, finalizando con un esmalte en gel de larga duración del color de tu preferencia de nuestra colección.'),
-- Premium N&Co. Manicure
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '00000000-0000-0000-0000-000000000001', 'Premium N&Co. Manicure', 'Indulge in the ultimate manicure experience. Includes everything from our Regular Manicure, plus a gentle hand exfoliation with nourishing oils and warm towels for smooth, hydrated, and rejuvenated skin.'),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b503', '00000000-0000-0000-0000-000000000002', 'Manicura Premium N&Co.', 'Disfruta de una experiencia de manicura superior. Incluye todo lo de nuestra Manicura Regular, más una suave exfoliación de manos con aceites nutritivos y toallas tibias para una piel suave, hidratada y rejuvenecida.'),
-- Premium N&Co. Gel Manicure
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '00000000-0000-0000-0000-000000000001', 'Premium N&Co. Gel Manicure', 'Indulge in the ultimate manicure experience. Includes everything from our Gel Manicure, plus a gentle hand exfoliation with nourishing oils and warm towels for smooth, hydrated, and rejuvenated skin.'),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b504', '00000000-0000-0000-0000-000000000002', 'Manicura en Gel Premium N&Co.', 'Disfruta de una experiencia de manicura superior. Incluye todo lo de nuestra Manicura en Gel, más una suave exfoliación de manos con aceites nutritivos y toallas tibias para una piel suave, hidratada y rejuvenecida.'),
-- Builder Gel / BIAB
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '00000000-0000-0000-0000-000000000001', 'Builder Gel / BIAB', 'A strengthening gel layer applied to the natural nail to protect and prevent breakage. Ideal for thin or weak nails needing extra support. Includes gel polish of your choice.'),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b505', '00000000-0000-0000-0000-000000000002', 'Builder Gel / BIAB', 'Capa de gel fortalecedora aplicada sobre la uña natural para protegerla y evitar quiebres. Ideal para uñas finas o débiles que necesitan soporte adicional. Incluye esmaltado en gel a elección.'),
-- Express Mani - Polish
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506', '00000000-0000-0000-0000-000000000001', 'Express Mani - Polish', 'Our express manicure includes a color change with your favorite shade from our collection.'),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b506', '00000000-0000-0000-0000-000000000002', 'Express Mani - Polish', 'Nuestra manicura exprés incluye cambio de color con el tono que elijas de nuestra colección.'),
-- Express Mani - Gel
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507', '00000000-0000-0000-0000-000000000001', 'Express Mani - Gel', 'Our express gel manicure includes a long-lasting gel polish color change with your choice from our collection.'),
('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b507', '00000000-0000-0000-0000-000000000002', 'Express Mani - Gel', 'Nuestra manicura exprés en gel incluye un cambio de color con esmalte en gel de larga duración, en el tono que elijas de nuestra colección.'),

-- ===== NAIL ENHANCEMENTS =====
-- Aprés Gel-X With Gel Polish
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '00000000-0000-0000-0000-000000000001', 'Aprés Gel-X With Gel Polish', 'Add natural-looking length to your nails in less time with pre-formed Gel-X tips — lightweight, strong, and safe for your natural nails. Includes buffing, cuticle care, moisturizing, and nail extensions, finished with a gel polish of your choice from our color collection.'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c601', '00000000-0000-0000-0000-000000000002', 'Aprés Gel-X Con Esmalte', 'Alarga tus uñas con un look natural en menos tiempo gracias a las puntas Pre-formadas Gel X — ligeras, resistentes y seguras para tus uñas naturales. Incluye limado, cuidado de cutículas, hidratación y extensiones de uñas, finalizando con un esmalte en gel del color de tu preferencia.'),
-- Aprés Gel-X Without Gel Polish
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602', '00000000-0000-0000-0000-000000000001', 'Aprés Gel-X Without Gel Polish', 'Add natural-looking length to your nails in less time with pre-formed Gel-X tips — lightweight, strong, and safe for your natural nails. Includes buffing, cuticle care, moisturizing, and nail extensions, ideal for clients who prefer to keep their nails natural.'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c602', '00000000-0000-0000-0000-000000000002', 'Aprés Gel-X Sin Esmalte', 'Alarga tus uñas con un look natural en menos tiempo gracias a las puntas Pre-formadas Gel X — ligeras, resistentes y seguras para tus uñas naturales. Incluye limado, cuidado de cutículas, hidratación y extensiones de uñas, ideal para quienes prefieren mantener sus uñas naturales.'),
-- Full Set Acrylic
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '00000000-0000-0000-0000-000000000001', 'Full Set Acrylic', 'Enhance your nails with durable short acrylic extensions. Includes prep, tip application, and acrylic build. *Price does not include gel polish — please add it separately if desired. Medium and long lengths available at an additional cost.'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c603', '00000000-0000-0000-0000-000000000002', 'Full Set Acrílico', 'Realza tus uñas con extensiones acrílicas cortas y duraderas. Incluye preparación, aplicación de tips y construcción con acrílico. *El precio no incluye esmaltado en gel — se debe agregar por separado si lo deseas. Los largos medio y largo tienen un costo adicional.'),
-- Refill Acrylic
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '00000000-0000-0000-0000-000000000001', 'Refill Acrylic', 'Revitalize your nails with an acrylic refill to maintain a flawless, polished look. Includes nail reshaping, cuticle care, and acrylic rebalance. *Default price applies to 2-week refills. For 3- or 4-week sets, please select the corresponding add-on below. Gel polish is not included; add it separately if desired.'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c604', '00000000-0000-0000-0000-000000000002', 'Refill Acrílico', 'Revitaliza tus uñas con un relleno de acrílico para mantener un aspecto impecable. Incluye limado, cuidado de cutículas y rebalanceo del acrílico. *El precio base corresponde a rellenos de 2 semanas. Si tu último servicio fue hace 3 o 4 semanas, seleccione el complemento correspondiente. Esmaltado en gel no incluido, agregarlo por separado si lo deseas.'),
-- Polygel Full Set
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '00000000-0000-0000-0000-000000000001', 'Polygel Full Set', 'Lightweight yet strong nail extensions that combine the flexibility of gel with the durability of acrylic. Includes shaping, buffing, cuticle care, and extensions sculpted to a natural length. *Price does not include gel polish — please add it separately if desired. Medium and long lengths available at an additional cost.'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c605', '00000000-0000-0000-0000-000000000002', 'Set Completo de Polygel', 'Extensiones de uñas livianas pero resistentes que combinan la flexibilidad del gel con la durabilidad del acrílico. Incluye limado, pulido, cuidado de cutículas y extensiones esculpidas en una longitud natural. *El precio no incluye esmaltado en gel — se debe agregar por separado si lo deseas. Tamaños mediano y largo están disponibles por un costo adicional.'),
-- Polygel Refill
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '00000000-0000-0000-0000-000000000001', 'Polygel Refill', 'Refresh your Polygel extensions with a precise refill. Includes nail reshaping, cuticle care, and polygel rebalance. Default price applies to 2-week refills. For 3- or 4-week sets, please select the corresponding add-on below. Gel polish is not included; add it separately if desired.'),
('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c606', '00000000-0000-0000-0000-000000000002', 'Relleno de Polygel', 'Renova tus extensiones de Polygel con un relleno preciso. Incluye limado, cuidado de cutículas y rebalanceo del polygel. El precio base corresponde a rellenos de 2 semanas. Si tu último servicio fue hace 3 ó 4 semanas, seleccione el complemento correspondiente. Esmaltado en gel no incluido, agregar por separado si se desea.'),

-- ===== PEDICURE =====
-- Basic Spa Pedicure
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '00000000-0000-0000-0000-000000000001', 'Basic Spa Pedicure', 'Nail shaping and buffing, cuticle care, and a relaxing foot massage with lotion, finished with a polish of your choice from our color collection.'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701', '00000000-0000-0000-0000-000000000002', 'Pedicura Spa Básica', 'Corte y limado de uñas, cuidado de cutículas y un relajante masaje de pies con crema hidratante, finalizado con esmalte de tu elección de nuestra colección de colores.'),
-- Gel Basic Pedicure
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '00000000-0000-0000-0000-000000000001', 'Gel Basic Pedicure', 'Nail shaping and buffing, cuticle care, and a relaxing foot massage with lotion, finished with a long-lasting gel polish of your choice from our color collection.'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702', '00000000-0000-0000-0000-000000000002', 'Pedicura Básica en Gel', 'Corte y limado de uñas, cuidado de cutículas y un relajante masaje de pies con crema hidratante, finalizado con esmalte semi de tu elección de nuestra colección de colores.'),
-- Premium N&Co. Spa Pedicure
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '00000000-0000-0000-0000-000000000001', 'Premium N&Co. Spa Pedicure', 'A rejuvenating pedicure that includes expert nail shaping, cuticle care, natural exfoliation, gentle callus removal, a relaxing oil massage, and warm towels, finished with your choice of regular polish for soft, renewed feet.'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d703', '00000000-0000-0000-0000-000000000002', 'Pedicura Spa Premium N&Co.', 'Una pedicura rejuvenecedora que incluye limado experto de uñas, cuidado de cutículas, exfoliación natural, eliminación suave de callos, un relajante masaje con aceites y toallas tibias, finalizado con esmalte de tu elección para pies suaves y renovados.'),
-- Premium N&Co. Spa Gel Pedicure
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '00000000-0000-0000-0000-000000000001', 'Premium N&Co. Spa Gel Pedicure', 'A rejuvenating pedicure that includes expert nail shaping, cuticle care, natural exfoliation, gentle callus removal, a relaxing oil massage, and warm towels, finished with your choice of long-lasting gel polish for soft, renewed feet.'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d704', '00000000-0000-0000-0000-000000000002', 'Pedicura Spa en Gel Premium N&Co.', 'Una pedicura rejuvenecedora que incluye limado experto de uñas, cuidado de cutículas, exfoliación natural, eliminación suave de callos, un relajante masaje con aceites y toallas tibias, finalizado con esmalte semi de tu elección para pies suaves y renovados.'),
-- Glam Pedi in a Box Pedicure
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', '00000000-0000-0000-0000-000000000001', 'Glam Pedi in a Box Pedicure', 'Treat your feet with our four-step treatment, designed to deeply hydrate and restore. Includes a relaxing salt soak, sugar scrub exfoliation, mud masque, and butter massage. Finished with your choice of regular polish.'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d705', '00000000-0000-0000-0000-000000000002', 'Pedicura Glam Pedi in a Box', 'Mima tus pies con nuestro tratamiento de cuatro pasos, diseñado para hidratar y revitalizar profundamente. Incluye baño de sal relajante, exfoliación con scrub de azúcar, mascarilla de barro y masaje con crema nutritiva. Finaliza con el esmalte de tu elección.'),
-- Glam Pedi in a Box Gel Pedicure
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '00000000-0000-0000-0000-000000000001', 'Glam Pedi in a Box Gel Pedicure', 'Treat your feet with our four-step treatment, designed to deeply hydrate and restore. Includes a relaxing salt soak, sugar scrub exfoliation, mud masque, and butter massage. Finished with your choice of long-lasting gel polish.'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d706', '00000000-0000-0000-0000-000000000002', 'Pedicura Glam Pedi in a Box en Gel', 'Mima tus pies con nuestro tratamiento de cuatro pasos, diseñado para hidratar y revitalizar profundamente. Incluye baño de sal relajante, exfoliación con scrub de azúcar, mascarilla de barro y masaje con crema nutritiva. Finaliza con esmalte semi de tu elección.'),
-- Express Pedi - Polish
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d707', '00000000-0000-0000-0000-000000000001', 'Express Pedi - Polish', 'Our express pedicure includes a color change with your favorite shade from our collection.'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d707', '00000000-0000-0000-0000-000000000002', 'Express Pedi - Polish', 'Nuestra pedicura exprés incluye cambio de color con el tono que elijas de nuestra colección.'),
-- Express Pedi - Gel
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '00000000-0000-0000-0000-000000000001', 'Express Pedi - Gel', 'Our express gel pedicure includes a long-lasting gel polish color change with your choice from our collection.'),
('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d708', '00000000-0000-0000-0000-000000000002', 'Express Pedi - Gel', 'Nuestra pedicura exprés en gel incluye un cambio de color con esmalte en gel de larga duración, en el tono que elijas de nuestra colección.'),

-- ===== KIDS =====
-- Basic Manicure (Kids)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '00000000-0000-0000-0000-000000000001', 'Basic Manicure (Kids)', 'Includes gentle nail shaping, cuticle care, and polish of their choice. Specially designed for kids ages 3–13.'),
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e801', '00000000-0000-0000-0000-000000000002', 'Manicura Básica (Niños)', 'Incluye limado suave, cuidado de cutículas y esmaltado del color que elijan. Especialmente diseñado para niños de 3 a 13 años.'),
-- Gel Manicure (Kids)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '00000000-0000-0000-0000-000000000001', 'Gel Manicure (Kids)', 'Includes gentle nail shaping, cuticle care, and long-lasting gel polish. Specially designed for kids ages 3–13.'),
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e802', '00000000-0000-0000-0000-000000000002', 'Manicura en Gel (Niños)', 'Incluye limado suave, cuidado de cutículas y esmaltado en gel de larga duración. Especialmente diseñado para niños de 3 a 13 años.'),
-- Basic Pedicure (Kids)
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e803', '00000000-0000-0000-0000-000000000001', 'Basic Pedicure (Kids)', 'Includes nail shaping, cuticle care, light massage, and polish of their choice.'),
('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e803', '00000000-0000-0000-0000-000000000002', 'Pedicura Básica (Niños)', 'Incluye limado de uñas, cuidado de cutículas, un masaje suave y esmaltado del color que elijan.'),

-- ===== COMBOS =====
-- REGULAR PACK
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '00000000-0000-0000-0000-000000000001', 'REGULAR PACK', 'Basic Manicure + Basic Spa Pedicure'),
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f901', '00000000-0000-0000-0000-000000000002', 'REGULAR PACK', 'Basic Manicure + Basic Spa Pedicure'),
-- PERFECT PAIR
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '00000000-0000-0000-0000-000000000001', 'PERFECT PAIR', 'Gel Basic Manicure + Basic Spa Pedicure'),
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f902', '00000000-0000-0000-0000-000000000002', 'PERFECT PAIR', 'Gel Basic Manicure + Basic Spa Pedicure'),
-- GEL GLAM
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '00000000-0000-0000-0000-000000000001', 'GEL GLAM', 'Gel Basic Manicure + Gel Basic Pedicure'),
('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f903', '00000000-0000-0000-0000-000000000002', 'GEL GLAM', 'Gel Basic Manicure + Gel Basic Pedicure'),

-- ===== REMOVALS =====
-- Gel Removal - Mani (No Service)
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a001', '00000000-0000-0000-0000-000000000001', 'Gel Removal - Mani (No Service)', 'Gentle gel polish removal **when no other service is booked**. Leaves nails clean and ready to breathe. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'),
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a001', '00000000-0000-0000-0000-000000000002', 'Retiro de Gel - Mani (sin servicio)', 'Retiro suave y seguro de esmalte en gel para **cuando no se reserva otro servicio**. Deja las uñas limpias y listas para descansar. ¿Vas a reservar una mani o pedi? Seleccione el servicio principal y agrege el retiro como complemento.'),
-- Gel Removal - Pedi (No Service)
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a002', '00000000-0000-0000-0000-000000000001', 'Gel Removal - Pedi (No Service)', 'Gentle gel polish removal **when no other service is booked**. Leaves nails clean and ready to breathe. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'),
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a002', '00000000-0000-0000-0000-000000000002', 'Retiro de Gel - Pedi (sin servicio)', 'Retiro suave y seguro de esmalte en gel para **cuando no se reserva otro servicio**. Deja las uñas limpias y listas para descansar. ¿Vas a reservar una mani o pedi? Seleccione el servicio principal y agrege el retiro como complemento.'),
-- Extensions or Acrylics Removal
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a003', '00000000-0000-0000-0000-000000000001', 'Extensions or Acrylics Removal', 'Safe removal of acrylics or nail extensions **when no other service is booked**. Booking a new mani or pedi? Please select the main service and add removal as an add-on instead.'),
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a003', '00000000-0000-0000-0000-000000000002', 'Retiro de Extensiones o Acrílicos', 'Retiro seguro de acrílico o extensiones para **cuando no se reserva otro servicio**. ¿Vas a reservar una mani o pedi? Seleccione el servicio principal y agrege el retiro como complemento.'),
-- Builder Gel / BIAB Removal - Mani (No Service)
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a004', '00000000-0000-0000-0000-000000000001', 'Builder Gel / BIAB Removal - Mani (No Service)', 'Safe removal of builder gel or BIAB **when no other service is booked**. Leaves nails clean and ready. Booking a new mani? Please select the main service and add removal as an add-on instead.'),
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a004', '00000000-0000-0000-0000-000000000002', 'Retiro de Builder Gel / BIAB - Mani (sin servicio)', 'Retiro seguro de builder gel o BIAB para **cuando no se reserva otro servicio**. Deja las uñas limpias y listas. ¿Vas a reservar una mani? Seleccione el servicio principal y agrege el retiro como complemento.'),
-- Builder Gel / BIAB Removal - Pedi (No Service)
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a005', '00000000-0000-0000-0000-000000000001', 'Builder Gel / BIAB Removal - Pedi (No Service)', 'Safe removal of builder gel or BIAB **when no other service is booked**. Leaves nails clean and ready. Booking a new pedi? Please select the main service and add removal as an add-on instead.'),
('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a005', '00000000-0000-0000-0000-000000000002', 'Retiro de Builder Gel / BIAB - Pedi (sin servicio)', 'Retiro seguro de builder gel o BIAB para **cuando no se reserva otro servicio**. Deja las uñas limpias y listas. ¿Vas a reservar una pedi? Seleccione el servicio principal y agrege el retiro como complemento.');

-- =====================================================
-- INSERT ADDONS_LANG - Traducciones de add-ons
-- =====================================================

INSERT INTO addons_lang (addon_id, language_id, title, description) VALUES
-- Additional Gel Polish Service
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a401', '00000000-0000-0000-0000-000000000001', 'Additional Gel Polish Service', 'Long-lasting gel polish of your choice from our color collection.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a401', '00000000-0000-0000-0000-000000000002', 'Additional Gel Polish Service', 'Aplicación de esmalte en gel de larga duración, a elección de nuestra colección de colores.'),
-- French Design
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402', '00000000-0000-0000-0000-000000000001', 'French Design', 'Elevate your look with a classic French tip.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a402', '00000000-0000-0000-0000-000000000002', 'French Design', 'Realza tu estilo con una clásica francesita.'),
-- Cat Eye Finish
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403', '00000000-0000-0000-0000-000000000001', 'Cat Eye Finish', 'Unique magnetic gel polish creates a "cat eye" effect for a stunning, reflective finish.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a403', '00000000-0000-0000-0000-000000000002', 'Cat Eye Finish', 'Esmalte en gel magnético que crea el efecto "ojo de gato" para un terminado brillante y llamativo.'),
-- Chrome Finish
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404', '00000000-0000-0000-0000-000000000001', 'Chrome Finish', 'A mirror-like chrome layer for a reflective, metallic look — inspired by the ''Glazed Donut'' manicure trend.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a404', '00000000-0000-0000-0000-000000000002', 'Chrome Finish', 'Capa de cromo con efecto espejo para un terminado metálico y brillante — inspirada en la tendencia de manicura ''Glazed Donut''.'),
-- Nail Art (10 M)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405', '00000000-0000-0000-0000-000000000001', 'Nail Art (10 M)', 'Simple design for a quick, elegant look.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a405', '00000000-0000-0000-0000-000000000002', 'Nail Art (10 M)', 'Diseños simples para un look rápido y elegante.'),
-- Nail Art (15 M)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406', '00000000-0000-0000-0000-000000000001', 'Nail Art (15 M)', 'Medium complexity design with added detail.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a406', '00000000-0000-0000-0000-000000000002', 'Nail Art (15 M)', 'Diseños de complejidad media con más detalles.'),
-- Nail Art (20 M)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407', '00000000-0000-0000-0000-000000000001', 'Nail Art (20 M)', 'Elaborate design with extra detail.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a407', '00000000-0000-0000-0000-000000000002', 'Nail Art (20 M)', 'Diseños elaborados con mayor detalle.'),
-- Extended Massage
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408', '00000000-0000-0000-0000-000000000001', 'Extended Massage', 'Extend your treatment with 10 more minutes of relaxing massage.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a408', '00000000-0000-0000-0000-000000000002', 'Masajes Extras', 'Extiende tu tratamiento con 10 minutos más de masajes relajantes.'),
-- Fix Nail
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409', '00000000-0000-0000-0000-000000000001', 'Fix Nail', 'Repair one damaged or broken nail using the same overlay system (gel, capping).'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a409', '00000000-0000-0000-0000-000000000002', 'Reparación de Uña', 'Reparar una uña dañada o rota utilizando el mismo sistema (gel, capping).'),
-- Fix Nail Extension
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410', '00000000-0000-0000-0000-000000000001', 'Fix Nail Extension', 'Rebuild one broken or lifted nail using matching material and finish (Acrylic, Polygel, Gel-X).'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a410', '00000000-0000-0000-0000-000000000002', 'Reparación de Extensión', 'Reconstrucción de una uña rota o desprendida utilizando el mismo material (Acrílico, Polygel, Gel-X).'),
-- Combo-specific addons (Mani/Pedi variants)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a411', '00000000-0000-0000-0000-000000000001', 'French Design - Mani', 'Elevate your look with a classic French tip.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a411', '00000000-0000-0000-0000-000000000002', 'French Design - Mani', 'Realza tu estilo con una clásica francesita.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a412', '00000000-0000-0000-0000-000000000001', 'French Design - Pedi', 'Elevate your look with a classic French tip.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a412', '00000000-0000-0000-0000-000000000002', 'French Design - Pedi', 'Realza tu estilo con una clásica francesita.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a413', '00000000-0000-0000-0000-000000000001', 'Nail Art (10 M) - Mani', 'Simple design for a quick, elegant look.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a413', '00000000-0000-0000-0000-000000000002', 'Nail Art (10 M) - Mani', 'Diseños simples para un look rápido y elegante.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a414', '00000000-0000-0000-0000-000000000001', 'Nail Art (10 M) - Pedi', 'Simple design for a quick, elegant look.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a414', '00000000-0000-0000-0000-000000000002', 'Nail Art (10 M) - Pedi', 'Diseños simples para un look rápido y elegante.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a415', '00000000-0000-0000-0000-000000000001', 'Nail Art (15 M) - Mani', 'Medium complexity design with added detail.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a415', '00000000-0000-0000-0000-000000000002', 'Nail Art (15 M) - Mani', 'Diseños de complejidad media con más detalles.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a416', '00000000-0000-0000-0000-000000000001', 'Nail Art (15 M) - Pedi', 'Medium complexity design with added detail.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a416', '00000000-0000-0000-0000-000000000002', 'Nail Art (15 M) - Pedi', 'Diseños de complejidad media con más detalles.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a417', '00000000-0000-0000-0000-000000000001', 'Nail Art (20 M) - Mani', 'Elaborate design with extra detail.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a417', '00000000-0000-0000-0000-000000000002', 'Nail Art (20 M) - Mani', 'Diseños elaborados con mayor detalle.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a418', '00000000-0000-0000-0000-000000000001', 'Nail Art (20 M) - Pedi', 'Elaborate design with extra detail.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a418', '00000000-0000-0000-0000-000000000002', 'Nail Art (20 M) - Pedi', 'Diseños elaborados con mayor detalle.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a419', '00000000-0000-0000-0000-000000000001', 'Extended Massage - Mani', 'Extend your treatment with 10 more minutes of relaxing massage.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a419', '00000000-0000-0000-0000-000000000002', 'Masajes Extras - Mani', 'Extiende tu tratamiento con 10 minutos más de masajes relajantes.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a420', '00000000-0000-0000-0000-000000000001', 'Extended Massage - Pedi', 'Extend your treatment with 10 more minutes of relaxing massage.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a420', '00000000-0000-0000-0000-000000000002', 'Masajes Extras - Pedi', 'Extiende tu tratamiento con 10 minutos más de masajes relajantes.'),
-- Removal addons
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421', '00000000-0000-0000-0000-000000000001', 'Gel Removal - Mani', 'Gentle gel polish removal for manicure. Leaves nails clean and ready.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a421', '00000000-0000-0000-0000-000000000002', 'Retiro de Gel - Mani', 'Retiro suave de esmalte en gel para manicura. Deja las uñas limpias y listas.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422', '00000000-0000-0000-0000-000000000001', 'Gel Removal - Pedi', 'Gentle gel polish removal for pedicure. Leaves nails clean and ready.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a422', '00000000-0000-0000-0000-000000000002', 'Retiro de Gel - Pedi', 'Retiro suave de esmalte en gel para pedicura. Deja las uñas limpias y listas.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423', '00000000-0000-0000-0000-000000000001', 'Extensions or Acrylics Removal', 'Safe removal of acrylics or nail extensions.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a423', '00000000-0000-0000-0000-000000000002', 'Retiro de Extensiones o Acrílicos', 'Retiro seguro de acrílico o extensiones.'),
-- Nail Enhancement addons (new)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a424', '00000000-0000-0000-0000-000000000001', 'Acrylic With Tips M', 'Medium-length acrylic extension upgrade.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a424', '00000000-0000-0000-0000-000000000002', 'Acrílico con tips M', 'Upgrade a largo medio.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a425', '00000000-0000-0000-0000-000000000001', 'Acrylic With Tips L', 'Long-length acrylic extension upgrade.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a425', '00000000-0000-0000-0000-000000000002', 'Acrílico con tips L', 'Upgrade a extra largo.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426', '00000000-0000-0000-0000-000000000001', '+3 Weeks Refill', 'For moderate regrowth.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a426', '00000000-0000-0000-0000-000000000002', 'Relleno +3 semanas', 'Para crecimiento moderado.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427', '00000000-0000-0000-0000-000000000001', '+4 Weeks Refill', 'For extended regrowth.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a427', '00000000-0000-0000-0000-000000000002', 'Relleno +4 semanas', 'Para mayor crecimiento.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a428', '00000000-0000-0000-0000-000000000001', 'Polygel With Tips M', 'Medium-length Polygel extension upgrade.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a428', '00000000-0000-0000-0000-000000000002', 'Polygel con tips M', 'Upgrade a largo medio.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a429', '00000000-0000-0000-0000-000000000001', 'Polygel With Tips L', 'Long-length Polygel extension upgrade.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a429', '00000000-0000-0000-0000-000000000002', 'Polygel con tips L', 'Upgrade a extra largo.'),
-- Combo Cat Eye / Chrome (Mani/Pedi variants)
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430', '00000000-0000-0000-0000-000000000001', 'Cat Eye Finish - Mani', 'Unique magnetic gel polish creates a "cat eye" effect for a stunning, reflective finish.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a430', '00000000-0000-0000-0000-000000000002', 'Cat Eye - Mani', 'Esmalte en gel magnético que crea el efecto "ojo de gato" para un terminado brillante y llamativo.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a431', '00000000-0000-0000-0000-000000000001', 'Cat Eye Finish - Pedi', 'Unique magnetic gel polish creates a "cat eye" effect for a stunning, reflective finish.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a431', '00000000-0000-0000-0000-000000000002', 'Cat Eye - Pedi', 'Esmalte en gel magnético que crea el efecto "ojo de gato" para un terminado brillante y llamativo.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432', '00000000-0000-0000-0000-000000000001', 'Chrome Finish - Mani', 'A mirror-like chrome layer for a reflective, metallic look — inspired by the ''Glazed Donut'' manicure trend.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a432', '00000000-0000-0000-0000-000000000002', 'Chrome - Mani', 'Capa de cromo con efecto espejo para un terminado metálico y brillante — inspirada en la tendencia de manicura ''Glazed Donut''.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a433', '00000000-0000-0000-0000-000000000001', 'Chrome Finish - Pedi', 'A mirror-like chrome layer for a reflective, metallic look — inspired by the ''Glazed Donut'' manicure trend.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a433', '00000000-0000-0000-0000-000000000002', 'Chrome - Pedi', 'Capa de cromo con efecto espejo para un terminado metálico y brillante — inspirada en la tendencia de manicura ''Glazed Donut''.'),
-- Builder Gel / BIAB Removal addons
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434', '00000000-0000-0000-0000-000000000001', 'Builder Gel / BIAB Removal - Mani', 'Safe removal of builder gel or BIAB for manicure. Leaves nails clean and ready.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a434', '00000000-0000-0000-0000-000000000002', 'Retiro de Builder Gel / BIAB - Mani', 'Retiro seguro de builder gel o BIAB para manicura. Deja las uñas limpias y listas.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435', '00000000-0000-0000-0000-000000000001', 'Builder Gel / BIAB Removal - Pedi', 'Safe removal of builder gel or BIAB for pedicure. Leaves nails clean and ready.'),
('10a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a435', '00000000-0000-0000-0000-000000000002', 'Retiro de Builder Gel / BIAB - Pedi', 'Retiro seguro de builder gel o BIAB para pedicura. Deja las uñas limpias y listas.');

-- =====================================================
-- INSERT MANUAL ADJUSTMENTS - Sample data
-- =====================================================

INSERT INTO manual_adjustments (type, description, amount, "paymentMethod", "createdBy", "createdAt") VALUES
('expense', 'Cash register shortage - End of day reconciliation', 25, 'CASH', 
    (SELECT id FROM users WHERE email = 'admin@nailsco.com' LIMIT 1),
    '2025-12-23 18:30:00'),
    
('income', 'Gift card sale - Holiday special', 100, 'CARD', 
    (SELECT id FROM users WHERE email = 'admin@nailsco.com' LIMIT 1),
    '2025-12-24 14:15:00'),
    
('expense', 'Petty cash - Office supplies purchase', 45, 'CASH', 
    (SELECT id FROM users WHERE email = 'admin@nailsco.com' LIMIT 1),
    '2025-12-25 10:00:00'),
    
('income', 'Product sale - Nail care kit', 75, 'CASH', 
    (SELECT id FROM users WHERE email = 'admin@nailsco.com' LIMIT 1),
    '2025-12-26 16:45:00');

-- =====================================================
-- VERIFICATION - Languages and translations
-- =====================================================

SELECT 'Languages created:' as info, COUNT(*) as total FROM languages;
SELECT 'Category translations created:' as info, COUNT(*) as total FROM categories_lang;
SELECT 'Service translations created:' as info, COUNT(*) as total FROM services_lang;
SELECT 'Addon translations created:' as info, COUNT(*) as total FROM addons_lang;
SELECT 'Manual adjustments created:' as info, COUNT(*) as total FROM manual_adjustments;

-- =====================================================
-- INSERT SCREEN_ROLES - Permissions for UI screens
-- =====================================================
-- Defines which roles can access each screen in the application
-- Based on LayoutMenuData.tsx screen definitions
-- Owner: can see everything
-- Admin: can see everything except revenue management (admin-ingresos)
-- Manager: can see daily operations but not revenue management or configuration
-- Reception: can see reservations, customers and calendar
-- Staff: can only see reservations and calendar

TRUNCATE TABLE screen_roles CASCADE;

INSERT INTO screen_roles (screen_id, role) VALUES
-- Owner can see all screens
('admin-dashboard', 'owner'),
('admin-ingresos', 'owner'),
('ingresos-diarios', 'owner'),
('ajustes-manuales', 'owner'),
('admin-reservas', 'owner'),
('historial-reservas', 'owner'),
('vista-calendario', 'owner'),
('admin-servicios', 'owner'),
('categories', 'owner'),
('servicios-list', 'owner'),
('addons', 'owner'),
('admin-staff', 'owner'),
('admin-clientes', 'owner'),
('admin-reportes', 'owner'),
('admin-config', 'owner'),
('usuarios-roles', 'owner'),
('idioma', 'owner'),

-- Admin can see everything except revenue management
('admin-dashboard', 'admin'),
('admin-reservas', 'admin'),
('historial-reservas', 'admin'),
('vista-calendario', 'admin'),
('admin-servicios', 'admin'),
('categories', 'admin'),
('servicios-list', 'admin'),
('addons', 'admin'),
('admin-staff', 'admin'),
('admin-clientes', 'admin'),
('admin-reportes', 'admin'),
('admin-config', 'admin'),
('usuarios-roles', 'admin'),
('idioma', 'admin'),

-- Manager can see daily operations but not revenue management or configuration
('admin-dashboard', 'manager'),
('admin-reservas', 'manager'),
('historial-reservas', 'manager'),
('vista-calendario', 'manager'),
('admin-servicios', 'manager'),
('categories', 'manager'),
('servicios-list', 'manager'),
('addons', 'manager'),
('admin-staff', 'manager'),
('admin-clientes', 'manager'),
('admin-reportes', 'manager'),

-- Reception can see reservations, customers and calendar
('admin-dashboard', 'reception'),
('admin-reservas', 'reception'),
('historial-reservas', 'reception'),
('vista-calendario', 'reception'),
('admin-clientes', 'reception'),

-- Staff can only see reservations and calendar
('admin-reservas', 'staff'),
('historial-reservas', 'staff'),
('vista-calendario', 'staff');

SELECT 'Screen roles created:' as info, COUNT(*) as total FROM screen_roles;



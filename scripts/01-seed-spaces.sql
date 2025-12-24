-- Seed AMG Workspace spaces and pricing plans

-- Insert Spaces
INSERT INTO "Space" (id, name, slug, description, capacity, amenities, images, "isActive", "createdAt", "updatedAt")
VALUES
  ('work-solo-1', 'Work Solo', 'work-solo', 'Private workspace perfect for focused individual work', 1, ARRAY['WiFi', 'Power Outlets', 'Air Conditioning', 'Natural Light'], ARRAY['/images/work-solo.jpg'], true, NOW(), NOW()),
  ('board-room-1', 'Board Room', 'board-room', '6-seater meeting space for teams and collaborations', 6, ARRAY['WiFi', 'Projector', 'Whiteboard', 'Air Conditioning', 'Video Conferencing'], ARRAY['/images/board-room.jpg'], true, NOW(), NOW()),
  ('photo-studio-1', 'Photo Studio', 'photo-studio', 'Professional studio with lighting and video equipment', 10, ARRAY['Lighting Equipment', 'Backdrop', 'WiFi', 'Power Outlets', 'Props'], ARRAY['/images/photo-studio.jpg'], true, NOW(), NOW()),
  ('training-room-1', 'Training Room', 'training-room', 'Large space for workshops, training, and events', 25, ARRAY['WiFi', 'Projector', 'Sound System', 'Air Conditioning', 'Seating'], ARRAY['/images/training-room.png'], true, NOW(), NOW()),
  ('shared-desk-1', 'Shared Desk Space', 'shared-desk', 'Flexible desk in collaborative environment', 1, ARRAY['WiFi', 'Power Outlets', 'Air Conditioning', 'Locker'], ARRAY['/images/shared-desk.jpg'], true, NOW(), NOW()),
  ('lounge-1', 'Lounge', 'lounge', 'Casual meeting and relaxation space', 15, ARRAY['WiFi', 'Comfortable Seating', 'Air Conditioning', 'Coffee'], ARRAY['/images/lounge.jpg'], true, NOW(), NOW()),
  ('office-space-1', 'Office Space 1', 'office-space-1', 'Private office for small teams', 4, ARRAY['WiFi', 'Power Outlets', 'Air Conditioning', 'Storage'], ARRAY['/images/office-1.jpg'], true, NOW(), NOW()),
  ('office-space-2', 'Office Space 2', 'office-space-2', 'Private office for medium teams', 6, ARRAY['WiFi', 'Power Outlets', 'Air Conditioning', 'Storage'], ARRAY['/images/office-2.jpg'], true, NOW(), NOW()),
  ('office-space-3', 'Office Space 3', 'office-space-3', 'Private office for larger teams', 8, ARRAY['WiFi', 'Power Outlets', 'Air Conditioning', 'Storage'], ARRAY['/images/office-3.jpg'], true, NOW(), NOW());

-- Insert Pricing Plans (prices in kobo: multiply by 100)

-- Work Solo Plans
INSERT INTO "PricingPlan" (id, "spaceId", name, price, duration, type, "isActive", "createdAt", "updatedAt")
VALUES
  ('ws-daily', 'work-solo-1', 'Daily Plan', 550000, NULL, 'DAILY', true, NOW(), NOW()),
  ('ws-saturday', 'work-solo-1', 'Saturday Plans', 900000, NULL, 'DAILY', true, NOW(), NOW()),
  ('ws-weekly', 'work-solo-1', 'Full Weekly', 2150000, NULL, 'WEEKLY', true, NOW(), NOW()),
  ('ws-hybrid-weekly', 'work-solo-1', 'Hybrid Weekly', 1500000, NULL, 'WEEKLY', true, NOW(), NOW()),
  ('ws-hybrid-flexi', 'work-solo-1', 'Hybrid Flexi', 2875000, NULL, 'MONTHLY', true, NOW(), NOW()),
  ('ws-evening', 'work-solo-1', 'Evening Plan', 700000, NULL, 'DAILY', true, NOW(), NOW()),
  ('ws-half-flexi', 'work-solo-1', 'Half Flexi Monthly', 3300000, NULL, 'MONTHLY', true, NOW(), NOW()),
  ('ws-monthly', 'work-solo-1', 'Monthly Plan', 4650000, NULL, 'MONTHLY', true, NOW(), NOW());

-- Board Room Plans
INSERT INTO "PricingPlan" (id, "spaceId", name, price, duration, type, "isActive", "createdAt", "updatedAt")
VALUES
  ('br-2hrs', 'board-room-1', 'Board Room (2 Hours)', 1500000, 2, 'HOURLY', true, NOW(), NOW());

-- Photo Studio Plans
INSERT INTO "PricingPlan" (id, "spaceId", name, price, duration, type, "isActive", "createdAt", "updatedAt")
VALUES
  ('ps-1hr', 'photo-studio-1', 'Photo Studio (1 Hour)', 1000000, 1, 'HOURLY', true, NOW(), NOW());

-- Training Room Plans
INSERT INTO "PricingPlan" (id, "spaceId", name, price, duration, type, "isActive", "createdAt", "updatedAt")
VALUES
  ('tr-full', 'training-room-1', 'Training Room', 20000000, NULL, 'DAILY', true, NOW(), NOW());

-- Shared Desk Plans
INSERT INTO "PricingPlan" (id, "spaceId", name, price, duration, type, "isActive", "createdAt", "updatedAt")
VALUES
  ('sd-half', 'shared-desk-1', 'Shared Desk (Half)', 10000000, NULL, 'MONTHLY', true, NOW(), NOW()),
  ('sd-full', 'shared-desk-1', 'Shared Desk (Full)', 18000000, NULL, 'MONTHLY', true, NOW(), NOW());

-- Lounge Plans
INSERT INTO "PricingPlan" (id, "spaceId", name, price, duration, type, "isActive", "createdAt", "updatedAt")
VALUES
  ('lounge-hr', 'lounge-1', 'Lounge (Per Hour)', 2500000, 1, 'HOURLY', true, NOW(), NOW());

-- Office Space 1 Plans
INSERT INTO "PricingPlan" (id, "spaceId", name, price, duration, type, "isActive", "createdAt", "updatedAt")
VALUES
  ('os1-1month', 'office-space-1', 'Office Space 1 (1 Month)', 9000000, NULL, 'MONTHLY', true, NOW(), NOW()),
  ('os1-2months', 'office-space-1', 'Office Space 1 (2 Months)', 16500000, NULL, 'CUSTOM', true, NOW(), NOW());

-- Office Space 2 Plans
INSERT INTO "PricingPlan" (id, "spaceId", name, price, duration, type, "isActive", "createdAt", "updatedAt")
VALUES
  ('os2-1month', 'office-space-2', 'Office Space 2 (1 Month)', 13500000, NULL, 'MONTHLY', true, NOW(), NOW()),
  ('os2-2months', 'office-space-2', 'Office Space 2 (2 Months)', 24000000, NULL, 'CUSTOM', true, NOW(), NOW());

-- Office Space 3 Plans
INSERT INTO "PricingPlan" (id, "spaceId", name, price, duration, type, "isActive", "createdAt", "updatedAt")
VALUES
  ('os3-1month', 'office-space-3', 'Office Space 3 (1 Month)', 15500000, NULL, 'MONTHLY', true, NOW(), NOW()),
  ('os3-2months', 'office-space-3', 'Office Space 3 (2 Months)', 29000000, NULL, 'CUSTOM', true, NOW(), NOW());

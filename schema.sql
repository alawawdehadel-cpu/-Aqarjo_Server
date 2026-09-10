-- ==================================================
-- AqarJo Database Schema
-- Run this file inside the "aqarjo_db" database.
--
-- After loading this file, the seed users below have no password yet
-- (password_hash is NULL). Run "npm run auth:migrate" to generate
-- development bcrypt passwords for them (see scripts/migrateAuth.js).
-- ==================================================

-- Drop tables if they already exist, so this file can be re-run safely.
-- Order matters because of foreign keys (child tables first).
DROP TABLE IF EXISTS inquiries;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS users;

-- ==================================================
-- USERS TABLE
-- ==================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30),
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  password_hash VARCHAR(255), -- bcrypt hash, never the plain password
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- PROPERTIES TABLE
-- ==================================================
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  listing_type VARCHAR(10) NOT NULL,   -- 'sale' or 'rent'
  property_type VARCHAR(20) NOT NULL,  -- 'apartment', 'house', 'land'
  city VARCHAR(100) NOT NULL,
  area VARCHAR(100) NOT NULL,
  bedrooms INTEGER,   -- NULL for land
  bathrooms INTEGER,  -- NULL for land
  size NUMERIC(10, 2) NOT NULL, -- in square meters
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'approved', 'pending', 'rejected'
  featured BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- FAVORITES TABLE
-- ==================================================
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, property_id) -- a user can only favorite a property once
);

-- ==================================================
-- INQUIRIES TABLE
-- ==================================================
CREATE TABLE inquiries (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- SEED DATA - USERS
-- id 1..7, in this exact order
-- ==================================================
INSERT INTO users (name, email, phone, role) VALUES
('Omar Al-Masri', 'omar.masri@mail.com', '0790000001', 'user'),  -- id 1
('Lina Haddad', 'lina.haddad@mail.com', '0790000002', 'user'),   -- id 2
('Sami Qasem', 's.qasem@mail.com', '0790000003', 'user'),        -- id 3
('Ahmad Zaid', 'ahmad.zaid@mail.com', '0790000004', 'user'),     -- id 4
('Noor Fayez', 'noor.fayez@mail.com', '0790000005', 'user'),     -- id 5
('Sara Yousef', 'sara.yousef@mail.com', '0790000006', 'user'),   -- id 6
('Admin User', 'admin@aqarjo.jo', '0790000007', 'admin');        -- id 7

-- ==================================================
-- SEED DATA - PROPERTIES
-- Reused from the frontend mock data (src/data/properties.ts).
-- id 1..12, in this exact order (owner_id matches the users above).
-- ==================================================
INSERT INTO properties
  (title, description, price, listing_type, property_type, city, area, bedrooms, bathrooms, size, image_url, status, featured, views, owner_id)
VALUES
('Modern Apartment for Sale in Khalda',
 'A bright third-floor apartment in a quiet Khalda side street, five minutes from Mecca Street. Large family living room, separate guest salon, three bedrooms with built-in wardrobes and a covered balcony facing the garden.',
 85000, 'sale', 'apartment', 'Amman', 'Khalda', 3, 2, 150, 'https://picsum.photos/seed/aqarjo-1/800/600', 'approved', true, 412, 1),

('Apartment for Rent in Sweifieh',
 'Cozy two-bedroom apartment close to Sweifieh''s restaurants and shops. Fully tiled, central heating, and a covered parking spot included in the rent.',
 550, 'rent', 'apartment', 'Amman', 'Sweifieh', 2, 1, 110, 'https://picsum.photos/seed/aqarjo-2/800/600', 'approved', true, 268, 2),

('Residential Land for Sale in Dabouq',
 '750 m2 residential plot in a developing area of Dabouq, walking distance from the main road. Suitable for a private villa. Classification: Residential B.',
 140000, 'sale', 'land', 'Amman', 'Dabouq', NULL, NULL, 750, 'https://picsum.photos/seed/aqarjo-3/800/600', 'pending', true, 0, 2),

('Luxury Villa for Sale in Abdoun',
 'Detached villa with a private garden, covered parking for three cars and a separate guest floor. Finished to a very high standard with imported fittings throughout.',
 295000, 'sale', 'house', 'Amman', 'Abdoun', 5, 4, 420, 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop', 'approved', true, 731, 1),

('Family Apartment for Sale in Shmeisani',
 'Spacious four-bedroom apartment in a well-maintained building with an elevator and 24-hour security, close to banks and offices.',
 112000, 'sale', 'apartment', 'Amman', 'Shmeisani', 4, 3, 195, 'https://picsum.photos/seed/aqarjo-5/800/600', 'approved', false, 154, 3),

('Townhouse for Rent in Irbid Centre',
 'Three-bedroom townhouse close to Yarmouk University, recently repainted with a small private yard and covered parking.',
 420, 'rent', 'house', 'Irbid', 'University Street', 3, 2, 165, 'https://picsum.photos/seed/aqarjo-6/800/600', 'approved', false, 96, 3),

('Studio Apartment for Rent in Jabal Amman',
 'Compact studio in a historic building in Jabal Amman, ideal for a single tenant or student. Close to cafes and cultural spots.',
 300, 'rent', 'apartment', 'Amman', 'Jabal Amman', 1, 1, 60, 'https://picsum.photos/seed/aqarjo-7/800/600', 'rejected', false, 12, 4),

('Sea View Apartment for Sale in Aqaba',
 'Two-bedroom apartment with a partial sea view, part of a gated compound with a shared pool and 24-hour security.',
 98000, 'sale', 'apartment', 'Aqaba', 'South Beach', 2, 2, 130, 'https://picsum.photos/seed/aqarjo-8/800/600', 'approved', true, 340, 5),

('Commercial Land for Sale in Zarqa',
 '500 m2 plot on a main street in Zarqa with commercial classification, suitable for a small business or showroom.',
 65000, 'sale', 'land', 'Zarqa', 'Al Zarqa Al Jadeeda', NULL, NULL, 500, 'https://picsum.photos/seed/aqarjo-9/800/600', 'approved', false, 58, 5),

('Villa for Rent in Dabouq',
 'Furnished five-bedroom villa with a private garden and swimming pool, available for long-term rent to families.',
 1400, 'rent', 'house', 'Amman', 'Dabouq', 5, 5, 480, 'https://picsum.photos/seed/aqarjo-10/800/600', 'approved', false, 221, 1),

('Apartment for Sale in Abdoun',
 'Bright two-bedroom apartment on a high floor with a large balcony overlooking Abdoun''s green areas.',
 128000, 'sale', 'apartment', 'Amman', 'Abdoun', 2, 2, 140, 'https://picsum.photos/seed/aqarjo-11/800/600', 'approved', false, 189, 2),

('Agricultural Land for Sale near Irbid',
 '2000 m2 agricultural plot with mature olive trees and a small storage room, easy road access.',
 45000, 'sale', 'land', 'Irbid', 'Al Ramtha Road', NULL, NULL, 2000, 'https://picsum.photos/seed/aqarjo-12/800/600', 'pending', false, 0, 4);

-- ==================================================
-- SEED DATA - FAVORITES
-- ==================================================
INSERT INTO favorites (user_id, property_id) VALUES
(1, 2),
(1, 8),
(6, 1),
(6, 4);

-- ==================================================
-- SEED DATA - INQUIRIES
-- ==================================================
INSERT INTO inquiries (property_id, name, email, message) VALUES
(1, 'Adel', 'adel@email.com', 'I am interested in this property. Is it still available?'),
(4, 'Rania Obeidat', 'rania.o@mail.com', 'Can I schedule a viewing this weekend?'),
(8, 'Khaled Nasser', 'khaled.n@mail.com', 'Does the price include parking?');

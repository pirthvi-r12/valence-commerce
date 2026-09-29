-- VALENCE // Autonomous Luxury Commerce
-- Canonical schema: sql/valance.sql (MySQL block) — apply with npm run db:apply

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_role CHECK (role IN ('customer', 'admin'))
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  price_cents INT NOT NULL,
  compare_at_price_cents INT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_images (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(96) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  sku VARCHAR(64) NOT NULL UNIQUE,
  size VARCHAR(8) NOT NULL,
  color VARCHAR(64) NOT NULL,
  inventory_count INT NOT NULL DEFAULT 0,
  price_offset_cents INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(32) NOT NULL UNIQUE,
  user_id VARCHAR(64) NULL,
  customer_email VARCHAR(255) NOT NULL,
  shipping_address_json JSON NOT NULL,
  subtotal_cents INT NOT NULL,
  discount_cents INT NOT NULL DEFAULT 0,
  shipping_cents INT NOT NULL DEFAULT 0,
  tax_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  tracking_carrier VARCHAR(64) NULL,
  tracking_number VARCHAR(128) NULL,
  coupon_code VARCHAR(64) NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  returned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  variant_id VARCHAR(96) NULL,
  title VARCHAR(255) NOT NULL,
  price_cents INT NOT NULL,
  quantity INT NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  fit VARCHAR(32) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS coupons (
  code VARCHAR(64) PRIMARY KEY,
  discount_percent INT NOT NULL,
  valid_until DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS wishlists (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  UNIQUE KEY uq_wishlist (user_id, product_id),
  CONSTRAINT fk_wish_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wish_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('usr_admin', 'Valence Atelier', 'admin@valence.studio', '99c0387d8abecf3009738db1730cef158c4195a6ed77b02f4b072bd1fb917d93', 'admin'),
  ('usr_avery', 'Avery Chen', 'avery@valence.studio', 'f4d65b2483b34a8d50bcf2c9e053077c4dc7c00b65008ce1988ce4eca45741c8', 'customer')
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO coupons (code, discount_percent, valid_until, active) VALUES
  ('VALENCE20', 20, '2027-12-31', TRUE),
  ('SS26', 15, '2026-12-31', TRUE),
  ('ARC10', 10, '2026-12-31', FALSE),
  ('DROP24', 25, '2025-01-01', TRUE)
ON DUPLICATE KEY UPDATE discount_percent = VALUES(discount_percent);

INSERT INTO products (id, title, slug, description, category, price_cents, compare_at_price_cents, featured, rating, reviews_count) VALUES
  ('p1', 'Obsidian Shell Parka', 'obsidian-shell-parka', 'A matte 3-layer shell with a couture shoulder and a hood that disappears in clear weather.', 'Outerwear', 89000, 98000, TRUE, 4.7, 3),
  ('p2', 'Arc-Form Cargo Trouser', 'arc-form-cargo-trouser', 'A tapered cargo with a clean front and articulated knees, built to move under a shell.', 'Bottoms', 42000, NULL, TRUE, 4.7, 3),
  ('p3', 'Voltage Knit Crew', 'voltage-knit-crew', 'A dense merino crew with a technical hand and a voltage option that reads as pigment, not a logo.', 'Knits', 28000, NULL, FALSE, 4.7, 3),
  ('p4', 'Nightfall Modular Vest', 'nightfall-modular-vest', 'A limited vest with a concealed placket and pockets mapped for a passport, a phone, and nothing else.', 'Layering', 64000, NULL, TRUE, 4.7, 3),
  ('p5', 'Bone Technical Tee', 'bone-technical-tee', 'A heavy jersey tee with a taller collar and a bone dye that stays clean under a shell.', 'Tops', 16000, NULL, FALSE, 4.7, 3),
  ('p6', 'Glacier Expedition Boot', 'glacier-expedition-boot', 'A waterproof boot with a slim last, built for wet cities and cold platforms.', 'Footwear', 52000, NULL, TRUE, 4.7, 3),
  ('p7', 'Signal Crossbody 02', 'signal-crossbody-02', 'A compact crossbody in bonded nylon with a lime interior and a strap that disappears under a coat.', 'Objects', 34000, 38000, FALSE, 4.7, 3),
  ('p8', 'Helix Insulation Jacket', 'helix-insulation-jacket', 'A baffled insulator that compresses into its own pocket and still reads as a coat.', 'Layering', 76000, 84000, TRUE, 4.7, 3)
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO product_images (id, product_id, image_url, sort_order) VALUES
  ('p1-img-0', 'p1', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p1-img-1', 'p1', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1600&h=2000&q=80', 1),
  ('p2-img-0', 'p2', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p2-img-1', 'p2', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1600&h=2000&q=80', 1),
  ('p4-img-0', 'p4', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p6-img-0', 'p6', 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=1600&h=2000&q=80', 1),
  ('p8-img-0', 'p8', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1600&h=2000&q=80', 0)
ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);

INSERT INTO product_variants (id, product_id, sku, size, color, inventory_count, price_offset_cents) VALUES
  ('p1__obsidian__m', 'p1', 'VL-P1-OBS-M', 'M', 'Obsidian', 3, 0),
  ('p1__bone__m', 'p1', 'VL-P1-BON-M', 'M', 'Bone', 8, 0),
  ('p2__ink__m', 'p2', 'VL-P2-INK-M', 'M', 'Ink', 11, 0),
  ('p2__stone__m', 'p2', 'VL-P2-STO-M', 'M', 'Stone', 10, 0),
  ('p4__night__l', 'p4', 'VL-P4-NIG-L', 'L', 'Night', 1, 0),
  ('p6__glacier__m', 'p6', 'VL-P6-GLA-M', 'M', 'Glacier', 8, 0),
  ('p8__ink__l', 'p8', 'VL-P8-INK-L', 'L', 'Ink', 7, 0),
  ('p8__ceramic__m', 'p8', 'VL-P8-CER-M', 'M', 'Ceramic', 5, 2000)
ON DUPLICATE KEY UPDATE inventory_count = VALUES(inventory_count);

INSERT INTO reviews (id, product_id, user_name, rating, comment, verified_purchase, fit) VALUES
  ('rv1', 'p1', 'Mina Albrecht', 5, 'The shell sheds a Tokyo downpour and still looks like tailoring.', TRUE, 'Runs true to size'),
  ('rv4', 'p2', 'Leo March', 5, 'Cargos without the costume.', TRUE, 'Runs true to size'),
  ('rv7', 'p3', 'Elena Voss', 5, 'The voltage dye is adult.', TRUE, 'Runs true to size'),
  ('rv10', 'p4', 'Helen Cho', 5, 'The sling pocket is the entire point of the vest.', TRUE, 'Runs true to size'),
  ('rv16', 'p6', 'Freya Lind', 5, 'Wet platforms, dry socks.', TRUE, 'Runs true to size'),
  ('rv22', 'p8', 'Soren Adey', 5, 'Packs into the pocket and still looks like a coat.', TRUE, 'Runs true to size')
ON DUPLICATE KEY UPDATE rating = VALUES(rating);

-- VALENCE // Autonomous Luxury Commerce
-- Single schema file: sql/valance.sql
--
-- Create database: valance
-- Apply: npm run db:apply  (uses DATABASE_URL — PostgreSQL or MySQL section auto-selected)
--
-- Full 54-SKU catalog: admin login → POST /api/admin/seed

-- [POSTGRESQL]
BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  price_cents INTEGER NOT NULL,
  compare_at_price_cents INTEGER,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  drop_label VARCHAR(32) NOT NULL DEFAULT 'Core',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  color_name VARCHAR(64),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(96) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(64) NOT NULL UNIQUE,
  size VARCHAR(8) NOT NULL,
  color VARCHAR(64) NOT NULL,
  inventory_count INTEGER NOT NULL DEFAULT 0,
  price_offset_cents INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(32) NOT NULL UNIQUE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL DEFAULT '',
  shipping_address_json JSONB NOT NULL,
  shipping_method VARCHAR(16) NOT NULL DEFAULT 'standard',
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL,
  tracking_carrier VARCHAR(64),
  tracking_number VARCHAR(128),
  coupon_code VARCHAR(64),
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  fx_rate NUMERIC(12, 6) NOT NULL DEFAULT 1,
  returned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL,
  variant_id VARCHAR(96),
  title VARCHAR(255) NOT NULL,
  sku VARCHAR(64) NOT NULL DEFAULT '',
  size VARCHAR(8) NOT NULL DEFAULT 'M',
  color VARCHAR(64) NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  fit VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  code VARCHAR(64) PRIMARY KEY,
  discount_percent INTEGER NOT NULL,
  valid_until DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS wishlists (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- Demo credentials (SHA-256 of demo passwords; app also accepts client-side demo login)
-- admin@valence.studio / valence-admin
-- avery@valence.studio / atelier
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('usr_admin', 'Valence Atelier', 'admin@valence.studio', '99c0387d8abecf3009738db1730cef158c4195a6ed77b02f4b072bd1fb917d93', 'admin'),
  ('usr_avery', 'Avery Chen', 'avery@valence.studio', 'f4d65b2483b34a8d50bcf2c9e053077c4dc7c00b65008ce1988ce4eca45741c8', 'customer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO coupons (code, discount_percent, valid_until, active) VALUES
  ('VALENCE20', 20, '2027-12-31', TRUE),
  ('SS26', 15, '2026-12-31', TRUE),
  ('ARC10', 10, '2026-12-31', FALSE),
  ('DROP24', 25, '2025-01-01', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (id, title, slug, description, category, price_cents, compare_at_price_cents, featured, rating, reviews_count) VALUES
  ('p1', 'Obsidian Shell Parka', 'obsidian-shell-parka', 'A matte 3-layer shell with a couture shoulder and a hood that disappears in clear weather.', 'Outerwear', 89000, 98000, TRUE, 4.7, 3),
  ('p2', 'Arc-Form Cargo Trouser', 'arc-form-cargo-trouser', 'A tapered cargo with a clean front and articulated knees, built to move under a shell.', 'Bottoms', 42000, NULL, TRUE, 4.7, 3),
  ('p3', 'Voltage Knit Crew', 'voltage-knit-crew', 'A dense merino crew with a technical hand and a voltage option that reads as pigment, not a logo.', 'Knits', 28000, NULL, FALSE, 4.7, 3),
  ('p4', 'Nightfall Modular Vest', 'nightfall-modular-vest', 'A limited vest with a concealed placket and pockets mapped for a passport, a phone, and nothing else.', 'Layering', 64000, NULL, TRUE, 4.7, 3),
  ('p5', 'Bone Technical Tee', 'bone-technical-tee', 'A heavy jersey tee with a taller collar and a bone dye that stays clean under a shell.', 'Tops', 16000, NULL, FALSE, 4.7, 3),
  ('p6', 'Glacier Expedition Boot', 'glacier-expedition-boot', 'A waterproof boot with a slim last, built for wet cities and cold platforms.', 'Footwear', 52000, NULL, TRUE, 4.7, 3),
  ('p7', 'Signal Crossbody 02', 'signal-crossbody-02', 'A compact crossbody in bonded nylon with a lime interior and a strap that disappears under a coat.', 'Objects', 34000, 38000, FALSE, 4.7, 3),
  ('p8', 'Helix Insulation Jacket', 'helix-insulation-jacket', 'A baffled insulator that compresses into its own pocket and still reads as a coat.', 'Layering', 76000, 84000, TRUE, 4.7, 3),
  ('p9', 'Mono Track Pant', 'mono-track-pant', 'A track pant with no stripe and a matte finish, built for transit and terminals.', 'Bottoms', 31000, NULL, FALSE, 4.7, 3),
  ('p10', 'Cipher Merino Beanie', 'cipher-merino-beanie', 'A dense merino beanie with a short cuff and no logo.', 'Headwear', 14000, NULL, FALSE, 4.7, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, order_number, user_id, customer_email, customer_name, shipping_address_json, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, status, tracking_carrier, tracking_number, currency, created_at) VALUES
  (
    'ord_1001',
    'VL-10421',
    'usr_avery',
    'avery@valence.studio',
    'Avery Chen',
    '{"name":"Avery Chen","line1":"118 Mercer Street","line2":"Atelier 4","city":"Los Angeles","region":"CA","postal":"90013","country":"United States","phone":"+1 213 555 0148"}'::jsonb,
    103000,
    0,
    0,
    8498,
    111498,
    'Delivered',
    'DHL',
    'VL882190442',
    'USD',
    '2026-09-14T15:04:00Z'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, variant_id, title, price_cents, quantity) VALUES
  ('oi_1001', 'ord_1001', 'p1', 'p1__obsidian__m', 'Obsidian Shell Parka', 89000, 1),
  ('oi_1002', 'ord_1001', 'p10', 'p10__obsidian__m', 'Cipher Merino Beanie', 14000, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO wishlists (id, user_id, product_id) VALUES
  ('wl_1', 'usr_avery', 'p1'),
  ('wl_2', 'usr_avery', 'p4')
ON CONFLICT (id) DO NOTHING;

-- Upgrade older VALENCE schemas (no-op on fresh install)
ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS drop_label VARCHAR(32) NOT NULL DEFAULT 'Core';
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS color_name VARCHAR(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(16) NOT NULL DEFAULT 'standard';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fx_rate NUMERIC(12, 6) NOT NULL DEFAULT 1;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku VARCHAR(64) NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size VARCHAR(8) NOT NULL DEFAULT 'M';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color VARCHAR(64) NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMIT;
-- [/POSTGRESQL]

-- [MYSQL]
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
  reviews_count INT NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  drop_label VARCHAR(32) NOT NULL DEFAULT 'Core',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  image_url TEXT NOT NULL,
  color_name VARCHAR(64) NULL,
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
  customer_name VARCHAR(255) NOT NULL DEFAULT '',
  shipping_address_json JSON NOT NULL,
  shipping_method VARCHAR(16) NOT NULL DEFAULT 'standard',
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
  fx_rate DECIMAL(12, 6) NOT NULL DEFAULT 1,
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
  sku VARCHAR(64) NOT NULL DEFAULT '',
  size VARCHAR(8) NOT NULL DEFAULT 'M',
  color VARCHAR(64) NOT NULL DEFAULT '',
  price_cents INT NOT NULL,
  quantity INT NOT NULL,
  image_url TEXT NULL,
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
  ('p10', 'Cipher Merino Beanie', 'cipher-merino-beanie', 'A dense merino beanie with a short cuff and no logo.', 'Headwear', 14000, NULL, FALSE, 4.7, 3)
ON DUPLICATE KEY UPDATE title = VALUES(title);
-- [/MYSQL]

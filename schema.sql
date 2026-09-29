-- VALENCE // Autonomous Luxury Commerce
-- Canonical schema: sql/valance.sql (PostgreSQL + MySQL sections).
-- Quick apply: npm run db:apply
-- This file is kept for compatibility; prefer sql/valance.sql for new installs.

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
  reviews_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_images (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
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
  shipping_address_json JSONB NOT NULL,
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
  returned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL,
  variant_id VARCHAR(96),
  title VARCHAR(255) NOT NULL,
  price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL
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
  ('p8', 'Helix Insulation Jacket', 'helix-insulation-jacket', 'A baffled insulator that compresses into its own pocket and still reads as a coat.', 'Layering', 76000, 84000, TRUE, 4.7, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_images (id, product_id, image_url, sort_order) VALUES
  ('p1-img-0', 'p1', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p1-img-1', 'p1', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1600&h=2000&q=80', 1),
  ('p2-img-0', 'p2', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p2-img-1', 'p2', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1600&h=2000&q=80', 1),
  ('p3-img-0', 'p3', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p3-img-1', 'p3', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1600&h=2000&q=80', 1),
  ('p4-img-0', 'p4', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p4-img-1', 'p4', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&h=2000&q=80', 1),
  ('p5-img-0', 'p5', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p5-img-1', 'p5', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1600&h=2000&q=80', 1),
  ('p6-img-0', 'p6', 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p6-img-1', 'p6', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&h=2000&q=80', 1),
  ('p7-img-0', 'p7', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p7-img-1', 'p7', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1600&h=2000&q=80', 1),
  ('p8-img-0', 'p8', 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1600&h=2000&q=80', 0),
  ('p8-img-1', 'p8', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1600&h=2000&q=80', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, sku, size, color, inventory_count, price_offset_cents) VALUES
  ('p1__obsidian__m', 'p1', 'VL-P1-OBS-M', 'M', 'Obsidian', 3, 0),
  ('p1__obsidian__l', 'p1', 'VL-P1-OBS-L', 'L', 'Obsidian', 11, 0),
  ('p1__bone__m', 'p1', 'VL-P1-BON-M', 'M', 'Bone', 8, 0),
  ('p1__voltage__s', 'p1', 'VL-P1-VOL-S', 'S', 'Voltage', 6, 0),
  ('p2__ink__m', 'p2', 'VL-P2-INK-M', 'M', 'Ink', 11, 0),
  ('p2__ink__l', 'p2', 'VL-P2-INK-L', 'L', 'Ink', 9, 0),
  ('p2__stone__s', 'p2', 'VL-P2-STO-S', 'S', 'Stone', 7, 0),
  ('p2__stone__m', 'p2', 'VL-P2-STO-M', 'M', 'Stone', 10, 0),
  ('p3__voltage__m', 'p3', 'VL-P3-VOL-M', 'M', 'Voltage', 11, 0),
  ('p3__graphite__m', 'p3', 'VL-P3-GRA-M', 'M', 'Graphite', 8, 0),
  ('p3__bone__s', 'p3', 'VL-P3-BON-S', 'S', 'Bone', 6, 0),
  ('p3__bone__l', 'p3', 'VL-P3-BON-L', 'L', 'Bone', 9, 0),
  ('p4__night__m', 'p4', 'VL-P4-NIG-M', 'M', 'Night', 5, 0),
  ('p4__night__l', 'p4', 'VL-P4-NIG-L', 'L', 'Night', 1, 0),
  ('p4__ash__m', 'p4', 'VL-P4-ASH-M', 'M', 'Ash', 7, 0),
  ('p4__ash__s', 'p4', 'VL-P4-ASH-S', 'S', 'Ash', 4, 0),
  ('p5__bone__m', 'p5', 'VL-P5-BON-M', 'M', 'Bone', 12, 0),
  ('p5__bone__s', 'p5', 'VL-P5-BON-S', 'S', 'Bone', 6, 0),
  ('p5__obsidian__m', 'p5', 'VL-P5-OBS-M', 'M', 'Obsidian', 9, 0),
  ('p5__obsidian__l', 'p5', 'VL-P5-OBS-L', 'L', 'Obsidian', 4, 0),
  ('p6__glacier__m', 'p6', 'VL-P6-GLA-M', 'M', 'Glacier', 8, 0),
  ('p6__glacier__l', 'p6', 'VL-P6-GLA-L', 'L', 'Glacier', 5, 0),
  ('p6__black__m', 'p6', 'VL-P6-BLA-M', 'M', 'Black', 7, 0),
  ('p6__black__s', 'p6', 'VL-P6-BLA-S', 'S', 'Black', 4, 0),
  ('p7__black__m', 'p7', 'VL-P7-BLA-M', 'M', 'Black', 10, 0),
  ('p7__black__s', 'p7', 'VL-P7-BLA-S', 'S', 'Black', 6, 0),
  ('p7__lime__m', 'p7', 'VL-P7-LIM-M', 'M', 'Lime', 4, 0),
  ('p7__lime__l', 'p7', 'VL-P7-LIM-L', 'L', 'Lime', 3, 0),
  ('p8__ink__m', 'p8', 'VL-P8-INK-M', 'M', 'Ink', 9, 0),
  ('p8__ink__l', 'p8', 'VL-P8-INK-L', 'L', 'Ink', 7, 0),
  ('p8__ceramic__m', 'p8', 'VL-P8-CER-M', 'M', 'Ceramic', 5, 2000),
  ('p8__ceramic__l', 'p8', 'VL-P8-CER-L', 'L', 'Ceramic', 4, 2000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO reviews (id, product_id, user_name, rating, comment, verified_purchase, fit, created_at) VALUES
  ('rv1', 'p1', 'Mina Albrecht', 5, 'The shell sheds a Tokyo downpour and still looks like tailoring.', TRUE, 'Runs true to size', '2026-09-12'),
  ('rv2', 'p1', 'Jonas Hale', 5, 'Matte hardware, no logo, real membrane.', TRUE, 'Runs true to size', '2026-09-18'),
  ('rv4', 'p2', 'Leo March', 5, 'Cargos without the costume. The taper is exact.', TRUE, 'Runs true to size', '2026-09-09'),
  ('rv5', 'p2', 'Sara Nguyen', 4, 'Ink is deeper than the photo. True through the thigh.', TRUE, 'Runs true to size', '2026-08-30'),
  ('rv7', 'p3', 'Elena Voss', 5, 'The voltage dye is adult. Merino that does not itch.', TRUE, 'Runs true to size', '2026-09-04'),
  ('rv8', 'p3', 'Marcus Pell', 4, 'Graphite is the one I live in.', TRUE, 'Runs true to size', '2026-08-22'),
  ('rv10', 'p4', 'Helen Cho', 5, 'The sling pocket is the entire point of the vest.', TRUE, 'Runs true to size', '2026-09-19'),
  ('rv11', 'p4', 'Andre Silva', 5, 'Night color disappears in a doorway.', TRUE, 'Runs true to size', '2026-09-21'),
  ('rv13', 'p5', 'Owen Blake', 5, 'Heavy enough to hold a shape. Bone stays bone.', TRUE, 'Runs true to size', '2026-07-02'),
  ('rv14', 'p5', 'Camille Orth', 4, 'Collar height is the detail.', TRUE, 'Runs true to size', '2026-08-14'),
  ('rv16', 'p6', 'Freya Lind', 5, 'Wet platforms, dry socks.', TRUE, 'Runs true to size', '2026-09-06'),
  ('rv17', 'p6', 'Nico Alvarez', 5, 'Glacier color is a weapon with the bone tee.', TRUE, 'Runs true to size', '2026-08-19'),
  ('rv19', 'p7', 'Rae Kim', 5, 'It vanishes under the parka. Lime lining is a private joke.', TRUE, 'Runs true to size', '2026-09-10'),
  ('rv20', 'p7', 'Tomas Ferreira', 4, 'Hardware stays matte.', TRUE, 'Runs true to size', '2026-09-13'),
  ('rv22', 'p8', 'Soren Adey', 5, 'Packs into the pocket and still looks like a coat.', TRUE, 'Runs true to size', '2026-09-17'),
  ('rv23', 'p8', 'Maya Chen', 5, 'Warm, quiet, no puff.', TRUE, 'Runs true to size', '2026-09-20')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, order_number, user_id, customer_email, shipping_address_json, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, status, tracking_carrier, tracking_number, currency, created_at) VALUES
  (
    'ord_1001',
    'VL-10421',
    'usr_avery',
    'avery@valence.studio',
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

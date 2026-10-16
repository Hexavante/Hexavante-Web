-- Expansão da loja: novas categorias e campo is_permanent

ALTER TABLE store_items
  ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE store_items
  MODIFY COLUMN category ENUM(
    'TITLE',
    'AVATAR_BORDER',
    'THEME',
    'COSMETIC',
    'BOOSTER',
    'PASS',
    'REVIEW_PACK'
  ) NOT NULL;

UPDATE store_items SET is_permanent = FALSE WHERE category = 'BOOSTER';

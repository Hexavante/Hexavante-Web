-- Fase F — Loja: pets e cosméticos de pet

ALTER TABLE store_items
  MODIFY COLUMN category ENUM(
    'TITLE',
    'AVATAR_BORDER',
    'THEME',
    'COSMETIC',
    'BOOSTER',
    'PASS',
    'REVIEW_PACK',
    'PET',
    'PET_COSMETIC'
  ) NOT NULL;

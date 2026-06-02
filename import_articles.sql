-- ============================================================
--  IMPORT ARTICLES — Dind'Or
--  Depuis tableau de stock (colonne ARTICLE = code_article)
--  Exécuter dans psql ou pgAdmin sur la base dindorpfe
-- ============================================================

INSERT INTO articles (
    code_article,
    designation,
    famille,
    unite,
    stock1,
    prix_achat_ht,
    pump,
    taux_conversion,
    prix_vente,
    tva,
    stock2,
    stock_minimum,
    qte_nbre,
    autre_indir,
    stockez_block,
    produit_special,
    stock_reserve,
    stock_en_attente,
    prix_public,
    date_creation,
    date_modification
) VALUES
-- Famille 1 — Volailles fraîches / transformées
('1',              'CHAWARMA',              '1', 'KG',  190.000,  16.349,  16.223, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('2',              'SCALOPE POULET FRAIS',  '1', 'KG', -832.100,  14.800,   7.500, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('3',              'CUISSE DINDE',          '1', 'KG',  500.220,  11.989,   9.720, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('4',              'POULET PAC C4',         '1', 'KG', -212.999,   7.700,   7.140, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('5',              'SCALOPE 1',             '1', 'KG',    0.000,   8.815,   8.482, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('6',              'BLANQUETTE DINDE',      '1', 'KG',  149.512,   5.289,   6.017, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('7',              'SCALOPE DINDE FRAIS',   '1', 'KG',  231.910,  15.389,  15.189, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('12',             'CUISSE POULET',         '1', 'KG',    3.802,   9.200,   0.000, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('13',             'CHAWARMA POULET',       '1', 'KG',    0.000,  13.529,  13.235, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('30',             'AILERON POULET M',      '1', 'KG',  -23.850,   5.000,   3.000, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('31',             'POULET PAC C3',         '1', 'KG',  206.580,   7.700,   7.500, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('32',             'BLANC DE POULET',       '1', 'KG',    0.000,  12.089,   9.390, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('33',             'COUE DINDE',            '1', 'KG',   -9.775,   5.690,   5.490, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('1990000000010',  'CUISSE DINDE PETIT',    '1', 'KG',   20.000,  10.089,   8.089, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('1990000000011',  'CHAWARMA 1',            '1', 'KG',    0.000,   0.000,   0.000, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('1990000000012',  'ABAT DINDE',            '1', 'KG',    9.720,  20.189,  22.672, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),

-- Famille 2 — Produits panés / transformés
('8',              'SCALOPE POULET PANNE',  '2', 'KG',  -66.060,  18.400,  18.400, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('9',              'CORDON BLEU',           '2', 'KG',  -29.552,  18.000,  18.000, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('10',             'BOULETTE AU FROMAGE',   '2', 'KG',    5.610,  18.400,  18.400, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('34',             'SCALOPE DINDE PANNE',   '2', 'KG',   50.000,  18.300,  18.300, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('37',             'CHIKEN NUGGETS',        '2', 'KG',  -10.260,  17.576,  17.576, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),

-- Famille 4 — Produits laitiers / fromages
('11',             'MOZARELLA MAJESTE 1 KG','4', 'KG', -290.000,   6.700,   6.500, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),

-- Sans famille (vide dans le tableau d'origine)
('35',             'POULET PAC C5',         NULL,'KG',    0.000,   7.800,   7.600, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('36',             'POULET PAC C0',         NULL,'KG',    0.000,   7.700,   7.462, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW()),
('38',             'CCHAWARMA',             NULL,'KG',    0.000,  14.984,  11.556, 1, 0, 0, 0, 0, false, false, false, false, 0, 0, 0, NOW(), NOW())

ON CONFLICT (code_article) DO NOTHING;

-- Vérification
SELECT code_article, designation, famille, stock1, prix_achat_ht, pump
FROM articles
ORDER BY
    CASE WHEN code_article ~ '^\d+$' THEN CAST(code_article AS BIGINT) ELSE 9999999999999 END;

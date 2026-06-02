-- ════════════════════════════════════════════════════════════════════
--  DIND'OR — Seed historique 12 mois (juin 2025 – mai 2026)
--  36 factures achat  (FA-H-0001 … FA-H-0036)
--  36 bons de livraison (BL-H-0001 … BL-H-0036)
--  Exécuter : psql -d dindorpfe -f seed_data.sql
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Corriger les stocks négatifs
-- ─────────────────────────────────────────────────────────────────────
UPDATE articles SET stock1 = 0 WHERE stock1 < 0;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Génération des données historiques
-- ─────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  -- ── IDs articles ──────────────────────────────────────────────────
  v_id_cuisse_dinde    BIGINT;  -- code '3'
  v_id_cuisse_poulet   BIGINT;  -- code '12'
  v_id_poulet_pac_c3   BIGINT;  -- code '31'
  v_id_chiken_nuggets  BIGINT;  -- code '37'
  v_id_scalope_dinde   BIGINT;  -- code '7'

  -- ── Fournisseur / Clients ─────────────────────────────────────────
  v_fourn_id   BIGINT;
  v_fourn_nom  TEXT;

  v_cl1_id   BIGINT;  v_cl1_nom TEXT;  v_cl1_code TEXT;
  v_cl2_id   BIGINT;  v_cl2_nom TEXT;  v_cl2_code TEXT;
  v_cl3_id   BIGINT;  v_cl3_nom TEXT;  v_cl3_code TEXT;

  -- ── Compteurs / boucle ────────────────────────────────────────────
  m        INT;
  fa_seq   INT := 0;
  bl_seq   INT := 0;
  v_fa_id  BIGINT;
  v_fc_id  BIGINT;
  v_date   DATE;
  v_total  NUMERIC(15,3);
  v_num    TEXT;

  -- ── Dates de début de chaque mois (juin 2025 → mai 2026) ─────────
  month_starts DATE[] := ARRAY[
    '2025-06-01'::DATE, '2025-07-01'::DATE, '2025-08-01'::DATE,
    '2025-09-01'::DATE, '2025-10-01'::DATE, '2025-11-01'::DATE,
    '2025-12-01'::DATE, '2026-01-01'::DATE, '2026-02-01'::DATE,
    '2026-03-01'::DATE, '2026-04-01'::DATE, '2026-05-01'::DATE
  ];

  -- ── Prix achat (variation saisonnière, hausse estivale) ──────────
  --                        J     J     A     S     O     N     D     J     F     M     A     M
  pa_cuisse_dinde   NUMERIC[] := ARRAY[11.50,11.70,11.90,12.20,12.40,12.60,12.80,13.00,12.80,12.50,12.20,11.90];
  pa_cuisse_poulet  NUMERIC[] := ARRAY[ 8.50, 8.70, 8.90, 9.10, 9.30, 9.50, 9.70, 9.90, 9.60, 9.30, 9.00, 8.70];
  pa_poulet_pac_c3  NUMERIC[] := ARRAY[ 7.00, 7.20, 7.40, 7.60, 7.80, 8.00, 8.20, 8.00, 7.80, 7.60, 7.40, 7.20];
  pa_chiken_nuggets NUMERIC[] := ARRAY[16.50,16.80,17.00,17.20,17.50,17.80,18.00,18.20,18.00,17.70,17.40,17.00];
  pa_scalope_dinde  NUMERIC[] := ARRAY[14.50,14.80,15.00,15.20,15.50,15.80,16.00,16.20,16.00,15.70,15.40,15.00];

  -- ── Prix vente (marge ~20-25%) ─────────────────────────────────────
  pv_cuisse_dinde   NUMERIC[] := ARRAY[13.80,14.00,14.30,14.70,15.00,15.30,15.50,15.70,15.50,15.10,14.70,14.30];
  pv_cuisse_poulet  NUMERIC[] := ARRAY[10.20,10.40,10.70,11.00,11.20,11.50,11.80,12.00,11.70,11.30,11.00,10.50];
  pv_poulet_pac_c3  NUMERIC[] := ARRAY[ 8.40, 8.60, 8.90, 9.10, 9.40, 9.60, 9.90,10.00, 9.70, 9.40, 9.10, 8.70];
  pv_chiken_nuggets NUMERIC[] := ARRAY[20.00,20.30,20.60,21.00,21.30,21.60,22.00,22.30,22.00,21.60,21.20,20.70];
  pv_scalope_dinde  NUMERIC[] := ARRAY[17.50,17.80,18.10,18.50,18.80,19.20,19.50,19.80,19.50,19.10,18.70,18.20];

BEGIN
  -- ── Résoudre les IDs articles ─────────────────────────────────────
  SELECT id INTO v_id_cuisse_dinde   FROM articles WHERE code_article = '3'  LIMIT 1;
  SELECT id INTO v_id_cuisse_poulet  FROM articles WHERE code_article = '12' LIMIT 1;
  SELECT id INTO v_id_poulet_pac_c3  FROM articles WHERE code_article = '31' LIMIT 1;
  SELECT id INTO v_id_chiken_nuggets FROM articles WHERE code_article = '37' LIMIT 1;
  SELECT id INTO v_id_scalope_dinde  FROM articles WHERE code_article = '7'  LIMIT 1;

  -- ── Résoudre fournisseur ──────────────────────────────────────────
  SELECT id, COALESCE(raison_sociale, 'Fournisseur') INTO v_fourn_id, v_fourn_nom
  FROM fournisseurs ORDER BY id LIMIT 1;

  IF v_fourn_id IS NULL THEN
    RAISE EXCEPTION 'Aucun fournisseur trouvé. Importer les fournisseurs d''abord.';
  END IF;

  -- ── Résoudre clients (3 premiers) ────────────────────────────────
  SELECT id, COALESCE(nom,'Client 1'), COALESCE(code_client,'C001') INTO v_cl1_id, v_cl1_nom, v_cl1_code
  FROM clients ORDER BY id LIMIT 1;

  SELECT id, COALESCE(nom,'Client 2'), COALESCE(code_client,'C002') INTO v_cl2_id, v_cl2_nom, v_cl2_code
  FROM clients ORDER BY id OFFSET 1 LIMIT 1;

  SELECT id, COALESCE(nom,'Client 3'), COALESCE(code_client,'C003') INTO v_cl3_id, v_cl3_nom, v_cl3_code
  FROM clients ORDER BY id OFFSET 2 LIMIT 1;

  -- Si moins de 3 clients, réutiliser le premier
  IF v_cl2_id IS NULL THEN v_cl2_id := v_cl1_id; v_cl2_nom := v_cl1_nom; v_cl2_code := v_cl1_code; END IF;
  IF v_cl3_id IS NULL THEN v_cl3_id := v_cl1_id; v_cl3_nom := v_cl1_nom; v_cl3_code := v_cl1_code; END IF;

  IF v_cl1_id IS NULL THEN
    RAISE EXCEPTION 'Aucun client trouvé. Importer les clients d''abord.';
  END IF;

  RAISE NOTICE 'Fournisseur : % (id=%)', v_fourn_nom, v_fourn_id;
  RAISE NOTICE 'Clients : % | % | %', v_cl1_nom, v_cl2_nom, v_cl3_nom;

  -- ══════════════════════════════════════════════════════════════════
  FOR m IN 1..12 LOOP
  -- ══════════════════════════════════════════════════════════════════

    -- ──────────────────────────────────────────────────────────────
    -- ACHAT 1/3  — 5ème du mois : cuisse dinde + cuisse poulet + poulet pac c3
    -- ──────────────────────────────────────────────────────────────
    fa_seq := fa_seq + 1;
    v_date := month_starts[m] + 4;
    v_num  := 'FA-H-' || LPAD(fa_seq::TEXT, 4, '0');

    INSERT INTO facture_achat (numero_facture, date_facture, fournisseur_id,
      total_brut, total_remise, total_ht, total_tva, timbre_fiscal, net_a_payer, statut)
    VALUES (v_num, v_date, v_fourn_id, 0, 0, 0, 0, 1.000, 1.000, 'VALIDEE')
    RETURNING id INTO v_fa_id;

    INSERT INTO facture_achat_ligne
      (facture_achat_id, code_article, designation, quantite, prix_unitaire_ht,
       remise, prix_remise, tva, total_ht, montant_tva, total_ttc, montant_remise, ordre)
    VALUES
      (v_fa_id, '3',  'CUISSE DINDE',  220.000, pa_cuisse_dinde[m],
       0, pa_cuisse_dinde[m],  0, ROUND(220.000 * pa_cuisse_dinde[m],  3), 0, ROUND(220.000 * pa_cuisse_dinde[m],  3), 0, 1),
      (v_fa_id, '12', 'CUISSE POULET', 300.000, pa_cuisse_poulet[m],
       0, pa_cuisse_poulet[m], 0, ROUND(300.000 * pa_cuisse_poulet[m], 3), 0, ROUND(300.000 * pa_cuisse_poulet[m], 3), 0, 2),
      (v_fa_id, '31', 'POULET PAC C3', 400.000, pa_poulet_pac_c3[m],
       0, pa_poulet_pac_c3[m], 0, ROUND(400.000 * pa_poulet_pac_c3[m], 3), 0, ROUND(400.000 * pa_poulet_pac_c3[m], 3), 0, 3);

    SELECT ROUND(SUM(total_ht), 3) INTO v_total FROM facture_achat_ligne WHERE facture_achat_id = v_fa_id;
    UPDATE facture_achat SET total_brut = v_total, total_ht = v_total, net_a_payer = v_total + 1.000 WHERE id = v_fa_id;

    -- ──────────────────────────────────────────────────────────────
    -- ACHAT 2/3  — 15ème du mois : scalope dinde + chiken nuggets + cuisse dinde
    -- ──────────────────────────────────────────────────────────────
    fa_seq := fa_seq + 1;
    v_date := month_starts[m] + 14;
    v_num  := 'FA-H-' || LPAD(fa_seq::TEXT, 4, '0');

    INSERT INTO facture_achat (numero_facture, date_facture, fournisseur_id,
      total_brut, total_remise, total_ht, total_tva, timbre_fiscal, net_a_payer, statut)
    VALUES (v_num, v_date, v_fourn_id, 0, 0, 0, 0, 1.000, 1.000, 'VALIDEE')
    RETURNING id INTO v_fa_id;

    INSERT INTO facture_achat_ligne
      (facture_achat_id, code_article, designation, quantite, prix_unitaire_ht,
       remise, prix_remise, tva, total_ht, montant_tva, total_ttc, montant_remise, ordre)
    VALUES
      (v_fa_id, '7',  'SCALOPE DINDE FRAIS', 180.000, pa_scalope_dinde[m],
       0, pa_scalope_dinde[m],  0, ROUND(180.000 * pa_scalope_dinde[m],  3), 0, ROUND(180.000 * pa_scalope_dinde[m],  3), 0, 1),
      (v_fa_id, '37', 'CHIKEN NUGGETS',      150.000, pa_chiken_nuggets[m],
       0, pa_chiken_nuggets[m], 0, ROUND(150.000 * pa_chiken_nuggets[m], 3), 0, ROUND(150.000 * pa_chiken_nuggets[m], 3), 0, 2),
      (v_fa_id, '3',  'CUISSE DINDE',        150.000, pa_cuisse_dinde[m],
       0, pa_cuisse_dinde[m],   0, ROUND(150.000 * pa_cuisse_dinde[m],   3), 0, ROUND(150.000 * pa_cuisse_dinde[m],   3), 0, 3);

    SELECT ROUND(SUM(total_ht), 3) INTO v_total FROM facture_achat_ligne WHERE facture_achat_id = v_fa_id;
    UPDATE facture_achat SET total_brut = v_total, total_ht = v_total, net_a_payer = v_total + 1.000 WHERE id = v_fa_id;

    -- ──────────────────────────────────────────────────────────────
    -- ACHAT 3/3  — 25ème du mois : poulet pac c3 + cuisse poulet + scalope dinde
    -- ──────────────────────────────────────────────────────────────
    fa_seq := fa_seq + 1;
    v_date := month_starts[m] + 24;
    v_num  := 'FA-H-' || LPAD(fa_seq::TEXT, 4, '0');

    INSERT INTO facture_achat (numero_facture, date_facture, fournisseur_id,
      total_brut, total_remise, total_ht, total_tva, timbre_fiscal, net_a_payer, statut)
    VALUES (v_num, v_date, v_fourn_id, 0, 0, 0, 0, 1.000, 1.000, 'PAYEE')
    RETURNING id INTO v_fa_id;

    INSERT INTO facture_achat_ligne
      (facture_achat_id, code_article, designation, quantite, prix_unitaire_ht,
       remise, prix_remise, tva, total_ht, montant_tva, total_ttc, montant_remise, ordre)
    VALUES
      (v_fa_id, '31', 'POULET PAC C3',       350.000, pa_poulet_pac_c3[m],
       0, pa_poulet_pac_c3[m],  0, ROUND(350.000 * pa_poulet_pac_c3[m],  3), 0, ROUND(350.000 * pa_poulet_pac_c3[m],  3), 0, 1),
      (v_fa_id, '12', 'CUISSE POULET',        250.000, pa_cuisse_poulet[m],
       0, pa_cuisse_poulet[m],  0, ROUND(250.000 * pa_cuisse_poulet[m],  3), 0, ROUND(250.000 * pa_cuisse_poulet[m],  3), 0, 2),
      (v_fa_id, '7',  'SCALOPE DINDE FRAIS',  130.000, pa_scalope_dinde[m],
       0, pa_scalope_dinde[m],  0, ROUND(130.000 * pa_scalope_dinde[m],  3), 0, ROUND(130.000 * pa_scalope_dinde[m],  3), 0, 3);

    SELECT ROUND(SUM(total_ht), 3) INTO v_total FROM facture_achat_ligne WHERE facture_achat_id = v_fa_id;
    UPDATE facture_achat SET total_brut = v_total, total_ht = v_total, net_a_payer = v_total + 1.000 WHERE id = v_fa_id;

    -- ──────────────────────────────────────────────────────────────
    -- BON DE LIVRAISON 1/3  — 7ème du mois (client 1)
    -- cuisse dinde + cuisse poulet + poulet pac c3
    -- ──────────────────────────────────────────────────────────────
    bl_seq := bl_seq + 1;
    v_date := month_starts[m] + 6;
    v_num  := 'BL-H-' || LPAD(bl_seq::TEXT, 4, '0');

    INSERT INTO facture_client (numero_facture, date_facture,
      client_id, client_nom, client_code,
      total_brut, total_remise, total_ht, total_tva, timbre_fiscal, net_a_payer,
      etat_paiement, type_document, solde_sur_facture)
    VALUES (v_num, v_date,
      v_cl1_id, v_cl1_nom, v_cl1_code,
      0, 0, 0, 0, 0, 0,
      'PAYE', 'BON_LIVRAISON', 0)
    RETURNING id INTO v_fc_id;

    INSERT INTO facture_client_ligne
      (facture_client_id, code_article, designation, unite, quantite,
       prix_unitaire_ht, remise, tva, total_ht, montant_tva, montant_remise, prix_revient, ordre)
    VALUES
      (v_fc_id, '3',  'CUISSE DINDE',  'KG', 180.000, pv_cuisse_dinde[m],
       0, 0, ROUND(180.000 * pv_cuisse_dinde[m],  3), 0, 0, pa_cuisse_dinde[m],  1),
      (v_fc_id, '12', 'CUISSE POULET', 'KG', 250.000, pv_cuisse_poulet[m],
       0, 0, ROUND(250.000 * pv_cuisse_poulet[m], 3), 0, 0, pa_cuisse_poulet[m], 2),
      (v_fc_id, '31', 'POULET PAC C3', 'KG', 320.000, pv_poulet_pac_c3[m],
       0, 0, ROUND(320.000 * pv_poulet_pac_c3[m], 3), 0, 0, pa_poulet_pac_c3[m], 3);

    SELECT ROUND(SUM(total_ht), 3) INTO v_total FROM facture_client_ligne WHERE facture_client_id = v_fc_id;
    UPDATE facture_client SET total_brut = v_total, total_ht = v_total, net_a_payer = v_total WHERE id = v_fc_id;

    -- ──────────────────────────────────────────────────────────────
    -- BON DE LIVRAISON 2/3  — 17ème du mois (client 2)
    -- scalope dinde + chiken nuggets
    -- ──────────────────────────────────────────────────────────────
    bl_seq := bl_seq + 1;
    v_date := month_starts[m] + 16;
    v_num  := 'BL-H-' || LPAD(bl_seq::TEXT, 4, '0');

    INSERT INTO facture_client (numero_facture, date_facture,
      client_id, client_nom, client_code,
      total_brut, total_remise, total_ht, total_tva, timbre_fiscal, net_a_payer,
      etat_paiement, type_document, solde_sur_facture)
    VALUES (v_num, v_date,
      v_cl2_id, v_cl2_nom, v_cl2_code,
      0, 0, 0, 0, 0, 0,
      'PAYE', 'BON_LIVRAISON', 0)
    RETURNING id INTO v_fc_id;

    INSERT INTO facture_client_ligne
      (facture_client_id, code_article, designation, unite, quantite,
       prix_unitaire_ht, remise, tva, total_ht, montant_tva, montant_remise, prix_revient, ordre)
    VALUES
      (v_fc_id, '7',  'SCALOPE DINDE FRAIS', 'KG', 140.000, pv_scalope_dinde[m],
       0, 0, ROUND(140.000 * pv_scalope_dinde[m],  3), 0, 0, pa_scalope_dinde[m],  1),
      (v_fc_id, '37', 'CHIKEN NUGGETS',       'KG', 120.000, pv_chiken_nuggets[m],
       0, 0, ROUND(120.000 * pv_chiken_nuggets[m], 3), 0, 0, pa_chiken_nuggets[m], 2);

    SELECT ROUND(SUM(total_ht), 3) INTO v_total FROM facture_client_ligne WHERE facture_client_id = v_fc_id;
    UPDATE facture_client SET total_brut = v_total, total_ht = v_total, net_a_payer = v_total WHERE id = v_fc_id;

    -- ──────────────────────────────────────────────────────────────
    -- BON DE LIVRAISON 3/3  — 27ème du mois (client 3)
    -- cuisse dinde + poulet pac c3 + scalope dinde
    -- ──────────────────────────────────────────────────────────────
    bl_seq := bl_seq + 1;
    v_date := month_starts[m] + 26;
    v_num  := 'BL-H-' || LPAD(bl_seq::TEXT, 4, '0');

    INSERT INTO facture_client (numero_facture, date_facture,
      client_id, client_nom, client_code,
      total_brut, total_remise, total_ht, total_tva, timbre_fiscal, net_a_payer,
      etat_paiement, type_document, solde_sur_facture)
    VALUES (v_num, v_date,
      v_cl3_id, v_cl3_nom, v_cl3_code,
      0, 0, 0, 0, 0, 0,
      'EN_ATTENTE', 'BON_LIVRAISON', 0)
    RETURNING id INTO v_fc_id;

    INSERT INTO facture_client_ligne
      (facture_client_id, code_article, designation, unite, quantite,
       prix_unitaire_ht, remise, tva, total_ht, montant_tva, montant_remise, prix_revient, ordre)
    VALUES
      (v_fc_id, '3',  'CUISSE DINDE',  'KG', 160.000, pv_cuisse_dinde[m],
       0, 0, ROUND(160.000 * pv_cuisse_dinde[m],  3), 0, 0, pa_cuisse_dinde[m],  1),
      (v_fc_id, '31', 'POULET PAC C3', 'KG', 280.000, pv_poulet_pac_c3[m],
       0, 0, ROUND(280.000 * pv_poulet_pac_c3[m], 3), 0, 0, pa_poulet_pac_c3[m], 2),
      (v_fc_id, '7',  'SCALOPE DINDE FRAIS', 'KG', 100.000, pv_scalope_dinde[m],
       0, 0, ROUND(100.000 * pv_scalope_dinde[m], 3), 0, 0, pa_scalope_dinde[m], 3);

    SELECT ROUND(SUM(total_ht), 3) INTO v_total FROM facture_client_ligne WHERE facture_client_id = v_fc_id;
    UPDATE facture_client SET total_brut = v_total, total_ht = v_total, net_a_payer = v_total WHERE id = v_fc_id;

    RAISE NOTICE 'Mois % terminé — FA: %..%, BL: %..%',
      m, fa_seq - 2, fa_seq, bl_seq - 2, bl_seq;

  END LOOP;

  RAISE NOTICE '══════════════════════════════════════════════';
  RAISE NOTICE 'Seed terminé : % factures achat + % bons de livraison insérés.', fa_seq, bl_seq;
  RAISE NOTICE '══════════════════════════════════════════════';

END $$;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────
-- 3. Vérification rapide
-- ─────────────────────────────────────────────────────────────────────
SELECT
  'Factures achat FA-H' AS type,
  COUNT(*) AS nb,
  MIN(date_facture) AS de,
  MAX(date_facture) AS a,
  ROUND(SUM(total_ht), 0) AS ca_total_ht
FROM facture_achat
WHERE numero_facture LIKE 'FA-H-%'

UNION ALL

SELECT
  'Bons livraison BL-H',
  COUNT(*),
  MIN(date_facture),
  MAX(date_facture),
  ROUND(SUM(total_ht), 0)
FROM facture_client
WHERE numero_facture LIKE 'BL-H-%' AND type_document = 'BON_LIVRAISON';

-- Vérifier les stocks négatifs restants
SELECT code_article, designation, stock1
FROM articles
WHERE stock1 < 0;

-- ============================================================
--  IMPORT CLIENTS — Dind'Or
--  Depuis le tableau Excel (CODE TVA = matricule_fiscal)
--  Format code : C26/NNNN  (année 2026)
--  Exécuter dans psql ou pgAdmin sur la base dindorpfe
-- ============================================================

DO $$
DECLARE
  v_prefix  TEXT   := 'C26/%';
  v_year    TEXT   := '26';
  v_seq     BIGINT;
  v_code    TEXT;
  i         INT;

  -- ── Données extraites du tableau ──────────────────────────
  noms  TEXT[] := ARRAY[
    'COPA CABANA',
    'PAPA GRILL',
    'HAMDI',
    'BASSEM HRIZI',
    'ATEF ABIDI',
    'CHAMLI',
    'MON COIN',
    'KING TACOS',
    'BIG FOOD',
    'PIZZA VILLAGE',
    'HATOUM',
    'BABA JOUJA',
    'ALA OMRANI',
    'AHMED SLAMA',
    'RAHEF BOUAZRA',
    'ZOUHAIER ABED',
    'NAWEL BOUSSID',
    'MOHAMED JAZA',
    'HEDI KHALIFA',
    'FAYCEL',
    'MARIEM SAYADA',
    'ANOIR BEN ALI',
    'RAWIA',
    'PASSAGER',
    'YOUSSEF',
    'ALA KERKNI',
    'CHAROUN',
    'SAMI TABOUNA',
    'ESCALADES DES AFFAIRES ET INVESTIS',
    'SADEK YACOUB',
    'MAHMOUD',
    'WAEL ELECTRICIEN',
    'HASSEN BOUAYAKER'
  ];

  -- Matricule fiscal (CODE TVA du tableau)
  mfs  TEXT[] := ARRAY[
    '15938802/W/N/C/000',  -- COPA CABANA
    NULL,                   -- PAPA GRILL
    NULL,                   -- HAMDI (0000 = vide)
    '1741234 XNC',          -- BASSEM HRIZI
    '15024660/G/N/C 000',   -- ATEF ABIDI
    '7439401CN',            -- CHAMLI
    '1778758/T/C/N/000',    -- MON COIN
    NULL,                   -- KING TACOS (3333 = placeholder)
    NULL,                   -- BIG FOOD (4444 = placeholder)
    NULL,                   -- PIZZA VILLAGE (7777777 = placeholder)
    NULL,                   -- HATOUM
    NULL,                   -- BABA JOUJA (00 = vide)
    '1700816MMC000',        -- ALA OMRANI
    NULL,                   -- AHMED SLAMA
    NULL,                   -- RAHEF BOUAZRA
    NULL,                   -- ZOUHAIER ABED
    NULL,                   -- NAWEL BOUSSID
    NULL,                   -- MOHAMED JAZA
    NULL,                   -- HEDI KHALIFA
    NULL,                   -- FAYCEL
    NULL,                   -- MARIEM SAYADA
    NULL,                   -- ANOIR BEN ALI
    NULL,                   -- RAWIA
    NULL,                   -- PASSAGER
    NULL,                   -- YOUSSEF
    NULL,                   -- ALA KERKNI
    NULL,                   -- CHAROUN (000000 = placeholder)
    NULL,                   -- SAMI TABOUNA
    '1857284/W',            -- ESCALADES DES AFFAIRES ET INVESTIS
    NULL,                   -- SADEK YACOUB
    NULL,                   -- MAHMOUD
    NULL,                   -- WAEL ELECTRICIEN
    NULL                    -- HASSEN BOUAYAKER
  ];

  -- Téléphone principal
  tels TEXT[] := ARRAY[
    '58167625',  -- COPA CABANA
    '23043043',  -- PAPA GRILL
    '29256601',  -- HAMDI
    '99900240',  -- BASSEM HRIZI
    '27404108',  -- ATEF ABIDI
    '50155502',  -- CHAMLI
    '50490855',  -- MON COIN
    '52005766',  -- KING TACOS
    '99570434',  -- BIG FOOD
    '55310460',  -- PIZZA VILLAGE
    '20997615',  -- HATOUM
    '94395600',  -- BABA JOUJA
    NULL,        -- ALA OMRANI
    NULL,        -- AHMED SLAMA
    NULL,        -- RAHEF BOUAZRA
    NULL,        -- ZOUHAIER ABED
    NULL,        -- NAWEL BOUSSID
    NULL,        -- MOHAMED JAZA
    NULL,        -- HEDI KHALIFA
    NULL,        -- FAYCEL
    NULL,        -- MARIEM SAYADA
    NULL,        -- ANOIR BEN ALI
    NULL,        -- RAWIA
    NULL,        -- PASSAGER
    NULL,        -- YOUSSEF
    NULL,        -- ALA KERKNI
    NULL,        -- CHAROUN
    NULL,        -- SAMI TABOUNA
    NULL,        -- ESCALADES DES AFFAIRES ET INVESTIS
    NULL,        -- SADEK YACOUB
    NULL,        -- MAHMOUD
    NULL,        -- WAEL ELECTRICIEN
    NULL         -- HASSEN BOUAYAKER
  ];

  -- Adresse
  adrs TEXT[] := ARRAY[
    'HADJ ALI SOUA KSAR HLAL',           -- COPA CABANA
    'KSAR HLEL',                          -- PAPA GRILL
    'KSAR HLEL',                          -- HAMDI
    'KSAR HLEL',                          -- BASSEM HRIZI
    'RUE ELBASRA MOKNINE 5050',           -- ATEF ABIDI
    'RUE HABIB BOURGUIBA',                -- CHAMLI
    'LAMTA',                              -- MON COIN
    'SAYADA',                             -- KING TACOS
    'LAMTA',                              -- BIG FOOD
    'KSIBET EL MEDIOUNI',                 -- PIZZA VILLAGE
    'KSIBET EL MEDIOUNI',                 -- HATOUM
    'KSIBET EL MEDIOUNI',                 -- BABA JOUJA
    'JAMMEL',                             -- ALA OMRANI
    NULL,                                 -- AHMED SLAMA
    'ZAOUET KOUNTECH',                    -- RAHEF BOUAZRA
    'BANNEN',                             -- ZOUHAIER ABED
    'KSIBET',                             -- NAWEL BOUSSID
    'KSIBET',                             -- MOHAMED JAZA
    'KSIBET',                             -- HEDI KHALIFA
    NULL,                                 -- FAYCEL
    NULL,                                 -- MARIEM SAYADA
    'SFAX',                               -- ANOIR BEN ALI
    'BOUHJAR',                            -- RAWIA
    NULL,                                 -- PASSAGER
    'SAHLINE',                            -- YOUSSEF
    'JAMMEL',                             -- ALA KERKNI
    'TBOLBA',                             -- CHAROUN
    'KSIBET EL MEDIOUNI',                 -- SAMI TABOUNA
    'AV NATIONS UNIES KSAR HLEL',         -- ESCALADES DES AFFAIRES ET INVESTIS
    'KSAR HLEL',                          -- SADEK YACOUB
    'SIDI LASMER',                        -- MAHMOUD
    NULL,                                 -- WAEL ELECTRICIEN
    NULL                                  -- HASSEN BOUAYAKER
  ];

  -- Type client (AUTRE / CLIENT_DIVERS / ETATIQUE / AMBULANT)
  types TEXT[] := ARRAY[
    'AUTRE',     -- COPA CABANA
    'AUTRE',     -- PAPA GRILL
    'AUTRE',     -- HAMDI
    'AUTRE',     -- BASSEM HRIZI
    'AUTRE',     -- ATEF ABIDI
    'AUTRE',     -- CHAMLI
    'AUTRE',     -- MON COIN
    'AUTRE',     -- KING TACOS
    'AUTRE',     -- BIG FOOD
    'AUTRE',     -- PIZZA VILLAGE
    'AUTRE',     -- HATOUM
    'AUTRE',     -- BABA JOUJA
    'AUTRE',     -- ALA OMRANI
    'AUTRE',     -- AHMED SLAMA
    'AUTRE',     -- RAHEF BOUAZRA
    'AUTRE',     -- ZOUHAIER ABED
    'AUTRE',     -- NAWEL BOUSSID
    'AUTRE',     -- MOHAMED JAZA
    'AUTRE',     -- HEDI KHALIFA
    'AUTRE',     -- FAYCEL
    'AUTRE',     -- MARIEM SAYADA
    'AUTRE',     -- ANOIR BEN ALI
    'AUTRE',     -- RAWIA
    'AMBULANT',  -- PASSAGER (vente comptant, sans fiche client)
    'AUTRE',     -- YOUSSEF
    'AUTRE',     -- ALA KERKNI
    'AUTRE',     -- CHAROUN
    'AUTRE',     -- SAMI TABOUNA
    'CLIENT_DIVERS', -- ESCALADES DES AFFAIRES ET INVESTIS
    'AUTRE',     -- SADEK YACOUB
    'AUTRE',     -- MAHMOUD
    'AUTRE',     -- WAEL ELECTRICIEN
    'AUTRE'      -- HASSEN BOUAYAKER
  ];

BEGIN
  -- Récupère le dernier numéro de séquence C26/XXXX déjà utilisé
  SELECT COALESCE(MAX(CAST(SPLIT_PART(code_client, '/', 2) AS INTEGER)), 0)
  INTO   v_seq
  FROM   clients
  WHERE  code_client LIKE v_prefix;

  RAISE NOTICE 'Séquence de départ : %', v_seq;

  FOR i IN 1 .. array_length(noms, 1) LOOP
    -- Sauter si un client avec ce nom existe déjà
    IF EXISTS (
      SELECT 1 FROM clients WHERE LOWER(TRIM(nom)) = LOWER(TRIM(noms[i]))
    ) THEN
      RAISE NOTICE 'IGNORÉ (déjà présent) : %', noms[i];
    ELSE
      v_seq  := v_seq + 1;
      v_code := 'C' || v_year || '/' || LPAD(v_seq::TEXT, 4, '0');

      INSERT INTO clients (
        code_client,
        type_client,
        nom,
        telephone,
        adresse,
        matricule_fiscal,
        solde_total_du,
        actif,
        prix_vente,
        devise,
        date_inscription,
        date_creation
      ) VALUES (
        v_code,
        types[i],
        noms[i],
        tels[i],
        adrs[i],
        mfs[i],
        0.000,
        true,
        1,
        'DT',
        CURRENT_DATE,
        NOW()
      );

      RAISE NOTICE 'INSÉRÉ : % → %', v_code, noms[i];
    END IF;
  END LOOP;

  RAISE NOTICE '=== Import terminé. % client(s) traité(s). ===', array_length(noms, 1);
END $$;

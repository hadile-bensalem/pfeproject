# Dind'Or IA — Microservice de Prédiction de Prix

Microservice FastAPI Python (port 8001) qui prédit les prix d'achat de volaille
sur le marché tunisien en utilisant un **Gradient Boosting Regressor (GBR)**
enrichi par un calendrier tunisien exact.

## Architecture

```
Angular (4200) → Spring Boot (8099) → POST /predict → FastAPI (8001)
```

## Modèle : GradientBoostingRegressor

### Pourquoi GBR plutôt que Prophet ?

| Critère | Prophet | GBR (nouveau) |
|---------|---------|---------------|
| Dépendances | lourdes (pystan, convertdate…) | scikit-learn uniquement |
| Installation | complexe, souvent cassée | `pip install scikit-learn` |
| Temps d'entraînement | 5-30s par requête | < 1s par requête |
| Contrôle des features | limité aux régresseurs | 22 features personnalisées |
| Calendrier tunisien | approximatif | dates exactes codées en dur |

### Paramètres GBR

```python
n_estimators=150, max_depth=3, learning_rate=0.10,
subsample=0.80, min_samples_leaf=3, random_state=42
```

## 22 Features utilisées

| Catégorie | Features |
|-----------|----------|
| Lags | lag_1, lag_2, lag_3, lag_4 |
| Rolling | roll_mean_4, roll_std_4, roll_mean_8, prix_change |
| Temps | t (tendance linéaire), month, week_num |
| Calendrier | is_ramadan, is_aid_fitr, is_aid_adha, is_ferie, is_vacances_ete, is_vacances_scol, is_chaleur, is_grand_froid, is_fetes_fin |
| Météo/Saison | temp_normale, facteur_saison |

## Pipeline de prédiction

1. **preprocess** — nettoyage, filtre 3σ, agrégation hebdomadaire pondérée par quantité
2. **build_features** — construction des 22 features
3. **train_model** — walk-forward (80% train / 20% test), métriques MAE + MAPE + précision directionnelle
4. **predict_recursive** — prédiction semaine par semaine avec correction saisonnière
5. **compute_recommendation** — ACHETER_MAINTENANT / ATTENDRE / ACHETER_PROGRESSIVEMENT / SURVEILLER
6. **build_forecast_chart** — courbe continue J0→J+30 pour le graphique Angular

## Fallback

Si moins de **8 semaines** d'historique disponibles → régression linéaire pondérée
+ correction saisonnière tunisienne (confiance plafonnée à 0.55).

## Calendrier tunisien (tunisian_calendar.py)

Données exactes codées en dur pour 2025-2027 :
- Ramadan, Aïd el-Fitr, Aïd el-Adha
- 8 jours fériés nationaux fixes
- Vacances scolaires (hiver/printemps/été/automne)
- Facteurs saisonniers avicoles par mois (base REF ≈ 1.069)

## Installation

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Test rapide

```bash
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "article": "CUISSE DINDE",
    "historique": [
      {"date":"2025-05-07","prix":9.966,"quantite":405.25},
      {"date":"2025-05-14","prix":10.20,"quantite":320.00},
      {"date":"2025-05-21","prix":10.50,"quantite":280.00},
      {"date":"2025-05-28","prix":9.80,"quantite":410.00},
      {"date":"2025-06-04","prix":10.10,"quantite":350.00},
      {"date":"2025-06-11","prix":10.40,"quantite":390.00},
      {"date":"2025-06-18","prix":10.80,"quantite":420.00},
      {"date":"2025-06-25","prix":11.00,"quantite":380.00},
      {"date":"2025-07-02","prix":11.20,"quantite":310.00},
      {"date":"2025-07-09","prix":11.50,"quantite":295.00}
    ],
    "horizons": [7, 15, 30]
  }'
```

## Format de réponse

Champs retournés : `article`, `prix_actuel`, `predictions` (liste avec
`horizon_jours`, `date_pred`, `prix_predit`, `prix_min`, `prix_max`, `delta_pct`),
`tendance`, `recommendation`, `confiance`, `message`, `periode_courante`,
`historique`, `forecast_chart`, `modele`, `nb_points_db`, `nb_points_total`, `meteo`.

"""
Moteur de prédiction GBR — GradientBoostingRegressor + Calendrier Tunisien.
Remplace entièrement Prophet. Aucune dépendance externe complexe.

Pipeline :
  preprocess → build_features → train_model → predict_recursive
  → compute_recommendation → build_forecast_chart
"""
from __future__ import annotations

import math
from datetime import timedelta

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error

from tunisian_calendar import (
    apply_seasonal_correction,
    get_event_features,
)

# ── Constantes de configuration ────────────────────────────────────────────────
MIN_WEEKS      = 8      # semaines minimum pour activer GBR (sinon fallback linéaire)
BUY_THRESHOLD  = 2.0    # % hausse → ACHETER_MAINTENANT
HOLD_THRESHOLD = -1.0   # % baisse → ATTENDRE
CONF_CAP       = 0.97   # plafond absolu du score de confiance

# Cache simple : évite de ré-entraîner si les données n'ont pas changé
# Clé = (article, n_semaines, last_date, last_prix)
_model_cache: dict[tuple, dict] = {}

GBR_PARAMS = {
    "n_estimators"    : 150,
    "max_depth"       : 3,
    "learning_rate"   : 0.10,
    "subsample"       : 0.80,
    "min_samples_leaf": 3,
    "random_state"    : 42,
}

# 22 features utilisées par le modèle
FEATURE_COLS = [
    # Lags — mémoire des prix passés
    "lag_1", "lag_2", "lag_3", "lag_4",
    # Rolling — tendance et volatilité
    "roll_mean_4", "roll_std_4", "roll_mean_8", "prix_change",
    # Temps — tendance linéaire et saisonnalité calendaire
    "t", "month", "week_num",
    # Calendrier tunisien exact
    "is_ramadan", "is_aid_fitr", "is_aid_adha",
    "is_ferie", "is_vacances_ete", "is_vacances_scol",
    "is_chaleur", "is_grand_froid", "is_fetes_fin",
    # Météo et saison
    "temp_normale", "facteur_saison",
]


# ── Étape 1 : Prétraitement ────────────────────────────────────────────────────

def preprocess(historique: list[dict]) -> pd.DataFrame:
    """Nettoie et agrège les données brutes en semaines pondérées par quantité."""
    if not historique:
        return pd.DataFrame(columns=["date", "prix"])
    df = pd.DataFrame(historique)
    if "quantite" not in df.columns:
        df["quantite"] = 1.0
    df["date"]     = pd.to_datetime(df["date"], dayfirst=True, errors="coerce")
    df["prix"]     = pd.to_numeric(df["prix"], errors="coerce")
    df["quantite"] = pd.to_numeric(df["quantite"], errors="coerce").fillna(1.0)

    df = df.dropna(subset=["date", "prix"])
    df = df[df["prix"] > 0].drop_duplicates()

    # Filtre outliers 3 sigma
    if len(df) >= 4:
        mean_ = df["prix"].mean()
        std_  = df["prix"].std()
        if std_ > 0:
            df = df[(df["prix"] >= mean_ - 3 * std_) & (df["prix"] <= mean_ + 3 * std_)]

    if df.empty:
        return pd.DataFrame(columns=["date", "prix"])

    # Agrégation hebdomadaire avec moyenne pondérée par quantité
    df = df.set_index("date")

    def _weighted_avg(x: pd.DataFrame):
        if len(x) == 0 or x["quantite"].sum() == 0:
            return np.nan
        return float(np.average(x["prix"], weights=x["quantite"]))

    result = df.resample("W").apply(_weighted_avg).dropna().reset_index()
    result.columns = ["date", "prix"]
    result = result.sort_values("date").reset_index(drop=True)

    print(f"[PREPROCESS] {len(result)} semaines après agrégation")
    return result


# ── Étape 2 : Construction des features ───────────────────────────────────────

def build_features(weekly: pd.DataFrame) -> pd.DataFrame:
    """Ajoute les 22 features au DataFrame hebdomadaire."""
    weekly = weekly.copy().reset_index(drop=True)

    weekly["t"]        = range(len(weekly))
    weekly["month"]    = weekly["date"].dt.month
    weekly["week_num"] = weekly["date"].dt.isocalendar().week.astype(int)

    # Lags — prix des semaines précédentes
    for lag in [1, 2, 3, 4]:
        weekly[f"lag_{lag}"] = weekly["prix"].shift(lag)

    # Rolling — calculé sur prix shifté d'1 semaine pour éviter la fuite temporelle
    shifted = weekly["prix"].shift(1)
    weekly["roll_mean_4"] = shifted.rolling(4, min_periods=2).mean()
    weekly["roll_std_4"]  = shifted.rolling(4, min_periods=2).std().fillna(0)
    weekly["roll_mean_8"] = shifted.rolling(8, min_periods=3).mean()
    # Shift avant pct_change pour éviter la fuite temporelle :
    # prix_change[i] = (prix[i-1] - prix[i-2]) / prix[i-2]  ← cohérent avec predict_recursive
    weekly["prix_change"] = weekly["prix"].shift(1).pct_change().fillna(0)

    # Features calendrier tunisien
    ext_features = weekly["date"].apply(lambda d: pd.Series(get_event_features(d)))
    weekly = pd.concat([weekly.reset_index(drop=True),
                        ext_features.reset_index(drop=True)], axis=1)

    weekly = weekly.dropna(subset=["lag_1", "lag_2", "roll_mean_4"])
    weekly[FEATURE_COLS] = weekly[FEATURE_COLS].fillna(0)

    return weekly


# ── Étape 3 : Entraînement du modèle ──────────────────────────────────────────

def train_model(feat_df: pd.DataFrame) -> tuple:
    """
    Entraîne le GBR avec validation walk-forward (20% final pour test).
    Ré-entraîne sur 100% des données pour les prédictions finales.
    """
    X = feat_df[FEATURE_COLS]
    y = feat_df["prix"]

    # Walk-forward : 20% final pour test, jamais vu pendant l'entraînement
    n_test = max(4, len(X) // 5)
    X_tr, X_te = X.iloc[:-n_test], X.iloc[-n_test:]
    y_tr, y_te = y.iloc[:-n_test], y.iloc[-n_test:]

    model = GradientBoostingRegressor(**GBR_PARAMS)
    model.fit(X_tr, y_tr)

    # Métriques honnêtes sur le jeu de test
    preds_test     = model.predict(X_te)
    mae_gbr        = mean_absolute_error(y_te, preds_test)
    mae_naive      = mean_absolute_error(y_te, [float(y_tr.iloc[-1])] * n_test)
    mape           = float(np.mean(np.abs((y_te.values - preds_test) / y_te.values)) * 100)
    ml_beats_naive = bool(mae_gbr < mae_naive)

    # Précision directionnelle — vraie métrique métier
    prev = y.iloc[-n_test - 1:-1].values
    correct_dir = sum(
        1 for i in range(len(preds_test))
        if (preds_test[i] > prev[i]) == (y_te.values[i] > prev[i])
    )
    dir_accuracy = correct_dir / len(preds_test) * 100

    print(f"[GBR] Entraîné sur {len(X_tr)} sem | Testé sur {n_test} sem")
    print(f"[GBR] MAE={mae_gbr:.3f} DT | MAPE={mape:.1f}% | MAE naïf={mae_naive:.3f} DT")
    print(f"[GBR] Précision direction={dir_accuracy:.0f}% | ML utile={'OUI' if ml_beats_naive else 'NON'}")

    # Ré-entraîner sur 100% des données pour les prédictions finales
    model.fit(X, y)

    # Feature importances — triées par importance décroissante
    importances = sorted(
        zip(FEATURE_COLS, model.feature_importances_),
        key=lambda x: x[1], reverse=True,
    )
    feature_importances = {k: round(float(v), 4) for k, v in importances}

    metrics = {
        "MAE_DT"              : round(mae_gbr, 4),
        "MAPE_pct"            : round(mape, 2),
        "MAE_naive_DT"        : round(mae_naive, 4),
        "dir_accuracy_pct"    : round(dir_accuracy, 1),
        "ml_beats_naive"      : ml_beats_naive,
        "n_train"             : int(len(X_tr)),
        "n_test"              : int(n_test),
        "feature_importances" : feature_importances,
    }
    return model, metrics, feat_df


# ── Étape 4 : Prédiction récursive ────────────────────────────────────────────

def predict_recursive(model, weekly: pd.DataFrame,
                      feat_df: pd.DataFrame,
                      horizons: list[int]) -> list[dict]:
    """
    Prédiction récursive semaine par semaine.
    Chaque prix prédit devient le lag_1 de la semaine suivante.
    """
    last_date = weekly["date"].iloc[-1]
    last_prix = float(weekly["prix"].iloc[-1])
    last_t    = int(feat_df["t"].iloc[-1])
    buf       = weekly["prix"].tolist()[-8:]  # buffer des 8 derniers prix réels

    step_preds = {0: last_prix}
    n_weeks    = math.ceil(max(horizons) / 7)

    for w in range(1, n_weeks + 1):
        fut_date = last_date + timedelta(weeks=w)
        ext      = get_event_features(fut_date)

        row = {
            "lag_1"       : buf[-1],
            "lag_2"       : buf[-2] if len(buf) >= 2 else buf[-1],
            "lag_3"       : buf[-3] if len(buf) >= 3 else buf[-1],
            "lag_4"       : buf[-4] if len(buf) >= 4 else buf[-1],
            "roll_mean_4" : float(np.mean(buf[-4:])),
            "roll_std_4"  : float(np.std(buf[-4:])) if len(buf) >= 2 else 0.0,
            "roll_mean_8" : float(np.mean(buf[-8:])),
            "prix_change" : float((buf[-1] - buf[-2]) / buf[-2])
                            if len(buf) >= 2 and buf[-2] != 0 else 0.0,
            "t"           : last_t + w,
            "month"       : fut_date.month,
            "week_num"    : int(fut_date.isocalendar()[1]),
            **ext,
        }

        feature_vector = [row[f] for f in FEATURE_COLS]
        prix_predit    = float(model.predict([feature_vector])[0])
        buf.append(prix_predit)
        step_preds[w * 7] = prix_predit

    vol     = float(weekly["prix"].tail(8).std()) if len(weekly) >= 2 else 0.0
    results = []

    for h in horizons:
        # Obtenir le prix pour cet horizon (interpolation si nécessaire)
        if h % 7 == 0:
            prix_ml = step_preds.get(h, list(step_preds.values())[-1])
        else:
            w_lo    = (h // 7) * 7
            w_hi    = w_lo + 7
            p_lo    = step_preds.get(w_lo, last_prix)
            p_hi    = step_preds.get(w_hi, list(step_preds.values())[-1])
            prix_ml = p_lo + (h - w_lo) / 7 * (p_hi - p_lo)

        target_date                     = last_date + timedelta(days=h)
        prix_corrige, periode_label, _  = apply_seasonal_correction(prix_ml, target_date)

        ic        = max(vol * 1.2, prix_corrige * 0.04)
        delta_pct = (prix_corrige - last_prix) / last_prix * 100 if last_prix != 0 else 0.0

        results.append({
            "horizon_jours": h,
            "date_pred"    : (last_date + timedelta(days=h)).strftime("%Y-%m-%d"),
            "prix_predit"  : round(prix_corrige, 3),
            "prix_min"     : round(max(0.0, prix_corrige - ic), 3),
            "prix_max"     : round(prix_corrige + ic, 3),
            "delta_pct"    : round(delta_pct, 2),
            "_periode"     : periode_label,  # usage interne uniquement
        })

        print(f"[PREDICT] J+{h} → {prix_corrige:.3f} DT ({delta_pct:+.1f}%) | {periode_label}")

    return results


# ── Étape 5 : Fallback régression linéaire ────────────────────────────────────

def fallback_linear(weekly: pd.DataFrame,
                    horizons: list[int]) -> tuple[list[dict], float]:
    """
    Fallback activé si len(weekly) < MIN_WEEKS.
    Régression linéaire pondérée + correction saisonnière tunisienne.
    """
    prices    = weekly["prix"].values
    n         = len(prices)
    last_prix = float(prices[-1])
    last_date = weekly["date"].iloc[-1]

    if n >= 2:
        weights = np.linspace(0.5, 1.0, n)
        coeffs  = np.polyfit(range(n), prices, deg=1, w=weights)
        slope   = float(coeffs[0])
    else:
        slope = 0.0

    results = []
    for h in horizons:
        prix_ml     = last_prix + slope * (h / 7)
        target_date = last_date + timedelta(days=h)
        prix_corrige, periode_label, _ = apply_seasonal_correction(prix_ml, target_date)

        ic        = prix_corrige * 0.05  # IC fixe ±5% pour le fallback
        delta_pct = (prix_corrige - last_prix) / last_prix * 100 if last_prix != 0 else 0.0

        results.append({
            "horizon_jours": h,
            "date_pred"    : target_date.strftime("%Y-%m-%d"),
            "prix_predit"  : round(prix_corrige, 3),
            "prix_min"     : round(max(0.0, prix_corrige - ic), 3),
            "prix_max"     : round(prix_corrige + ic, 3),
            "delta_pct"    : round(delta_pct, 2),
            "_periode"     : periode_label,
        })

    print(f"[FALLBACK] Régression linéaire activée ({n} semaines < {MIN_WEEKS} minimum)")
    return results, 0.55


# ── Étape 6 : Calcul de la recommandation ─────────────────────────────────────

def compute_recommendation(predictions: list[dict],
                           n_weeks: int,
                           metrics: dict) -> dict:
    """
    Calcule la recommandation d'achat et le score de confiance multi-facteurs.
    """
    if not predictions:
        return {"recommendation": "DONNEES_INSUFFISANTES", "tendance": "stable",
                "confiance": 0.0, "message": "Données insuffisantes pour une recommandation.",
                "periode_courante": "Standard"}
    d7     = predictions[0].get("delta_pct", 0.0)
    d30    = predictions[2].get("delta_pct", 0.0) if len(predictions) >= 3 else predictions[-1].get("delta_pct", 0.0)
    periode = predictions[0]["_periode"]

    # Règle de décision principale
    if d7 > BUY_THRESHOLD:
        reco, tendance, base = "ACHETER_MAINTENANT", "hausse", 0.65
    elif d7 < HOLD_THRESHOLD:
        reco, tendance, base = "ATTENDRE", "baisse", 0.65
    elif -1 <= d7 <= 2 and d30 > 2:
        reco, tendance, base = "ACHETER_PROGRESSIVEMENT", "stable_puis_hausse", 0.60
    else:
        reco, tendance, base = "SURVEILLER", "stable", 0.58

    # Score de confiance multi-facteurs
    s_signal = min(abs(d7) / 15.0, 0.20)
    s_data   = min(n_weeks / 120.0, 1.0) * 0.08

    if periode in ("Ramadan", "Aïd el-Fitr", "Aïd el-Adha"):
        s_saison = 0.04
    elif periode == "Vacances été":
        s_saison = 0.03
    elif periode == "Chaleur estivale":
        s_saison = 0.02
    elif periode in ("Fêtes fin d'année", "Vacances scolaires"):
        s_saison = 0.01
    else:
        s_saison = 0.00

    s_coher   = 0.03 if (d7 * d30 > 0) else 0.00
    confiance = min(base + s_signal + s_data + s_saison + s_coher, CONF_CAP)

    # Si GBR ne bat pas le modèle naïf → plafonner la confiance
    if not metrics.get("ml_beats_naive", True):
        confiance = min(confiance, 0.68)

    messages = {
        "ACHETER_MAINTENANT":
            f"Hausse prévue de {d7:.1f}% sur 7 jours ({periode}). Achetez maintenant.",
        "ATTENDRE":
            f"Baisse prévue de {abs(d7):.1f}% sur 7 jours. Attendez avant d'acheter.",
        "ACHETER_PROGRESSIVEMENT":
            f"Prix stable à court terme. Hausse de {d30:.1f}% prévue à 30 jours ({periode}).",
        "SURVEILLER":
            f"Prix stable ({periode}). Continuez à surveiller l'évolution du marché.",
    }

    print(f"[RECO] {reco} | Confiance={confiance * 100:.0f}% | "
          f"Période={periode} | Direction J+7={d7:+.1f}%")

    return {
        "recommendation"  : reco,
        "tendance"        : tendance,
        "confiance"       : round(confiance, 3),
        "message"         : messages[reco],
        "periode_courante": periode,
    }


# ── Étape 7 : Courbe prévisionnelle pour le graphique Angular ─────────────────

def build_forecast_chart(weekly: pd.DataFrame,
                         predictions: list[dict],
                         last_date) -> list[dict]:
    """Génère 1 point tous les 3 jours entre J0 et J+30 pour le graphique."""
    # Points de base : 1 tous les 3 jours
    dates_chart = [last_date + timedelta(days=i) for i in range(0, 31, 3)]

    # Ajouter les dates exactes des horizons
    for p in predictions:
        if "date_pred" not in p:
            continue
        d = pd.Timestamp(p["date_pred"])
        if d not in dates_chart:
            dates_chart.append(d)

    dates_chart = sorted(set(dates_chart))

    # Points de référence pour l'interpolation : (jours, prix_predit, ic)
    ref_prix    = float(weekly["prix"].iloc[-1])
    horizons_ref = [(0, ref_prix, 0.0)]
    for p in predictions:
        jours = (pd.Timestamp(p["date_pred"]) - last_date).days
        ic    = (p["prix_max"] - p["prix_min"]) / 2
        horizons_ref.append((jours, p["prix_predit"], ic))
    horizons_ref.sort(key=lambda x: x[0])

    chart = []
    for d in dates_chart:
        jours = (d - last_date).days
        if jours < 0:
            continue

        # Trouver les deux bornes encadrantes
        lo = horizons_ref[0]
        hi = horizons_ref[-1]
        for i in range(len(horizons_ref) - 1):
            if horizons_ref[i][0] <= jours <= horizons_ref[i + 1][0]:
                lo = horizons_ref[i]
                hi = horizons_ref[i + 1]
                break

        if hi[0] == lo[0]:
            prix_i = lo[1]
            ic_i   = lo[2]
        else:
            t      = (jours - lo[0]) / (hi[0] - lo[0])
            prix_i = lo[1] + t * (hi[1] - lo[1])
            ic_i   = lo[2] + t * (hi[2] - lo[2])

        date_str = d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d)[:10]
        chart.append({
            "date"        : date_str,
            "prix_predit" : round(prix_i, 3),
            "prix_min"    : round(max(0.0, prix_i - ic_i), 3),
            "prix_max"    : round(prix_i + ic_i, 3),
        })

    return chart


# ── Étape 8 : Fonction principale appelée par FastAPI ─────────────────────────

def predict(historique: list[dict],
            horizons: list[int] = None,
            article: str = "") -> dict:
    """
    Prédit les prix pour les horizons demandés et retourne la réponse complète.
    Format de sortie identique à l'ancien endpoint Prophet.
    """
    if horizons is None:
        horizons = [7, 15, 30]

    horizons = sorted(set(horizons))
    print(f"[START] Article reçu | {len(historique)} points bruts")

    # 1. Preprocessing
    weekly     = preprocess(historique)
    n_semaines = len(weekly)

    if n_semaines == 0:
        raise ValueError("Historique vide après preprocessing")

    last_prix = float(weekly["prix"].iloc[-1])
    last_date = weekly["date"].iloc[-1]

    # 2. Choisir GBR ou Fallback selon le nombre de semaines disponibles
    if n_semaines >= MIN_WEEKS:
        # Clé de cache : article + taille dataset + dernière date + dernier prix
        cache_key = (article, n_semaines,
                     str(weekly["date"].iloc[-1].date()), round(last_prix, 2))
        cached = _model_cache.get(cache_key)

        if cached:
            print(f"[CACHE] Modèle réutilisé pour '{article}'")
            model, metrics, feat_df = cached["model"], cached["metrics"], cached["feat_df"]
        else:
            feat_df                  = build_features(weekly)
            model, metrics, feat_df  = train_model(feat_df)
            _model_cache[cache_key]  = {"model": model, "metrics": metrics, "feat_df": feat_df}
            # Limiter la taille du cache (max 20 articles)
            if len(_model_cache) > 20:
                _model_cache.pop(next(iter(_model_cache)))

        predictions        = predict_recursive(model, weekly, feat_df, horizons)
        confiance_fallback = None
        modele_label       = "GradientBoostingRegressor + Calendrier Tunisien"
    else:
        predictions, confiance_fallback = fallback_linear(weekly, horizons)
        metrics      = {"MAE_DT": None, "ml_beats_naive": False, "dir_accuracy_pct": None,
                        "feature_importances": {}}
        modele_label = "Régression Linéaire + Saisonnalité Tunisienne"

    # 3. Recommandation et confiance
    reco_dict = compute_recommendation(predictions, n_semaines, metrics)
    if confiance_fallback is not None:
        reco_dict["confiance"] = confiance_fallback

    # 4. Courbe prévisionnelle pour Angular
    forecast_chart = build_forecast_chart(weekly, predictions, last_date)

    # 5. Historique formaté — 12 dernières semaines pour le graphique
    historique_formate = [
        {
            "date": row["date"].strftime("%Y-%m-%d"),
            "prix": round(float(row["prix"]), 3),
        }
        for _, row in weekly.tail(12).iterrows()
    ]

    # 6. Supprimer les clés internes avant de retourner
    for p in predictions:
        p.pop("_periode", None)

    # 7. Construire la réponse finale (format identique à l'ancien Prophet)
    response = {
        "article"              : "",   # sera rempli par main.py avec request.article
        "prix_actuel"          : round(last_prix, 3),
        "predictions"          : predictions,
        "tendance"             : reco_dict["tendance"],
        "recommendation"       : reco_dict["recommendation"],
        "confiance"            : reco_dict["confiance"],
        "message"              : reco_dict["message"],
        "periode_courante"     : reco_dict["periode_courante"],
        "historique"           : historique_formate,
        "forecast_chart"       : forecast_chart,
        "modele"               : modele_label,
        "nb_points_db"         : n_semaines,
        "nb_points_total"      : n_semaines,
        "metriques"            : {
            "MAE_DT"          : metrics.get("MAE_DT"),
            "MAPE_pct"        : metrics.get("MAPE_pct"),
            "dir_accuracy_pct": metrics.get("dir_accuracy_pct"),
            "ml_beats_naive"  : metrics.get("ml_beats_naive"),
            "n_train"         : metrics.get("n_train"),
            "n_test"          : metrics.get("n_test"),
        },
        "feature_importances"  : metrics.get("feature_importances", {}),
        "meteo"                : {
            "source"     : "normales_climatiques",
            "temperature": None,
        },
    }

    print(f"[DONE] {reco_dict['recommendation']} | "
          f"Confiance={reco_dict['confiance'] * 100:.0f}%")
    return response
